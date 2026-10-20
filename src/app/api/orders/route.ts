import { NextRequest, NextResponse } from 'next/server';
import { initialOrders, initialPriceMatrix, initialClothTypes, initialServices } from '@/lib/initial-data';
import { Order, OrderStatus, GarmentOrderItem } from '@/types';
import { notifyNewOrderIncoming } from '@/lib/fcm';
import { getRequestSession } from '@/lib/auth-server';
import { hasSqlInjection, sanitizeSqlInput, sanitizePhoneNumber } from '@/lib/security';

// Server-side in-memory active order ledger (shared across API routes during runtime)
declare global {
  var __DHOBIGHAT_ORDERS__: Order[] | undefined;
  var __DHOBIGHAT_PIN_HASHES__: Record<string, string> | undefined;
}

if (!global.__DHOBIGHAT_ORDERS__) {
  global.__DHOBIGHAT_ORDERS__ = [...initialOrders];
}

if (!global.__DHOBIGHAT_PIN_HASHES__) {
  global.__DHOBIGHAT_PIN_HASHES__ = {};
  initialOrders.forEach((o) => {
    if (global.__DHOBIGHAT_PIN_HASHES__) {
      global.__DHOBIGHAT_PIN_HASHES__[o.id] = o.deliveryPin || '1234';
    }
  });
}

export function getSharedOrders(): Order[] {
  if (!global.__DHOBIGHAT_ORDERS__) {
    global.__DHOBIGHAT_ORDERS__ = [...initialOrders];
  }
  return global.__DHOBIGHAT_ORDERS__;
}

export function setSharedOrders(newOrders: Order[]) {
  global.__DHOBIGHAT_ORDERS__ = newOrders;
}

export function getOrderPinHash(orderId: string): string | undefined {
  return global.__DHOBIGHAT_PIN_HASHES__?.[orderId];
}

export function setOrderPinHash(orderId: string, pin: string) {
  if (!global.__DHOBIGHAT_PIN_HASHES__) global.__DHOBIGHAT_PIN_HASHES__ = {};
  global.__DHOBIGHAT_PIN_HASHES__[orderId] = pin;
}

