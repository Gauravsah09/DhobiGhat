import { NextRequest, NextResponse } from 'next/server';
import { initialOrders, initialPriceMatrix, initialClothTypes, initialServices } from '@/lib/initial-data';
import { Order, OrderStatus, GarmentOrderItem } from '@/types';
import { notifyNewOrderIncoming } from '@/lib/fcm';
import { getRequestSession } from '@/lib/auth-server';
import { hasSqlInjection, sanitizeSqlInput, sanitizePhoneNumber } from '@/lib/security';
import { isSupabaseConfigured, getSupabaseAdminClient } from '@/lib/supabase-server';

// Server-side in-memory active order ledger (shared across API routes during runtime / local tests)
declare global {
  var __DHOBIGHAT_ORDERS__: Order[] | undefined;
  var __DHOBIGHAT_PIN_HASHES__: Record<string, string> | undefined;
}

if (!global.__DHOBIGHAT_ORDERS__) {
  global.__DHOBIGHAT_ORDERS__ = [];
}

if (!global.__DHOBIGHAT_PIN_HASHES__) {
  global.__DHOBIGHAT_PIN_HASHES__ = {};
}

export function getSharedOrders(): Order[] {
  if (!global.__DHOBIGHAT_ORDERS__) {
    global.__DHOBIGHAT_ORDERS__ = [];
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

/**
 * Maps database snake_case columns to the typed application Order model
 */
export function mapDbOrderToOrder(row: any): Order {
  const isWalkin =
    row.order_channel === 'walk_in' ||
    row.channel === 'walkin_pos' ||
    row.channel === 'walk_in' ||
    (row.invoice_no && String(row.invoice_no).startsWith('WLK'));
  const effectiveChannel = isWalkin ? 'walk_in' : 'online';

  let items: GarmentOrderItem[] = [];
  if (Array.isArray(row.order_items) && row.order_items.length > 0) {
    items = row.order_items.map((it: any, idx: number) => ({
      id: it.id || `item-${idx}`,
      clothName: it.cloth_name || it.clothName || 'Item',
      serviceName: it.service_name || it.serviceName || 'Wash',
      unitPrice: Number(it.unit_price || it.unitPrice || 0),
      quantity: Number(it.quantity || 1),
      total: Number(it.subtotal || it.total || (Number(it.unit_price || 0) * Number(it.quantity || 1))),
      qcPassed: it.qc_passed !== undefined ? it.qc_passed : (it.qcPassed !== undefined ? it.qcPassed : true),
      stainNote: it.stain_notes || it.stainNote,
    }));
  } else if (Array.isArray(row.items) && row.items.length > 0) {
    items = row.items;
  }

  let pickupAddress = row.pickup_address;
  if (typeof pickupAddress === 'string') {
    try {
      pickupAddress = JSON.parse(pickupAddress);
    } catch {}
  }

  let stageHistory = row.stage_history;
  if (typeof stageHistory === 'string') {
    try {
      stageHistory = JSON.parse(stageHistory);
    } catch {}
  }

  const pickupSlot = row.pickup_slot || (row.pickup_slot_date ? {
    date: row.pickup_slot_date,
    window: row.pickup_slot_window || 'Morning (07:00 AM - 10:00 AM)',
  } : undefined);

  const grandTotal = Number(row.grand_total) || 0;
  const paidAmount = Number(row.paid_amount) || 0;
  const balanceAmount = row.balance_amount !== undefined
    ? Number(row.balance_amount)
    : Math.max(0, grandTotal - paidAmount);

  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    orderChannel: effectiveChannel,
    customerId: row.customer_id || '',
    customerName: row.customer_name || 'Customer',
    customerPhone: row.customer_phone || '',
    customerEmail: row.customer_email || undefined,
    pickupAddress: isWalkin ? undefined : pickupAddress,
    orderDate: row.order_date || (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    deliveryDate: row.delivery_slot_date || row.delivery_date,
    deliverySlotWindow: row.delivery_slot_window,
    pickupSlot,
    items,
    totalQty: row.bag_piece_count || (items.length ? items.reduce((sum, it) => sum + it.quantity, 0) : Number(row.total_qty || 0)),
    subtotal: Number(row.subtotal) || 0,
    discountPct: Number(row.discount_pct) || 0,
    discountAmount: Number(row.discount_amount) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    gstRate: Number(row.gst_rate) || 18,
    gstAmount: Number(row.gst_amount) || 0,
    grandTotal,
    paidAmount,
    balanceAmount,
    paymentMethod: row.payment_method || (isWalkin ? 'bycash' : 'cod'),
    paymentStatus: row.payment_status || 'pending',
    deliveryPin: row.delivery_pin || row.delivery_pin_hash,
    status: row.status || (isWalkin ? 'received' : 'order_received'),
    subStage: row.processing_sub_stage || row.sub_stage || (isWalkin ? 'received' : 'sorting'),
    posDetails: row.pos_details,
    upiTransactionRef: row.upi_transaction_ref || row.payment_ref,
    stageHistory: Array.isArray(stageHistory) ? stageHistory : [],
    remarks: row.remarks || row.notes,
  };
}

function filterSharedOrders(
  status: string | null | undefined,
  channel: string | null | undefined,
  customerPhone: string | null | undefined,
  search: string | null | undefined
): Order[] {
  let list = [...getSharedOrders()];

  if (status && status !== 'all') {
    list = list.filter((o) => o.status === status);
  }

  if (channel && channel !== 'all') {
    list = list.filter((o) => o.orderChannel === channel);
  }

  if (customerPhone) {
    list = list.filter((o) => (o.customerPhone || '').replace(/\D/g, '').endsWith(customerPhone));
  }

  if (search) {
    list = list.filter(
      (o) =>
        o.invoiceNo.toLowerCase().includes(search) ||
        o.customerName.toLowerCase().includes(search) ||
        (o.customerPhone || '').includes(search)
    );
  }

  return list;
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

    let orders: Order[] = [];

    if (isSupabaseConfigured) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

          if (status && status !== 'all') {
            query = query.eq('status', status);
          }

          if (channel && channel !== 'all') {
            const isWalkin = channel === 'walk_in' || channel === 'walkin_pos';
            query = query.or(`order_channel.eq.${channel},channel.eq.${isWalkin ? 'walkin_pos' : 'online_pickup'}`);
          }

          if (customerPhone) {
            query = query.ilike('customer_phone', `%${customerPhone}%`);
          }

          if (search) {
            query = query.or(`invoice_no.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
          }

          const { data, error } = await query;
          if (!error && Array.isArray(data)) {
            orders = data.map((row) => mapDbOrderToOrder(row));
          } else {
            if (error) {
              console.warn('Supabase orders fetch error, falling back to shared memory:', error.message);
            }
            orders = filterSharedOrders(status, channel, customerPhone, search);
          }
        } catch (dbErr: any) {
          console.warn('Supabase orders query exception:', dbErr.message);
          orders = filterSharedOrders(status, channel, customerPhone, search);
        }
      } else {
        orders = filterSharedOrders(status, channel, customerPhone, search);
      }
    } else {
      orders = filterSharedOrders(status, channel, customerPhone, search);
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

    // 3. Generate Cryptographically Secure 4-Digit Delivery PIN using CSPRNG
    let rawDeliveryPin = body.deliveryPin;
    if (!rawDeliveryPin) {
      const pinBuf = new Uint32Array(1);
      globalThis.crypto.getRandomValues(pinBuf);
      rawDeliveryPin = (1000 + (pinBuf[0] % 9000)).toString();
    }

    // 4. Generate Sequential Monotonic Invoice Number based on Channel
    const existingOrders = getSharedOrders();
    let nextInvoiceNo = body.invoiceNo;
    if (!nextInvoiceNo) {
      if (isWalkin) {
        const highestWlk = existingOrders.reduce((max, o) => {
          const match = (o.invoiceNo || '').match(/WLK-(\d+)/);
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 3000);
        nextInvoiceNo = `WLK-${highestWlk + 1}`;
      } else {
        const highestInd = existingOrders.reduce((max, o) => {
          const match = (o.invoiceNo || '').match(/IND-(\d+)/);
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 2400);
        nextInvoiceNo = `IND-${highestInd + 1}`;
      }
    }

    const idPrefix = isWalkin ? 'ord-wlk' : 'ord-onl';
    const newOrderId = body.id || `${idPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
      pickupSlot: body.pickupSlot || (pickupSlotDate ? { date: pickupSlotDate, window: pickupSlotWindow } : undefined),
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

    // 5. Persist to Supabase if configured
    if (isSupabaseConfigured) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          let customerUuid = null;
          const cleanPhone = sanitizePhoneNumber(customerPhone);
          const isCustUuid = body.customerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.customerId);

          if (isCustUuid) {
            customerUuid = body.customerId;
          } else if (cleanPhone) {
            const { data: matchedCust } = await supabase
              .from('customers')
              .select('id')
              .eq('phone', cleanPhone)
              .maybeSingle();
            if (matchedCust?.id) {
              customerUuid = matchedCust.id;
            }
          }

          const dbOrderPayload: Record<string, any> = {
            invoice_no: nextInvoiceNo,
            order_channel: effectiveChannel,
            channel: effectiveChannel === 'walk_in' ? 'walkin_pos' : 'online_pickup',
            customer_id: customerUuid,
            customer_phone: customerPhone,
            customer_name: customerName,
            customer_email: body.customerEmail || null,
            pickup_address: isWalkin ? null : (typeof pickupAddress === 'object' ? JSON.stringify(pickupAddress) : pickupAddress),
            pickup_slot_date: newOrder.pickupSlot?.date || null,
            pickup_slot_window: newOrder.pickupSlot?.window || null,
            delivery_slot_date: newOrder.deliveryDate || null,
            delivery_slot_window: newOrder.deliverySlotWindow || null,
            grand_total: newOrder.grandTotal,
            subtotal: newOrder.subtotal,
            gst_rate: newOrder.gstRate,
            gst_amount: newOrder.gstAmount,
            discount_amount: newOrder.discountAmount,
            paid_amount: newOrder.paidAmount,
            balance_amount: newOrder.balanceAmount,
            payment_method: newOrder.paymentMethod,
            payment_status: newOrder.paymentStatus,
            delivery_pin: rawDeliveryPin,
            delivery_pin_hash: rawDeliveryPin,
            status: effectiveStatus,
            stage_history: newOrder.stageHistory,
            remarks: newOrder.remarks || notes,
            notes: newOrder.remarks || notes,
            bag_piece_count: totalQty,
          };

          let { data: insertedOrder, error: orderInsertErr } = await supabase
            .from('orders')
            .insert(dbOrderPayload)
            .select()
            .single();

          if (orderInsertErr) {
            console.warn('Retrying Supabase order insert with standard schema columns:', orderInsertErr.message);
            const fallbackPayload: Record<string, any> = {
              invoice_no: nextInvoiceNo,
              channel: effectiveChannel === 'walk_in' ? 'walkin_pos' : 'online_pickup',
              customer_id: customerUuid || undefined,
              status: effectiveStatus,
              subtotal: newOrder.subtotal,
              gst_rate: newOrder.gstRate,
              gst_amount: newOrder.gstAmount,
              discount_amount: newOrder.discountAmount,
              grand_total: newOrder.grandTotal,
              paid_amount: newOrder.paidAmount,
              payment_status: newOrder.paymentStatus,
              payment_method: newOrder.paymentMethod,
              delivery_pin_hash: rawDeliveryPin,
              notes: newOrder.remarks || notes,
              bag_piece_count: totalQty,
            };
            const retryRes = await supabase.from('orders').insert(fallbackPayload).select().single();
            if (!retryRes.error && retryRes.data) {
              insertedOrder = retryRes.data;
              orderInsertErr = null;
            }
          }

          const activeOrderId = insertedOrder?.id || newOrderId;
          newOrder.id = activeOrderId;

          // Insert order items
          if (validatedItems.length > 0) {
            const dbItems = validatedItems.map((item) => ({
              order_id: activeOrderId,
              cloth_name: item.clothName,
              service_name: item.serviceName,
              unit_price: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.total,
              qc_passed: item.qcPassed ?? true,
              stain_notes: item.stainNote || null,
            }));

            const { error: itemsErr } = await supabase.from('order_items').insert(dbItems);
            if (itemsErr) {
              console.warn('Failed to insert order_items into Supabase:', itemsErr.message);
            }
          }
        } catch (supErr: any) {
          console.warn('Supabase order creation exception:', supErr.message);
        }
      }
    }

    const filteredExisting = existingOrders.filter((o) => o.id !== newOrder.id && o.invoiceNo !== nextInvoiceNo);
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

// DELETE: Admin can delete stuck orders and invoices for any user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    const isAdmin = session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'store_manager' || session?.role === 'manager';

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Administrator authorization required to delete orders.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let orderId = searchParams.get('id');
    let invoiceNo = searchParams.get('invoiceNo');

    // Also support JSON body if query parameters not in URL
    if (!orderId && !invoiceNo) {
      try {
        const body = await req.json();
        if (body?.id) orderId = body.id;
        if (body?.invoiceNo) invoiceNo = body.invoiceNo;
      } catch {}
    }

    if (!orderId && !invoiceNo) {
      return NextResponse.json(
        { success: false, message: 'Order ID or Invoice Number required for deletion.' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          if (orderId) {
            await supabase.from('orders').delete().eq('id', orderId);
          } else if (invoiceNo) {
            await supabase.from('orders').delete().ilike('invoice_no', invoiceNo);
          }
        } catch (e: any) {
          console.warn('Supabase order deletion error:', e.message);
        }
      }
    }

    const currentOrders = getSharedOrders();
    const target = currentOrders.find(
      (o) => (orderId && o.id === orderId) || (invoiceNo && o.invoiceNo.toLowerCase() === invoiceNo.toLowerCase())
    );

    if (!target) {
      return NextResponse.json(
        { success: false, message: `Order not found in ledger (ID: ${orderId || 'N/A'}, Invoice: ${invoiceNo || 'N/A'}).` },
        { status: 404 }
      );
    }

    // Permanently remove from shared orders
    const remainingOrders = currentOrders.filter((o) => o.id !== target.id);
    setSharedOrders(remainingOrders);

    // Remove PIN hash
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
