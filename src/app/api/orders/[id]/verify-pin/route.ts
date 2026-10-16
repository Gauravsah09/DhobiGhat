import { NextRequest, NextResponse } from 'next/server';
import { getSharedOrders, setSharedOrders, getOrderPinHash } from '@/app/api/orders/route';
import { StageTimestampRecord } from '@/types';
import { notifyCustomerStageUpdate } from '@/lib/fcm';
import { getRequestSession } from '@/lib/auth-server';

// In-memory failed PIN attempt counter (locks at 3 failed attempts)
const failedPinAttempts: Record<string, number> = {};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getRequestSession(req);
    const body = await req.json();
    const { inputPin, paymentMethod, paymentRef, actorName } = body;

    const orders = getSharedOrders();
    const index = orders.findIndex((o) => o.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const order = orders[index];

    // Must be in out_for_delivery or drop_assigned
    if (order.status !== 'out_for_delivery' && order.status !== 'drop_assigned') {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot complete delivery: Order is currently '${order.status}', must be 'out_for_delivery'`,
        },
        { status: 400 }
      );
    }

    // 1. Check for Pre-Paid / Verified Online UPI Bypass
    const isPrePaid = order.paymentStatus === 'paid' || order.paymentMethod === 'online' || order.paymentMethod === 'upi_qr';

    if (!isPrePaid) {
      // 2. Check Brute-Force Lockout
      const currentFailures = failedPinAttempts[id] || 0;
      if (currentFailures >= 3) {
        return NextResponse.json(
          {
            success: false,
            message: 'SECURITY LOCKOUT: 3 consecutive invalid PIN attempts. Please contact store management to verify handover.',
          },
          { status: 403 }
        );
      }

      // 3. Verify PIN
      const storedPin = getOrderPinHash(id) || order.deliveryPin || '1234';
      const cleanInput = String(inputPin || '').trim();

      if (!cleanInput || cleanInput !== storedPin) {
        failedPinAttempts[id] = currentFailures + 1;
        const remaining = 3 - failedPinAttempts[id];
        return NextResponse.json(
          {
            success: false,
            message: `Invalid 4-digit PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before security lockout.`,
          },
          { status: 401 }
        );
      }
    }

    // Reset failed counter on success
    delete failedPinAttempts[id];

    // 4. Update Order to Delivered
    const nowIso = new Date().toISOString();
    const effectiveActor = actorName || session?.fullName || 'Delivery Rider';

    const stageRecord: StageTimestampRecord = {
      stage: 'delivered',
      label: 'Delivered to Customer',
      timestamp: nowIso,
      actorName: effectiveActor,
      notes: isPrePaid
        ? 'Contactless delivery completed: Pre-paid online payment verified'
        : 'Doorstep delivery completed: 4-digit customer security PIN verified successfully',
    };

    const updatedOrder = {
      ...order,
      status: 'delivered' as const,
      paymentStatus: 'paid' as const,
      paidAmount: order.grandTotal,
      paymentMethod: (paymentMethod as any) || order.paymentMethod || 'cod',
      upiTransactionRef: paymentRef || order.upiTransactionRef || (isPrePaid ? 'PREPAID-VERIFIED' : `DOORSTEP-${Date.now()}`),
      lastStageUpdatedAt: nowIso,
      stageHistory: [...(order.stageHistory || []), stageRecord],
    };

    const newOrders = [...orders];
    newOrders[index] = updatedOrder;
    setSharedOrders(newOrders);

    // 5. Notify customer
    notifyCustomerStageUpdate(
      updatedOrder.customerPhone || '',
      updatedOrder.invoiceNo,
      'DELIVERED (Completed)'
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Order #${updatedOrder.invoiceNo} successfully verified and marked Delivered`,
      order: updatedOrder,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
