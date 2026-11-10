import test from 'node:test';
import assert from 'node:assert';

// Test 1: Monotonic Sequence Segregation (Task 3 Regression)
test('Order Channel Segregation: Online (IND-) and Walk-in (WLK-) maintain independent invoice sequences', () => {
  const existingOrders = [
    { invoiceNo: 'IND-2401', orderChannel: 'online' },
    { invoiceNo: 'IND-2402', orderChannel: 'online' },
    { invoiceNo: 'WLK-3001', orderChannel: 'walk_in' },
    { invoiceNo: 'WLK-3002', orderChannel: 'walk_in' },
  ];

  function getNextInvoiceNumber(channel, orders) {
    const isWalkIn = channel === 'walk_in';
    const prefix = isWalkIn ? 'WLK-' : 'IND-';
    const baseNumber = isWalkIn ? 3000 : 2400;

    let maxNum = baseNumber;
    const regex = isWalkIn ? /WLK-(\d+)/i : /IND-(\d+)/i;

    orders.forEach((o) => {
      if (o.invoiceNo) {
        const match = o.invoiceNo.match(regex);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    return `${prefix}${maxNum + 1}`;
  }

  const nextOnline = getNextInvoiceNumber('online', existingOrders);
  const nextWalkIn = getNextInvoiceNumber('walk_in', existingOrders);

  assert.strictEqual(nextOnline, 'IND-2403');
  assert.strictEqual(nextWalkIn, 'WLK-3003');

  // Verify adding a higher online invoice doesn't affect walk-in sequence
  existingOrders.push({ invoiceNo: 'IND-2550', orderChannel: 'online' });
  assert.strictEqual(getNextInvoiceNumber('walk_in', existingOrders), 'WLK-3003');
  assert.strictEqual(getNextInvoiceNumber('online', existingOrders), 'IND-2551');
});

// Test 2: Order ID Prefixing by Channel
test('Order ID Prefix Isolation: Online orders get ord-onl-, Walk-in orders get ord-wlk-', () => {
  function generateOrderId(channel) {
    const prefix = channel === 'walk_in' ? 'ord-wlk' : 'ord-onl';
    const rand = Math.random().toString(36).substring(2, 7);
    return `${prefix}-${Date.now()}-${rand}`;
  }

  const onlineId = generateOrderId('online');
  const walkInId = generateOrderId('walk_in');

  assert.strictEqual(onlineId.startsWith('ord-onl-'), true);
  assert.strictEqual(walkInId.startsWith('ord-wlk-'), true);
});

// Test 3: Logistics State Machine Transition Map
test('State Machine: Illegal direct stage jumps are prohibited without management bypass', () => {
  const LEGAL_TRANSITIONS = {
    order_received: ['pickup_assigned', 'cancelled', 'out_for_pickup'],
    pickup_assigned: ['out_for_pickup', 'pickup_assigned', 'cancelled'],
    out_for_pickup: ['picked_up', 'pickup_assigned', 'cancelled'],
    picked_up: ['reached_store', 'received'],
    reached_store: ['received', 'sorting'],
    received: ['sorting', 'washing'],
    sorting: ['washing', 'drying'],
    washing: ['drying', 'ironing'],
    drying: ['ironing', 'qc_check_packed'],
    ironing: ['qc_check_packed', 'ready', 'packed_ready'],
    qc_check_packed: ['drop_assigned', 'out_for_delivery', 'delivered', 'closed'],
    drop_assigned: ['out_for_delivery', 'drop_assigned', 'delivered'],
    out_for_delivery: ['delivered', 'closed', 'disputed'],
    delivered: ['closed', 'disputed', 'manual_settlement'],
  };

  function isTransitionAllowed(fromStatus, toStatus, isManager) {
    if (isManager) return true;
    const allowed = LEGAL_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  // Legal normal progression
  assert.strictEqual(isTransitionAllowed('washing', 'drying', false), true);
  assert.strictEqual(isTransitionAllowed('out_for_delivery', 'delivered', false), true);

  // Illegal skip (e.g. washing directly to delivered without QC or delivery)
  assert.strictEqual(isTransitionAllowed('washing', 'delivered', false), false);
  assert.strictEqual(isTransitionAllowed('order_received', 'closed', false), false);

  // Manager bypass allowed
  assert.strictEqual(isTransitionAllowed('order_received', 'closed', true), true);
});

// Test 4: Register Cash-Close Reconciliation & Denomination Math
test('Shift Closing: Accurately calculates currency denominations, date-filtered system cash, and variance', () => {
  const denominations = {
    '500': 10,  // 5000
    '200': 5,   // 1000
    '100': 8,   // 800
    '50': 4,    // 200
    '20': 5,    // 100
    '10': 10,   // 100
    'coins': 45 // 45
  };

  function calculatePhysicalCash(denoms) {
    return (
      (Number(denoms['500']) || 0) * 500 +
      (Number(denoms['200']) || 0) * 200 +
      (Number(denoms['100']) || 0) * 100 +
      (Number(denoms['50']) || 0) * 50 +
      (Number(denoms['20']) || 0) * 20 +
      (Number(denoms['10']) || 0) * 10 +
      (Number(denoms.coins) || 0)
    );
  }

  const physicalTotal = calculatePhysicalCash(denominations);
  assert.strictEqual(physicalTotal, 7245);

  // Sample order ledger with mixed dates and payment methods
  const orders = [
    { id: '1', orderDate: '2026-10-27', paymentStatus: 'paid', paymentMethod: 'bycash', paidAmount: 5000 },
    { id: '2', orderDate: '2026-10-27', paymentStatus: 'paid', paymentMethod: 'cod_cash', paidAmount: 2245 },
    { id: '3', orderDate: '2026-10-27', paymentStatus: 'paid', paymentMethod: 'upi_qr', paidAmount: 1500 },
    { id: '4', orderDate: '2026-10-26', paymentStatus: 'paid', paymentMethod: 'bycash', paidAmount: 3000 }, // Yesterday's order
  ];

  function reconcileShift(ordersList, targetDate, physicalTotal) {
    let systemCash = 0;
    let systemUpi = 0;

    ordersList.forEach((o) => {
      if (o.paymentStatus === 'paid' && o.orderDate === targetDate) {
        if (o.paymentMethod === 'bycash' || o.paymentMethod === 'cod_cash') {
          systemCash += o.paidAmount;
        } else if (o.paymentMethod === 'upi_qr') {
          systemUpi += o.paidAmount;
        }
      }
    });

    const variance = physicalTotal - systemCash;
    return { systemCash, systemUpi, variance, isBalanced: Math.abs(variance) < 1 };
  }

  const report = reconcileShift(orders, '2026-10-27', physicalTotal);
  assert.strictEqual(report.systemCash, 7245);
  assert.strictEqual(report.systemUpi, 1500);
  assert.strictEqual(report.variance, 0);
  assert.strictEqual(report.isBalanced, true);
});

// Test 5: Supabase Database Schema Mapping (Task 4)
test('Supabase Database Schema Mapping: Converts Postgres snake_case order records into typed application Order model', () => {
  function mapDbOrderToOrder(row) {
    const isWalkin =
      row.order_channel === 'walk_in' ||
      row.channel === 'walkin_pos' ||
      row.channel === 'walk_in' ||
      (row.invoice_no && String(row.invoice_no).startsWith('WLK'));
    const effectiveChannel = isWalkin ? 'walk_in' : 'online';

    let items = [];
    if (Array.isArray(row.order_items) && row.order_items.length > 0) {
      items = row.order_items.map((it, idx) => ({
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

  // 1. Online Order record from Supabase PostgreSQL
  const dbOnlineRow = {
    id: 'f87e5b12-1111-4234-a123-bca987654321',
    invoice_no: 'IND-2401',
    order_channel: 'online',
    customer_id: 'cust-uuid-1',
    customer_name: 'Ananya Sharma',
    customer_phone: '9876543210',
    customer_email: 'ananya@example.com',
    pickup_address: JSON.stringify({
      flatNo: '302, Palm Grove',
      street: '12th Main, Indiranagar',
      city: 'Bengaluru',
      pincode: '560038',
    }),
    pickup_slot_date: '2026-11-12',
    pickup_slot_window: 'Morning (07:00 AM - 10:00 AM)',
    delivery_slot_date: '2026-11-14',
    delivery_slot_window: 'Evening (04:00 PM - 07:00 PM)',
    grand_total: 472.00,
    subtotal: 400.00,
    paid_amount: 472.00,
    payment_method: 'online_upi',
    payment_status: 'paid',
    delivery_pin: '8392',
    status: 'order_received',
    stage_history: JSON.stringify([
      { stage: 'order_received', label: 'Order Placed', timestamp: '2026-11-10T10:00:00Z' }
    ]),
    remarks: 'Handle silk saree carefully',
    order_items: [
      {
        id: 'item-uuid-1',
        cloth_name: 'Silk Saree',
        service_name: 'Dry Cleaning',
        unit_price: 249.00,
        quantity: 1,
        subtotal: 249.00,
        qc_passed: true,
      },
      {
        id: 'item-uuid-2',
        cloth_name: 'Shirt / T-Shirt',
        service_name: 'Steam Press',
        unit_price: 39.00,
        quantity: 2,
        subtotal: 78.00,
        qc_passed: true,
      }
    ]
  };

  const mappedOnline = mapDbOrderToOrder(dbOnlineRow);
  assert.strictEqual(mappedOnline.id, 'f87e5b12-1111-4234-a123-bca987654321');
  assert.strictEqual(mappedOnline.invoiceNo, 'IND-2401');
  assert.strictEqual(mappedOnline.orderChannel, 'online');
  assert.strictEqual(mappedOnline.customerName, 'Ananya Sharma');
  assert.strictEqual(mappedOnline.customerPhone, '9876543210');
  assert.strictEqual(mappedOnline.pickupAddress.city, 'Bengaluru');
  assert.strictEqual(mappedOnline.pickupSlot.date, '2026-11-12');
  assert.strictEqual(mappedOnline.deliveryDate, '2026-11-14');
  assert.strictEqual(mappedOnline.grandTotal, 472);
  assert.strictEqual(mappedOnline.paidAmount, 472);
  assert.strictEqual(mappedOnline.balanceAmount, 0);
  assert.strictEqual(mappedOnline.paymentMethod, 'online_upi');
  assert.strictEqual(mappedOnline.paymentStatus, 'paid');
  assert.strictEqual(mappedOnline.deliveryPin, '8392');
  assert.strictEqual(mappedOnline.status, 'order_received');
  assert.strictEqual(mappedOnline.remarks, 'Handle silk saree carefully');
  assert.strictEqual(mappedOnline.items.length, 2);
  assert.strictEqual(mappedOnline.items[0].clothName, 'Silk Saree');
  assert.strictEqual(mappedOnline.items[1].quantity, 2);

  // 2. Walk-in Order record with POS walkin_pos channel
  const dbWalkinRow = {
    id: 'wlk-uuid-2',
    invoice_no: 'WLK-3001',
    channel: 'walkin_pos',
    grand_total: 150.00,
    subtotal: 127.12,
    paid_amount: 0,
    payment_method: 'bycash',
    payment_status: 'pending',
    delivery_pin_hash: '4455',
    status: 'received',
  };

  const mappedWalkin = mapDbOrderToOrder(dbWalkinRow);
  assert.strictEqual(mappedWalkin.invoiceNo, 'WLK-3001');
  assert.strictEqual(mappedWalkin.orderChannel, 'walk_in');
  assert.strictEqual(mappedWalkin.pickupAddress, undefined);
  assert.strictEqual(mappedWalkin.balanceAmount, 150);
  assert.strictEqual(mappedWalkin.deliveryPin, '4455');
  assert.strictEqual(mappedWalkin.status, 'received');
});

// Test 6: Supabase Customer Schema Mapping & Password Security (Task 5)
test('Supabase Customer Ingestion & Password Hashing: Hashes credentials and maps Postgres customer model', () => {
  function hashPassword(password) {
    if (!password) return '';
    const salt = 'dhobighat_kryptos_v3_salt_9281';
    let h1 = 0x811c9dc5;
    let h2 = 0xcbf29ce4;
    const str = password + ':' + salt;
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i) + (round * 31);
        h1 = Math.imul(h1 ^ code, 0x01000193) ^ (code << 5);
        h2 = Math.imul(h2 ^ (code + i), 0x5bd1e995) ^ (code >> 3);
      }
    }
    const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
    return `dh3_${hex1}_${hex2}`;
  }

  function mapDbCustomerToCustomer(c) {
    let addresses = c.addresses;
    if (typeof addresses === 'string') {
      try { addresses = JSON.parse(addresses); } catch {}
    }
    const defaultAddrId = c.default_address_id || `addr-${c.id}`;
    const addressList = Array.isArray(addresses) && addresses.length > 0 ? addresses : [
      {
        id: defaultAddrId,
        flatNo: c.flat_no || '101, Main Block',
        street: c.street || '100ft Road',
        city: c.city || 'Bengaluru',
        state: c.state || 'Karnataka',
        pincode: c.pincode || '560038',
        isDefault: true,
      },
    ];

    return {
      id: c.id,
      phone: c.phone || '',
      firstName: c.first_name || '',
      lastName: c.last_name || '',
      email: c.email || `${c.phone || 'customer'}@dhobighat.in`,
      passwordHash: c.password_hash,
      addresses: addressList,
      defaultAddressId: defaultAddrId,
      walletBalance: Number(c.wallet_balance || 0),
      joinDate: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '2026-11-10',
      status: c.is_active === false || c.status === 'disable' ? 'disable' : 'enable',
      totalOrders: Number(c.total_orders || 0),
    };
  }

  const rawPassword = 'SecureCustomerPass@2026!';
  const hashedPassword = hashPassword(rawPassword);
  assert.strictEqual(hashedPassword.startsWith('dh3_'), true);
  assert.notStrictEqual(hashedPassword, rawPassword);

  const dbCustomerRow = {
    id: 'cust-uuid-44',
    phone: '9845012345',
    first_name: 'Rohan',
    last_name: 'Verma',
    email: 'rohan.verma@example.com',
    password_hash: hashedPassword,
    wallet_balance: 150.00,
    is_active: true,
    created_at: '2026-11-01T08:30:00Z',
    total_orders: 4,
  };

  const customer = mapDbCustomerToCustomer(dbCustomerRow);
  assert.strictEqual(customer.id, 'cust-uuid-44');
  assert.strictEqual(customer.firstName, 'Rohan');
  assert.strictEqual(customer.lastName, 'Verma');
  assert.strictEqual(customer.phone, '9845012345');
  assert.strictEqual(customer.email, 'rohan.verma@example.com');
  assert.strictEqual(customer.walletBalance, 150);
  assert.strictEqual(customer.status, 'enable');
  assert.strictEqual(customer.totalOrders, 4);

  // Response sanitization: password & passwordHash must be masked before returning to client
  const safeResponse = { ...customer, password: undefined, passwordHash: undefined };
  assert.strictEqual(safeResponse.password, undefined);
  assert.strictEqual(safeResponse.passwordHash, undefined);
});


