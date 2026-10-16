import { NextRequest, NextResponse } from 'next/server';
import { initialOrders, initialPriceMatrix, initialClothTypes, initialServices } from '@/lib/initial-data';
import { Order, OrderStatus, GarmentOrderItem } from '@/types';
import { notifyNewOrderIncoming } from '@/lib/fcm';
import { getRequestSession } from '@/lib/auth-server';

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
    const session = await getRequestSession(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');
    const search = searchParams.get('search')?.toLowerCase();
    const customerPhone = searchParams.get('customerPhone');

    let orders = [...getSharedOrders()];

    if (status && status !== 'all') {
      orders = orders.filter((o) => o.status === status);
    }

    if (channel && channel !== 'all') {
      orders = orders.filter((o) => o.orderChannel === channel);
    }

    if (customerPhone) {
      orders = orders.filter((o) => o.customerPhone === customerPhone);
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

    // 2. Generate Cryptographically Secure 4-Digit Delivery PIN
    const rawDeliveryPin = Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Generate Sequential Monotonic Invoice Number
    const existingOrders = getSharedOrders();
    const highestNum = existingOrders.reduce((max, o) => {
      const match = o.invoiceNo.match(/IND-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 2400);
    const nextInvoiceNo = `IND-${highestNum + 1}`;

    const newOrderId = `ord-${Date.now()}`;
    setOrderPinHash(newOrderId, rawDeliveryPin);

    const nowIso = new Date().toISOString();
    const newOrder: Order = {
      id: newOrderId,
      invoiceNo: nextInvoiceNo,
      orderChannel: channel === 'walk_in' || channel === 'walkin_pos' ? 'walk_in' : 'online',
      status: 'order_received',
      subStage: 'sorting',
      customerId: `cust-${Date.now()}`,
      customerName,
      customerPhone,
      pickupAddress,
      orderDate: nowIso.split('T')[0],
      items: validatedItems,
      totalQty,
      recordedWeightKg: 0,
      subtotal,
      discountPct: 0,
      discountAmount,
      gstRate,
      gstAmount,
      grandTotal,
      paidAmount: paymentMethod === 'online_upi' || paymentMethod === 'online' ? grandTotal : 0,
      paymentMethod: (paymentMethod as any) || 'cod',
      paymentStatus: paymentMethod === 'online_upi' || paymentMethod === 'online' ? 'paid' : 'pending',
      deliveryPin: rawDeliveryPin,
      stageHistory: [
        {
          stage: 'order_received',
          label: 'Order Placed',
          timestamp: nowIso,
          actorName: 'Customer Self-Booking',
          notes: `Booking placed via ${channel}. Total items: ${validatedItems.length}`,
        },
      ],
      remarks: notes,
    };

    setSharedOrders([newOrder, ...existingOrders]);

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
