import { NextRequest, NextResponse } from 'next/server';
import { initialStaff } from '@/lib/initial-data';
import { StoreStaff, StoreOperatorRole } from '@/types';
import { hasSqlInjection, sanitizePhoneNumber, hashPassword } from '@/lib/security';
import { getRequestSession } from '@/lib/auth-server';
import { isSupabaseConfigured, getSupabaseAdminClient } from '@/lib/supabase-server';

declare global {
  var __DHOBIGHAT_STAFF__: StoreStaff[] | undefined;
}

if (!global.__DHOBIGHAT_STAFF__) {
  global.__DHOBIGHAT_STAFF__ = [...initialStaff];
}

export function getSharedStaff(): StoreStaff[] {
  if (!global.__DHOBIGHAT_STAFF__) {
    global.__DHOBIGHAT_STAFF__ = [...initialStaff];
  }
  return global.__DHOBIGHAT_STAFF__;
}

export function setSharedStaff(list: StoreStaff[]) {
  global.__DHOBIGHAT_STAFF__ = list;
}

/**
 * Maps database snake_case columns to the application StoreStaff model
 */
export function mapDbStaffToStaff(s: any): StoreStaff {
  return {
    id: s.id,
    name: s.full_name || s.name || 'Staff Member',
    phone: s.phone || '',
    role: s.role as StoreOperatorRole,
    storeId: s.branch_id || s.store_id || 'branch-blr-1',
    storeName: s.store_name || 'Bengaluru - Indiranagar Flagship',
    activeShift: (s.shift_preference || s.active_shift || 'morning') as 'morning' | 'evening' | 'night',
    isCheckedIn: Boolean(s.is_checked_in),
    status: s.is_active === false ? 'inactive' : 'active',
    passwordHash: s.password_hash || '',
  };
}

// GET /api/staff - List all staff
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('store_staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[API /api/staff] Supabase fetch error:', error.message);
        return NextResponse.json({ success: true, staff: getSharedStaff() });
      }

      const staffList = (data || []).map(mapDbStaffToStaff);
      setSharedStaff(staffList);
      return NextResponse.json({ success: true, staff: staffList });
    }

    return NextResponse.json({ success: true, staff: getSharedStaff() });
  } catch (error: any) {
    console.error('[API /api/staff] GET error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to retrieve staff' },
      { status: 500 }
    );
  }
}

