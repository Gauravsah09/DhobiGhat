import { NextRequest, NextResponse } from 'next/server';
import { initialCustomers } from '@/lib/initial-data';
import { CustomerUser } from '@/types';
import { hasSqlInjection, sanitizeSqlInput, sanitizePhoneNumber } from '@/lib/security';

declare global {
  var __DHOBIGHAT_CUSTOMERS__: CustomerUser[] | undefined;
}

if (!global.__DHOBIGHAT_CUSTOMERS__) {
  global.__DHOBIGHAT_CUSTOMERS__ = [...initialCustomers];
}

export function getSharedCustomers(): CustomerUser[] {
  if (!global.__DHOBIGHAT_CUSTOMERS__) {
    global.__DHOBIGHAT_CUSTOMERS__ = [...initialCustomers];
  }
  return global.__DHOBIGHAT_CUSTOMERS__;
}

export function setSharedCustomers(list: CustomerUser[]) {
  global.__DHOBIGHAT_CUSTOMERS__ = list;
}

// GET /api/customers - List & search customers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase();
    const status = searchParams.get('status');

    if (search && hasSqlInjection(search)) {
      return NextResponse.json({ success: false, message: 'Invalid query parameter.' }, { status: 400 });
    }

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

    return NextResponse.json({
      success: true,
      count: list.length,
      customers: list,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/customers - Create new customer account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, email, walletBalance = 0, address, status = 'enable' } = body;

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

    const newCustomer: CustomerUser = {
      id: body.id || `cust-${Date.now()}`,
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
    };

    setSharedCustomers([newCustomer, ...customers]);

    return NextResponse.json({
      success: true,
      message: 'Customer account created successfully.',
      customer: newCustomer,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PUT /api/customers - Update customer account
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, firstName, lastName, phone, email, walletBalance, status, addresses, defaultAddressId } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Customer ID is required.' }, { status: 400 });
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

    const updatedList = [...customers];
    updatedList[index] = updated;
    setSharedCustomers(updatedList);

    return NextResponse.json({
      success: true,
      message: `Customer account ${updated.firstName} ${updated.lastName} updated successfully.`,
      customer: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE /api/customers - Delete customer account
export async function DELETE(req: NextRequest) {
  try {
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
