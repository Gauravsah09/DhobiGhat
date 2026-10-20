import { NextRequest, NextResponse } from 'next/server';
import { getSharedOrders, setSharedOrders } from '../route';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orders = getSharedOrders();
    const order = orders.find((o) => o.id === id || o.invoiceNo.toLowerCase() === id.toLowerCase());

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
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
