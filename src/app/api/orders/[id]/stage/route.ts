import { NextRequest, NextResponse } from 'next/server';
import { getSharedOrders, setSharedOrders } from '@/app/api/orders/route';
import { OrderStatus, ProcessingSubStage, StageTimestampRecord } from '@/types';
import { notifyCustomerStageUpdate } from '@/lib/fcm';
import { getRequestSession } from '@/lib/auth-server';

// Strict 14-Stage Logistics State Machine Transition Map
const LEGAL_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  order_received: ['pickup_assigned', 'cancelled'],
  pickup_assigned: ['out_for_pickup', 'pickup_assigned', 'cancelled'],
  out_for_pickup: ['picked_up', 'pickup_assigned', 'cancelled'],
  picked_up: ['reached_store'],
  reached_store: ['received'],
  received: ['sorting'],
  sorting: ['washing'],
  washing: ['drying'],
  drying: ['ironing'],
  ironing: ['qc_check_packed'],
  qc_check_packed: ['drop_assigned'],
  drop_assigned: ['out_for_delivery', 'drop_assigned'],
  delivered: ['closed', 'disputed', 'manual_settlement'],
  disputed: ['delivered', 'closed', 'manual_settlement'],
  manual_settlement: ['closed'],
  closed: ['disputed', 'manual_settlement'],
  cancelled: ['manual_settlement'],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params;
    const id = (rawParams?.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const session = await getRequestSession(req);
    const body = await req.json();
    const targetStatus = body.targetStatus || body.status;
    const { subStage, bagPieceCount, bagGrossWeightKg, actorName, notes } = body;

    const orders = getSharedOrders();
    const index = orders.findIndex((o) => o.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const currentOrder = orders[index];
    const currentStatus = currentOrder.status;

    // 1. Verify Legal State Transition (Admin can manually settle from any stage)
    if (targetStatus && targetStatus !== currentStatus) {
      const allowedNext = LEGAL_TRANSITIONS[currentStatus] || [];
      const isManualSettlement = targetStatus === 'manual_settlement';
      if (!isManualSettlement && !allowedNext.includes(targetStatus)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid stage transition: Cannot advance order from '${currentStatus}' directly to '${targetStatus}'. Allowed transitions: ${allowedNext.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    const nextStatus = (targetStatus as OrderStatus) || currentStatus;
    const nextSubStage = (subStage as ProcessingSubStage) || currentOrder.subStage || 'sorting';
    const effectiveActor = actorName || session?.fullName || 'Store Floor Staff';
    const nowIso = new Date().toISOString();

    // 2. Audit Trail Record
    const newStageRecord: StageTimestampRecord = {
      stage: nextStatus,
      label: nextStatus.replace(/_/g, ' ').toUpperCase(),
      timestamp: nowIso,
      actorName: effectiveActor,
      notes: notes || `Order progressed from ${currentStatus} to ${nextStatus}`,
    };

    const updatedOrder = {
      ...currentOrder,
      status: nextStatus,
      subStage: nextSubStage,
      totalQty: bagPieceCount !== undefined ? Number(bagPieceCount) : currentOrder.totalQty,
      recordedWeightKg: bagGrossWeightKg !== undefined ? Number(bagGrossWeightKg) : currentOrder.recordedWeightKg,
      stageHistory: [...(currentOrder.stageHistory || []), newStageRecord],
    };

    const newOrders = [...orders];
    newOrders[index] = updatedOrder;
    setSharedOrders(newOrders);

    // 3. Dispatch customer notification
    notifyCustomerStageUpdate(
      updatedOrder.customerPhone || '',
      updatedOrder.invoiceNo,
      nextStatus.replace(/_/g, ' ').toUpperCase(),
      nextStatus === 'out_for_delivery' ? updatedOrder.deliveryPin : undefined
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Order #${updatedOrder.invoiceNo} successfully advanced to '${nextStatus}'`,
      order: updatedOrder,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export const POST = PATCH;

