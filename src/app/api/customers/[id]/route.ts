import { NextRequest, NextResponse } from 'next/server';
import { getSharedCustomers, setSharedCustomers } from '../route';
import { getRequestSession } from '@/lib/auth-server';
import { sanitizeSqlInput, sanitizePhoneNumber } from '@/lib/security';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getRequestSession(req);
    const customers = getSharedCustomers();
    const customer = customers.find((c) => c.id === id || c.phone.replace(/\D/g, '').endsWith(id));

    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer account not found' }, { status: 404 });
    }

    const isPrivileged = session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'store_manager' || session?.role === 'manager' || session?.role === 'store_operator' || session?.role === 'counter_operator';
    const isOwner = session?.role === 'customer' && (session.userId === customer.id || (session.phone && customer.phone.replace(/\D/g, '').endsWith(session.phone)));

    if (!isPrivileged && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. You do not have permission to view this customer profile.' },
        { status: 403 }
      );
    }

    // Mask password and internal secrets before returning
    const safeCustomer = {
      ...customer,
      password: undefined,
      passwordHash: undefined,
    };

    return NextResponse.json({ success: true, customer: safeCustomer });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getRequestSession(req);
    const body = await req.json();
    const customers = getSharedCustomers();
    const index = customers.findIndex((c) => c.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    const targetCustomer = customers[index];
    const isPrivileged = session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'store_manager' || session?.role === 'manager';
    const isOwner = session?.role === 'customer' && (session.userId === targetCustomer.id || (session.phone && targetCustomer.phone.replace(/\D/g, '').endsWith(session.phone)));

    if (!isPrivileged && !isOwner) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Authorization required to update this customer account.' },
        { status: 403 }
      );
    }

    // Protect walletBalance and status from tampering by regular users
    const safeUpdates: any = { ...body };
    if (!isPrivileged) {
      delete safeUpdates.walletBalance;
      delete safeUpdates.status;
      delete safeUpdates.id;
    }

    if (safeUpdates.firstName) safeUpdates.firstName = sanitizeSqlInput(safeUpdates.firstName);
    if (safeUpdates.lastName) safeUpdates.lastName = sanitizeSqlInput(safeUpdates.lastName);
    if (safeUpdates.phone) safeUpdates.phone = sanitizePhoneNumber(safeUpdates.phone);

    const updated = { ...targetCustomer, ...safeUpdates, id: targetCustomer.id };
    customers[index] = updated;
    setSharedCustomers(customers);

    return NextResponse.json({
      success: true,
      message: 'Customer account updated',
      customer: { ...updated, password: undefined, passwordHash: undefined },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getRequestSession(req);
    const isAdmin = session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'store_manager' || session?.role === 'manager';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Administrator authorization required to delete customer accounts.' },
        { status: 403 }
      );
    }

    const customers = getSharedCustomers();
    const target = customers.find((c) => c.id === id);

    if (!target) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    const remaining = customers.filter((c) => c.id !== id);
    setSharedCustomers(remaining);

    return NextResponse.json({
      success: true,
      message: `Customer account (${target.firstName} ${target.lastName}) deleted successfully.`,
      deletedId: id,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
