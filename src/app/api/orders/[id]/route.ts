import { NextRequest, NextResponse } from 'next/server';
import { getSharedOrders, setSharedOrders } from '../route';
import { getRequestSession } from '@/lib/auth-server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getRequestSession(req);
    const orders = getSharedOrders();
    const order = orders.find((o) => o.id === id || o.invoiceNo.toLowerCase() === id.toLowerCase());

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const isPrivileged = session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'store_manager' || session?.role === 'manager';
    const isOwner = session?.role === 'customer' && (session.userId === order.customerId || (session.phone && order.customerPhone && order.customerPhone.replace(/\D/g, '').endsWith(session.phone)));

    // Confidentiality Protection: Redact 4-digit handover delivery PIN unless the authenticated user is the order owner or privileged staff
    const sanitizedOrder = (isPrivileged || isOwner)
      ? order
      : { ...order, deliveryPin: undefined };

    return NextResponse.json({ success: true, order: sanitizedOrder });
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
        { success: false, message: 'Forbidden. Administrator authorization required to delete orders.' },
        { status: 403 }
      );
    }

    const orders = getSharedOrders();
    const target = orders.find((o) => o.id === id || o.invoiceNo.toLowerCase() === id.toLowerCase());

    if (!target) {
      return NextResponse.json({ success: false, message: `Order #${id} not found` }, { status: 404 });
    }

    const remaining = orders.filter((o) => o.id !== target.id);
    setSharedOrders(remaining);

    if (global.__DHOBIGHAT_PIN_HASHES__ && target.id in global.__DHOBIGHAT_PIN_HASHES__) {
      delete global.__DHOBIGHAT_PIN_HASHES__[target.id];
    }

    return NextResponse.json({
      success: true,
      message: `Order #${target.invoiceNo} successfully deleted from ledger.`,
      deletedOrderId: target.id,
      deletedInvoiceNo: target.invoiceNo,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
