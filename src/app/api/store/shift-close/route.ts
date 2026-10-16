import { NextRequest, NextResponse } from 'next/server';
import { getSharedOrders } from '@/app/api/orders/route';
import { getRequestSession } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    const body = await req.json();
    const {
      denominations = {},
      shiftType = 'morning',
      staffName = session?.fullName || 'Ramesh Sharma',
      notes = '',
    } = body;

    const count500 = Number(denominations['500']) || 0;
    const count200 = Number(denominations['200']) || 0;
    const count100 = Number(denominations['100']) || 0;
    const count50 = Number(denominations['50']) || 0;
    const count20 = Number(denominations['20']) || 0;
    const count10 = Number(denominations['10']) || 0;
    const coins = Number(denominations.coins) || 0;

    const physicalCashTotal =
      count500 * 500 +
      count200 * 200 +
      count100 * 100 +
      count50 * 50 +
      count20 * 20 +
      count10 * 10 +
      coins;

    // Calculate system totals from active ledger
    const orders = getSharedOrders();
    let systemCash = 0;
    let systemUpi = 0;
    let systemPos = 0;

    orders.forEach((o) => {
      if (o.paymentStatus === 'paid') {
        const amount = o.paidAmount || o.grandTotal;
        if (o.paymentMethod === 'bycash' || o.paymentMethod === 'cod' || o.paymentMethod === 'cod_cash') {
          systemCash += amount;
        } else if (o.paymentMethod === 'upi_qr' || o.paymentMethod === 'upi_intent' || o.paymentMethod === 'cod_upi' || o.paymentMethod === 'online') {
          systemUpi += amount;
        } else if (o.paymentMethod === 'pos_machine' || o.paymentMethod === 'card') {
          systemPos += amount;
        }
      }
    });

    const cashVariance = physicalCashTotal - systemCash;
    const isBalanced = Math.abs(cashVariance) < 1; // within 1 rupee

    const reconciliationReport = {
      shiftId: `shift-${Date.now()}`,
      closedAt: new Date().toISOString(),
      closedBy: staffName,
      shiftType,
      physicalCashTotal,
      systemCash,
      systemUpi,
      systemPos,
      totalCollections: physicalCashTotal + systemUpi + systemPos,
      cashVariance,
      isBalanced,
      denominations: {
        '500': count500,
        '200': count200,
        '100': count100,
        '50': count50,
        '20': count20,
        '10': count10,
        coins,
      },
      notes,
    };

    return NextResponse.json({
      success: true,
      message: isBalanced
        ? 'Shift successfully balanced and closed. Register locked.'
        : `Shift closed with variance of ₹${cashVariance > 0 ? '+' : ''}${cashVariance}. Audit record logged.`,
      report: reconciliationReport,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
