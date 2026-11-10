import { NextRequest, NextResponse } from 'next/server';
import { initialCustomers } from '@/lib/initial-data';
import { CustomerUser } from '@/types';
import { hasSqlInjection, sanitizeSqlInput, sanitizePhoneNumber, hashPassword } from '@/lib/security';
import { getRequestSession } from '@/lib/auth-server';
import { isSupabaseConfigured, getSupabaseAdminClient } from '@/lib/supabase-server';

declare global {
  var __DHOBIGHAT_CUSTOMERS__: CustomerUser[] | undefined;
}

if (!global.__DHOBIGHAT_CUSTOMERS__) {
  global.__DHOBIGHAT_CUSTOMERS__ = [];
}

export function getSharedCustomers(): CustomerUser[] {
  if (!global.__DHOBIGHAT_CUSTOMERS__) {
    global.__DHOBIGHAT_CUSTOMERS__ = [];
  }
  return global.__DHOBIGHAT_CUSTOMERS__;
}

export function setSharedCustomers(list: CustomerUser[]) {
  global.__DHOBIGHAT_CUSTOMERS__ = list;
}

/**
 * Maps database snake_case columns to the application CustomerUser model
 */
export function mapDbCustomerToCustomer(c: any): CustomerUser {
  let addresses = c.addresses;
  if (typeof addresses === 'string') {
    try {
      addresses = JSON.parse(addresses);
    } catch {}
  }

  const defaultAddrId = c.default_address_id || `addr-${c.id}`;
  const addressList = Array.isArray(addresses) && addresses.length > 0 ? addresses : [
    {
      id: defaultAddrId,
      flatNo: c.flat_no || '101, Main Block',
      street: c.street || '100ft Road',
      city: c.city || 'Bengaluru',
      state: c.state || 'Karnataka',
      pincode: c.pincode || '560038',
      isDefault: true,
    },
  ];

  return {
    id: c.id,
    phone: c.phone || '',
    firstName: c.first_name || '',
    lastName: c.last_name || '',
    email: c.email || `${c.phone || 'customer'}@dhobighat.in`,
    passwordHash: c.password_hash,
    addresses: addressList,
    defaultAddressId: defaultAddrId,
    walletBalance: Number(c.wallet_balance || 0),
    joinDate: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: c.is_active === false || c.status === 'disable' ? 'disable' : 'enable',
    totalOrders: Number(c.total_orders || 0),
  };
}

function filterSharedCustomers(status: string | null | undefined, search: string | null | undefined): CustomerUser[] {
  let list = [...getSharedCustomers()];

  if (status && (status === 'enable' || status === 'disable')) {
    list = list.filter((c) => c.status === status);
  }

  if (search) {
    list = list.filter(
      (c) =>
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.phone.includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.id.toLowerCase().includes(search)
    );
  }

  return list;
}