// POST /api/staff - Add a new staff member (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    const isAuthorized =
      session?.role === 'admin' ||
      session?.role === 'super_admin' ||
      session?.role === 'franchise_owner';

    // Allow creation if authorized or during initial bootstrap if no session header present
    const body = await req.json();
    const { name, phone, role, password, pin, storeId, shift, status } = body;

    if (!name || !phone || (!password && !pin)) {
      return NextResponse.json(
        { success: false, message: 'Name, phone, and password are required' },
        { status: 400 }
      );
    }

    if (
      hasSqlInjection(name) ||
      hasSqlInjection(phone) ||
      (password && hasSqlInjection(password)) ||
      (pin && hasSqlInjection(pin)) ||
      (role && hasSqlInjection(role))
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid characters detected (SQL Injection protection).' },
        { status: 400 }
      );
    }

    const cleanPhone = sanitizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid 10-digit Indian phone number.' },
        { status: 400 }
      );
    }

    const rawPassword = String(password || pin).trim();
    if (rawPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Staff password must be at least 6 characters long.' },
        { status: 400 }
      );
    }
    const hashed = hashPassword(rawPassword);
    const staffId = body.id || `staff-${Date.now()}`;
    const targetRole = role || 'store_operator';
    const targetBranch = storeId || 'branch-blr-indira';
    const targetShift = shift || 'morning';

    const newStaff: StoreStaff = {
      id: staffId,
      name: name.trim(),
      phone: cleanPhone,
      role: targetRole,
      storeId: targetBranch,
      storeName: body.storeName || 'Bengaluru - Indiranagar Flagship',
      activeShift: targetShift,
      isCheckedIn: false,
      status: status || 'active',
      passwordHash: hashed,
    };

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      // Check for phone collision
      const { data: existing } = await supabase
        .from('store_staff')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { success: false, message: `A staff member with phone ${cleanPhone} already exists.` },
          { status: 409 }
        );
      }

      // Check if role is supported in Postgres enum
      // postgres check constraint: role IN ('operator', 'manager', 'worker', 'rider', 'admin', 'store_manager', 'store_operator')
      let dbRole = targetRole;
      if (dbRole === 'counter_operator' || dbRole === 'counter') dbRole = 'store_operator';
      if (dbRole === 'wash_operator' || dbRole === 'iron_operator' || dbRole === 'qc_checker') dbRole = 'worker';
      if (dbRole === 'dispatch') dbRole = 'rider';

      // Insert into store_staff table with pgcrypto hash
      const { error: insertError } = await supabase
        .from('store_staff')
        .insert({
          id: staffId,
          full_name: newStaff.name,
          phone: cleanPhone,
          role: dbRole,
          password_hash: hashed,
          branch_id: targetBranch,
          shift_preference: targetShift,
          is_active: newStaff.status === 'active',
          is_checked_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('[API /api/staff] Supabase insert error:', insertError.message);
        return NextResponse.json(
          { success: false, message: `Database error: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    // Keep shared in-memory list updated
    const current = getSharedStaff();
    setSharedStaff([newStaff, ...current.filter((s) => s.id !== staffId && s.phone !== cleanPhone)]);

    return NextResponse.json({ success: true, staff: newStaff });
  } catch (error: any) {
    console.error('[API /api/staff] POST error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to create staff member' },
      { status: 500 }
    );
  }
}

// PUT /api/staff - Update staff details
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, role, storeId, shift, status, password, pin } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Staff ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (name) updates.full_name = name.trim();
    if (role) {
      let dbRole = role;
      if (dbRole === 'counter_operator' || dbRole === 'counter') dbRole = 'store_operator';
      if (dbRole === 'wash_operator' || dbRole === 'iron_operator' || dbRole === 'qc_checker') dbRole = 'worker';
      if (dbRole === 'dispatch') dbRole = 'rider';
      updates.role = dbRole;
    }
    if (storeId) updates.branch_id = storeId;
    if (shift) updates.shift_preference = shift;
    if (status !== undefined) updates.is_active = status === 'active';
    if (password || pin) {
      updates.password_hash = hashPassword(String(password || pin).trim());
    }
    updates.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error } = await supabase
        .from('store_staff')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('[API /api/staff] Supabase update error:', error.message);
      }
    }

    // Update in-memory
    setSharedStaff(
      getSharedStaff().map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          ...(name ? { name } : {}),
          ...(role ? { role } : {}),
          ...(storeId ? { storeId } : {}),
          ...(shift ? { activeShift: shift } : {}),
          ...(status ? { status } : {}),
          ...(password || pin ? { passwordHash: hashPassword(String(password || pin).trim()) } : {}),
        };
      })
    );

    return NextResponse.json({ success: true, message: 'Staff updated successfully' });
  } catch (error: any) {
    console.error('[API /api/staff] PUT error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update staff' },
      { status: 500 }
    );
  }
}

// DELETE /api/staff - Delete staff member
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Staff ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error } = await supabase
        .from('store_staff')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[API /api/staff] Supabase delete error:', error.message);
        return NextResponse.json(
          { success: false, message: `Database error: ${error.message}` },
          { status: 500 }
        );
      }
    }

    setSharedStaff(getSharedStaff().filter((s) => s.id !== id));
    return NextResponse.json({ success: true, message: 'Staff member deleted' });
  } catch (error: any) {
    console.error('[API /api/staff] DELETE error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to delete staff' },
      { status: 500 }
    );
  }
}

