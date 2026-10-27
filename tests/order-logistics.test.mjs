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