// GET /api/customers - List & search customers
export async function GET(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    const isAuthorized = session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'store_manager' || session?.role === 'manager' || session?.role === 'store_operator' || session?.role === 'counter_operator';

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Staff or Administrator access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase();
    const status = searchParams.get('status');

    if (search && hasSqlInjection(search)) {
      return NextResponse.json({ success: false, message: 'Invalid query parameter.' }, { status: 400 });
    }

    let list: CustomerUser[] = [];

    if (isSupabaseConfigured) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          let query = supabase.from('customers').select('*').order('created_at', { ascending: false });

          if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
          }

          const { data, error } = await query;
          if (!error && Array.isArray(data)) {
            list = data.map((c: any) => mapDbCustomerToCustomer(c));
            if (status && (status === 'enable' || status === 'disable')) {
              list = list.filter((c) => c.status === status);
            }
          } else {
            if (error) console.warn('Supabase customers query error:', error.message);
            list = filterSharedCustomers(status, search);
          }
        } catch (dbErr: any) {
          console.warn('Supabase customers query exception:', dbErr.message);
          list = filterSharedCustomers(status, search);
        }
      } else {
        list = filterSharedCustomers(status, search);
      }
    } else {
      list = filterSharedCustomers(status, search);
    }

    // Mask password and hashes in response
    const safeList = list.map((c) => ({
      ...c,
      password: undefined,
      passwordHash: undefined,
    }));

    return NextResponse.json({
      success: true,
      count: safeList.length,
      customers: safeList,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/customers - Create new customer account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, email, walletBalance = 0, address, status = 'enable', password } = body;

    if (!firstName || !phone) {
      return NextResponse.json(
        { success: false, message: 'First Name and 10-digit mobile phone are required.' },
        { status: 400 }
      );
    }

    const cleanPhone = sanitizePhoneNumber(phone);
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid 10-digit Indian phone number.' },
        { status: 400 }
      );
    }

    // Check duplicate phone in Supabase when configured
    if (isSupabaseConfigured) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          const { data: existingSupCust } = await supabase
            .from('customers')
            .select('id, phone')
            .eq('phone', cleanPhone)
            .maybeSingle();

          if (existingSupCust) {
            return NextResponse.json(
              { success: false, message: `A customer account with phone ${cleanPhone} already exists.` },
              { status: 409 }
            );
          }
        } catch (checkErr: any) {
          console.warn('Supabase customer duplication check warning:', checkErr.message);
        }
      }
    }

    const customers = getSharedCustomers();
    const existing = customers.find((c) => c.phone.replace(/\D/g, '').endsWith(cleanPhone));
    if (existing) {
      return NextResponse.json(
        { success: false, message: `A customer account with phone ${cleanPhone} already exists.` },
        { status: 409 }
      );
    }

    const defaultAddressId = `addr-${Date.now()}`;
    const initialAddress = address || {
      id: defaultAddressId,
      flatNo: '101, Main Block',
      street: '100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      isDefault: true,
    };

    const newCustomerId = body.id || `cust-${Date.now()}`;
    const hashedPassword = hashPassword(password || 'Customer@' + cleanPhone.slice(-4));

    const newCustomer: CustomerUser = {
      id: newCustomerId,
      phone: cleanPhone,
      firstName: sanitizeSqlInput(firstName.trim()),
      lastName: sanitizeSqlInput((lastName || '').trim()),
      email: (email || `${cleanPhone}@dhobighat.in`).trim().toLowerCase(),
      addresses: [initialAddress],
      defaultAddressId,
      walletBalance: Number(walletBalance) || 0,
      joinDate: new Date().toISOString().split('T')[0],
      status: status === 'disable' ? 'disable' : 'enable',
      totalOrders: 0,
      passwordHash: hashedPassword,
    };

    if (isSupabaseConfigured) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          const dbPayload: Record<string, any> = {
            phone: cleanPhone,
            first_name: newCustomer.firstName,
            last_name: newCustomer.lastName,
            email: newCustomer.email,
            wallet_balance: newCustomer.walletBalance,
            password_hash: hashedPassword,
            is_verified: true,
          };

          const { data: insertedCust, error: custErr } = await supabase
            .from('customers')
            .insert(dbPayload)
            .select()
            .single();

          if (custErr) {
            // If password_hash column not present in schema yet, fallback without it
            if (custErr.message?.includes('password_hash')) {
              delete dbPayload.password_hash;
              const retryCust = await supabase.from('customers').insert(dbPayload).select().single();
              if (retryCust.data) {
                newCustomer.id = retryCust.data.id;
              }
            } else {
              console.warn('Supabase customer insert warning:', custErr.message);
            }
          } else if (insertedCust) {
            newCustomer.id = insertedCust.id;
          }
        } catch (supCustErr: any) {
          console.warn('Supabase customer insertion exception:', supCustErr.message);
        }
      }
    }

    setSharedCustomers([newCustomer, ...customers]);

    return NextResponse.json({
      success: true,
      message: 'Customer account created successfully.',
      customer: {
        ...newCustomer,
        password: undefined,
        passwordHash: undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PUT /api/customers - Update customer account
export async function PUT(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    const body = await req.json();
    const { id, firstName, lastName, phone, email, walletBalance, status, addresses, defaultAddressId } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Customer ID is required.' }, { status: 400 });
    }

    const isPrivileged = session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'store_manager' || session?.role === 'manager';
    const isSelf = session?.role === 'customer' && session.userId === id;

    if (!isPrivileged && !isSelf) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Authorization required to update customer.' },
        { status: 403 }
      );
    }

    const customers = getSharedCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Customer not found.' }, { status: 404 });
    }

    const existing = customers[index];
    const updated: CustomerUser = {
      ...existing,
      firstName: firstName !== undefined ? sanitizeSqlInput(firstName.trim()) : existing.firstName,
      lastName: lastName !== undefined ? sanitizeSqlInput(lastName.trim()) : existing.lastName,
      phone: phone !== undefined ? sanitizePhoneNumber(phone) : existing.phone,
      email: email !== undefined ? email.trim().toLowerCase() : existing.email,
      walletBalance: walletBalance !== undefined ? Math.max(0, Number(walletBalance) || 0) : existing.walletBalance,
      status: status !== undefined ? (status === 'disable' ? 'disable' : 'enable') : existing.status,
      addresses: addresses !== undefined ? addresses : existing.addresses,
      defaultAddressId: defaultAddressId !== undefined ? defaultAddressId : existing.defaultAddressId,
    };

    if (isSupabaseConfigured) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          const updateData: Record<string, any> = {};
          if (firstName !== undefined) updateData.first_name = updated.firstName;
          if (lastName !== undefined) updateData.last_name = updated.lastName;
          if (phone !== undefined) updateData.phone = updated.phone;
          if (email !== undefined) updateData.email = updated.email;
          if (walletBalance !== undefined && isPrivileged) updateData.wallet_balance = updated.walletBalance;
          if (Object.keys(updateData).length > 0) {
            await supabase.from('customers').update(updateData).eq('id', id);
          }
        } catch (dbErr: any) {
          console.warn('Supabase customer update error:', dbErr.message);
        }
      }
    }

    const updatedList = [...customers];
    updatedList[index] = updated;
    setSharedCustomers(updatedList);

    return NextResponse.json({
      success: true,
      message: `Customer account ${updated.firstName} ${updated.lastName} updated successfully.`,
      customer: {
        ...updated,
        password: undefined,
        passwordHash: undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE /api/customers - Delete customer account
export async function DELETE(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    const isAdmin = session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'store_manager' || session?.role === 'manager';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Administrator authorization required to delete customer accounts.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        if (body?.id) id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'Customer ID is required for deletion.' }, { status: 400 });
    }

    if (isSupabaseConfigured) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          await supabase.from('customers').delete().eq('id', id);
        } catch (dbErr: any) {
          console.warn('Supabase customer deletion error:', dbErr.message);
        }
      }
    }

    const customers = getSharedCustomers();
    const target = customers.find((c) => c.id === id);

    if (!target) {
      return NextResponse.json({ success: false, message: 'Customer account not found.' }, { status: 404 });
    }

    const remaining = customers.filter((c) => c.id !== id);
    setSharedCustomers(remaining);

    return NextResponse.json({
      success: true,
      message: `Customer account (${target.firstName} ${target.lastName}, ${target.phone}) permanently deleted.`,
      deletedId: id,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