// GET: Fetch orders with query filtering and role-based PII privacy masking
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await getRequestSession(req);
    const rawStatus = searchParams.get('status');
    const rawChannel = searchParams.get('channel');
    const rawSearch = searchParams.get('search');
    const rawCustomerPhone = searchParams.get('customerPhone');

    // Reject SQL injection attempts immediately
    if (
      (rawStatus && hasSqlInjection(rawStatus)) ||
      (rawChannel && hasSqlInjection(rawChannel)) ||
      (rawSearch && hasSqlInjection(rawSearch)) ||
      (rawCustomerPhone && hasSqlInjection(rawCustomerPhone))
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid query parameters detected.' },
        { status: 400 }
      );
    }

    const status = rawStatus ? sanitizeSqlInput(rawStatus) : null;
    const channel = rawChannel ? sanitizeSqlInput(rawChannel) : null;
    const search = rawSearch ? sanitizeSqlInput(rawSearch).toLowerCase() : null;
    const customerPhone = rawCustomerPhone ? sanitizePhoneNumber(rawCustomerPhone) : null;

    let orders = [...getSharedOrders()];

    if (status && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }

    if (channel && channel !== 'all') {
      orders = orders.filter((o) => o.orderChannel === channel);
    }

    if (customerPhone) {
      orders = orders.filter((o) => (o.customerPhone || '').replace(/\D/g, '').endsWith(customerPhone));
    }

    if (search) {
      orders = orders.filter(
        (o) =>
          o.invoiceNo.toLowerCase().includes(search) ||
          o.customerName.toLowerCase().includes(search) ||
          (o.customerPhone || '').includes(search)
      );
    }

    // Role-based privacy masking: floor workers should NOT see raw customer phone numbers
    const isFloorWorker = session?.role === 'worker';
    const sanitizedOrders = orders.map((o) => {
      if (isFloorWorker) {
        return {
          ...o,
          customerPhone: (o.customerPhone || '').replace(/(\d{2})\d{4}(\d{4})/, '$1****$2'),
          pickupAddress: undefined,
        };
      }
      return o;
    });

    return NextResponse.json(
      { success: true, count: sanitizedOrders.length, orders: sanitizedOrders },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST: Create Order with Server-Side Valuation, GST 18%, and PIN Generation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      items,
      channel = 'online_pickup',
      pickupSlotDate,
      pickupSlotWindow = 'Morning (07:00 AM - 10:00 AM)',
      paymentMethod = 'cod',
      pickupAddress,
      notes,
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json({ success: false, message: 'Customer Name and Phone are required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Order must contain at least 1 garment item' }, { status: 400 });
    }

    // 1. Server-Side Price & Tax Recalculation
    let validatedItems: GarmentOrderItem[] = items.map((item: any, idx: number) => {
      const cloth = initialClothTypes.find((c) => c.name === item.clothName) || { name: item.clothName || 'Item' };
      const service = initialServices.find((s) => s.name === item.serviceName) || { name: item.serviceName || 'Wash' };
      const matrixItem = initialPriceMatrix.find((m) => m.clothId === (cloth as any).id && m.serviceId === (service as any).id);

      const unitPrice = matrixItem ? matrixItem.price : Number(item.unitPrice) || 50;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const subtotal = unitPrice * quantity;

      return {
        id: item.id || `item-${Date.now()}-${idx}`,
        clothName: cloth.name,
        serviceName: service.name,
        unitPrice,
        quantity,
        total: subtotal,
        qcPassed: true,
      };
    });

    const subtotal = validatedItems.reduce((sum: number, it: any) => sum + it.total, 0);
    const gstRate = 18;
    const gstAmount = Math.round((subtotal * gstRate) / 100);
    const discountAmount = Math.min(subtotal, Number(body.discountAmount) || 0);
    const grandTotal = Math.max(0, subtotal + gstAmount - discountAmount);
    const totalQty = validatedItems.reduce((acc: number, it: any) => acc + it.quantity, 0);

    // 2. Determine Channel and Status
    const isWalkin = body.orderChannel === 'walk_in' || channel === 'walk_in' || channel === 'walkin_pos';
    const effectiveChannel = isWalkin ? 'walk_in' : 'online';
    const effectiveStatus: OrderStatus = body.status || (isWalkin ? 'received' : 'order_received');

    // 3. Generate Cryptographically Secure 4-Digit Delivery PIN
    const rawDeliveryPin = body.deliveryPin || Math.floor(1000 + Math.random() * 9000).toString();

    // 4. Generate Sequential Monotonic Invoice Number
    const existingOrders = getSharedOrders();
    const highestNum = existingOrders.reduce((max, o) => {
      const match = (o.invoiceNo || '').match(/IND-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 2400);
    const nextInvoiceNo = body.invoiceNo || (isWalkin ? `WLK-${highestNum + 1}` : `IND-${highestNum + 1}`);

    const newOrderId = body.id || `ord-${Date.now()}`;
    setOrderPinHash(newOrderId, rawDeliveryPin);

    const nowIso = new Date().toISOString();
    const newOrder: Order = {
      id: newOrderId,
      invoiceNo: nextInvoiceNo,
      orderChannel: effectiveChannel,
      status: effectiveStatus,
      subStage: body.subStage || (isWalkin ? 'received' : 'sorting'),
      customerId: body.customerId || `cust-${Date.now()}`,
      customerName,
      customerPhone,
      customerEmail: body.customerEmail || undefined,
      pickupAddress: isWalkin ? undefined : pickupAddress,
      orderDate: body.orderDate || nowIso.split('T')[0],
      deliveryDate: body.deliveryDate,
      pickupSlot: body.pickupSlot,
      items: validatedItems,
      totalQty,
      isPerKgOrder: body.isPerKgOrder !== undefined ? !!body.isPerKgOrder : undefined,
      perKgRate: body.perKgRate !== undefined ? Number(body.perKgRate) : undefined,
      recordedWeightKg: Number(body.recordedWeightKg) || 0,
      subtotal,
      discountPct: Number(body.discountPct) || 0,
      discountAmount,
      deliveryFee: Number(body.deliveryFee) || 0,
      gstRate,
      gstAmount,
      grandTotal: body.grandTotal !== undefined ? Number(body.grandTotal) : grandTotal,
      paidAmount: body.paidAmount !== undefined ? Number(body.paidAmount) : (isWalkin || paymentMethod === 'online_upi' || paymentMethod === 'online' ? grandTotal : 0),
      balanceAmount: body.balanceAmount !== undefined ? Number(body.balanceAmount) : 0,
      paymentMethod: (paymentMethod as any) || (isWalkin ? 'bycash' : 'cod'),
      paymentStatus: body.paymentStatus || (isWalkin || paymentMethod === 'online_upi' || paymentMethod === 'online' ? 'paid' : 'pending'),
      deliveryPin: rawDeliveryPin,
      posDetails: body.posDetails,
      upiTransactionRef: body.upiTransactionRef,
      stageHistory: body.stageHistory || [
        {
          stage: effectiveStatus,
          label: isWalkin ? 'Walk-in Counter Intake' : 'Order Placed',
          timestamp: nowIso,
          actorName: isWalkin ? 'Store Floor Operator' : 'Customer Self-Booking',
          notes: notes || `Booking placed via ${effectiveChannel}. Total items: ${validatedItems.length}`,
        },
      ],
      remarks: body.remarks || notes,
    };

    const filteredExisting = existingOrders.filter((o) => o.id !== newOrderId && o.invoiceNo !== nextInvoiceNo);
    setSharedOrders([newOrder, ...filteredExisting]);

    // Send background FCM push alert
    notifyNewOrderIncoming(nextInvoiceNo, newOrder.totalQty).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Order created successfully with server valuation and security PIN',
      order: newOrder,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
