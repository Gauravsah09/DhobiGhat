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
