import { NextRequest, NextResponse } from 'next/server';
import { getSharedCustomers, setSharedCustomers } from '../route';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customers = getSharedCustomers();
    const customer = customers.find((c) => c.id === id || c.phone.replace(/\D/g, '').endsWith(id));

    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
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
    const body = await req.json();
    const customers = getSharedCustomers();
    const index = customers.findIndex((c) => c.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    const updated = { ...customers[index], ...body, id };
    customers[index] = updated;
    setSharedCustomers(customers);

    return NextResponse.json({ success: true, message: 'Customer account updated', customer: updated });
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
