import { NextRequest, NextResponse } from 'next/server';
import { getSharedOrders, setSharedOrders } from '@/app/api/orders/route';
import { OrderStatus, StageTimestampRecord } from '@/types';
import { notifyRiderAssigned } from '@/lib/fcm';
import { getRequestSession } from '@/lib/auth-server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getRequestSession(req);
    const isStaffOrAdmin = session?.role === 'store_operator' || session?.role === 'counter_operator' || session?.role === 'store_manager' || session?.role === 'manager' || session?.role === 'admin' || session?.role === 'super_admin';
    if (!isStaffOrAdmin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: 'Forbidden. Staff authorization required to assign riders.' }, { status: 403 });
    }

    const body = await req.json();
    const { riderName, riderPhone, slotWindow = 'Morning', type = 'pickup', actorName } = body;

    if (!riderName || !riderPhone) {
      return NextResponse.json({ success: false, message: 'Rider Name and Phone are required' }, { status: 400 });
    }

    const orders = getSharedOrders();
    const index = orders.findIndex((o) => o.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const order = orders[index];
    const nowIso = new Date().toISOString();
    const effectiveActor = actorName || session?.fullName || 'Store Operator';

    const isPickup = type === 'pickup';
    const nextStatus: OrderStatus = isPickup ? 'pickup_assigned' : 'drop_assigned';

    const stageRecord: StageTimestampRecord = {
      stage: nextStatus,
      label: isPickup ? 'Pickup Assigned' : 'Drop Assigned',
      timestamp: nowIso,
      actorName: effectiveActor,
      notes: `Assigned ${isPickup ? 'pickup' : 'delivery'} rider ${riderName} (${riderPhone}) for ${slotWindow} slot`,
    };

    const updatedOrder = {
      ...order,
      status: nextStatus,
      ...(isPickup
        ? {
            pickupBy: riderName,
            riderHandover: {
              ...(order.riderHandover || {}),
              riderName,
              riderPhone,
              bagCount: order.totalQty || 1,
              riderWeightKg: order.recordedWeightKg || 0,
            },
          }
        : {
            deliveryBy: riderName,
          }),
      lastStageUpdatedAt: nowIso,
      stageHistory: [...(order.stageHistory || []), stageRecord],
    };

    const newOrders = [...orders];
    newOrders[index] = updatedOrder;
    setSharedOrders(newOrders);

    // Send push notification to rider
    notifyRiderAssigned(riderPhone, updatedOrder.invoiceNo, slotWindow).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Rider ${riderName} successfully assigned to Order #${updatedOrder.invoiceNo}`,
      order: updatedOrder,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
