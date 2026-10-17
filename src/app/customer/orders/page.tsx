'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Clock, 
  Truck, 
  Building, 
  Sparkles, 
  CheckCircle2, 
  PackageCheck, 
  AlertTriangle, 
  XCircle, 
  Star, 
  Camera, 
  Printer, 
  MapPin, 
  Phone, 
  CreditCard, 
  QrCode, 
  ChevronRight, 
  ShieldAlert,
  ArrowRight,
  Calendar,
  RotateCcw,
  History,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/CustomerNavbar';
import { useLaundry } from '@/context/LaundryContext';
import { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDateTime, formatTimeShort, generateUpiUri } from '@/lib/utils';

function CustomerOrdersContent() {
  const searchParams = useSearchParams();
  const highlightInv = searchParams.get('inv');

  const { 
    orders, 
    customerSession, 
    raiseDispute, 
    rateOrder, 
    recordPayment, 
    settleDeliveryUpiPayment,
    cancelOrder, 
    rescheduleOrder, 
    settings 
  } = useLaundry();
  const { user } = customerSession;

  // Search/Filter state
  const [filterInv, setFilterInv] = useState(highlightInv || '');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Photo evidence preview modal state
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Doorstep UPI payment modal state
  const [showUpiPayModal, setShowUpiPayModal] = useState(false);
  const [upiPayCopied, setUpiPayCopied] = useState(false);
  const [upiSimulating, setUpiSimulating] = useState(false);

  // Audit Trail collapse/expand state
  const [showAuditTrail, setShowAuditTrail] = useState(true);

  // Guest Order Lookup state (if customer is unauthenticated)
  const [lookupInv, setLookupInv] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupError, setLookupError] = useState('');

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeType, setDisputeType] = useState<'damage' | 'stain_not_removed' | 'missing_item' | 'weight_mismatch'>('damage');
  const [disputeDesc, setDisputeDesc] = useState('');

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans / Not available');
  const [customCancelReason, setCustomCancelReason] = useState('');

  // Reschedule order modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('Morning (07:00 AM - 10:00 AM)');

  // Rating state
  const [userRating, setUserRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  // Filter orders strictly: only authenticated customer orders or explicit verified order
  const userOrders = user
    ? orders.filter((o) => o.customerId === user.id || o.customerPhone === user.phone)
    : selectedOrderId
    ? orders.filter((o) => o.id === selectedOrderId)
    : [];

  // Helper to extract recorded timestamp for each milestone step
  const getMilestoneTimestamp = (stepKey: OrderStatus, order: Order): string | null => {
    if (!order.stageTimestamps) {
      if (stepKey === 'order_received') return order.orderDate;
      if (stepKey === order.status) return order.lastStageUpdatedAt || null;
      return null;
    }

    if (stepKey === 'order_received') {
      return order.stageTimestamps['order_received'] || order.stageTimestamps['booked'] || order.orderDate;
    }
    if (stepKey === 'pickup_assigned') {
      return order.stageTimestamps['pickup_assigned'] || null;
    }
    if (stepKey === 'out_for_pickup') {
      return order.stageTimestamps['out_for_pickup'] || null;
    }
    if (stepKey === 'picked_up') {
      return order.stageTimestamps['picked_up'] || null;
    }
    if (stepKey === 'reached_store') {
      return order.stageTimestamps['reached_store'] || order.stageTimestamps['received_at_store'] || null;
    }
    if (stepKey === 'processing') {
      return (
        order.stageTimestamps['processing'] ||
        order.stageTimestamps['washing'] ||
        order.stageTimestamps['sorting'] ||
        order.stageTimestamps['received'] ||
        order.stageTimestamps['drying'] ||
        order.stageTimestamps['ironing'] ||
        order.stageTimestamps['qc_check_packed'] ||
        null
      );
    }
    if (stepKey === 'drop_assigned') {
      return order.stageTimestamps['drop_assigned'] || null;
    }
    if (stepKey === 'out_for_delivery') {
      return order.stageTimestamps['out_for_delivery'] || null;
    }
    if (stepKey === 'delivered') {
      return order.stageTimestamps['delivered'] || order.stageTimestamps['closed'] || null;
    }
    return order.stageTimestamps[stepKey] || null;
  };

  const handleGuestLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    const cleanPhone = lookupPhone.replace(/\D/g, '');
    const cleanInv = lookupInv.trim().toLowerCase();
    const matched = orders.find(
      (o) =>
        (o.invoiceNo || '').toLowerCase() === cleanInv &&
        (cleanPhone.length >= 4 ? (o.customerPhone || '').replace(/\D/g, '').endsWith(cleanPhone) : true)
    );
    if (matched) {
      setSelectedOrderId(matched.id);
    } else {
      setLookupError('No order found matching this invoice number and mobile number.');
    }
  };

  // Pick highlighted order or first active
  useEffect(() => {
    if (highlightInv) {
      const found = orders.find(
        (o) => (o.invoiceNo || '').toLowerCase() === highlightInv.toLowerCase()
      );
      if (found) setSelectedOrderId(found.id);
    } else if (userOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(userOrders[0].id);
    }
  }, [highlightInv, orders, userOrders.length, selectedOrderId]);

  const selectedOrder = (selectedOrderId ? orders.find((o) => o.id === selectedOrderId) : null) || userOrders[0] || null;

  // Order Lifecycle 9 Steps for Customer App (including Drop Assigned)
  const lifecycleSteps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'order_received', label: '1. Order Placed', desc: 'Booking confirmed & held for pickup slot' },
    { key: 'pickup_assigned', label: '2. Pickup assigned (Morning/Evening)', desc: 'Rider scheduled for your designated time window' },
    { key: 'out_for_pickup', label: '3. Out for Pickup', desc: 'Rider is en route to collect clothes at your doorstep' },
    { key: 'picked_up', label: '4. Order Picked-up', desc: 'Rider verified piece count & scale weight with photo evidence' },
    { key: 'reached_store', label: '5. Reached Store', desc: 'Laundry bag arrived safely at the local facility' },
    { key: 'processing', label: '6. Processing', desc: 'Sorting, eco-washing, drying, steam ironing & QC check' },
    { key: 'drop_assigned', label: '7. Drop Assigned', desc: 'Fresh clothes packed & rider assigned for doorstep delivery slot' },
    { key: 'out_for_delivery', label: '8. Out For Delivery', desc: 'Rider dispatched with freshly packaged clothes & delivery PIN' },
    { key: 'delivered', label: '9. Delivered', desc: 'Clothes safely delivered to your doorstep' },
  ];

  const getStepStatus = (stepKey: OrderStatus, current: OrderStatus) => {
    if (current === 'disputed') return 'disputed';
    if (current === 'payment_failed') return 'failed';

    const rank: Partial<Record<OrderStatus, number>> = {
      order_received: 1,
      booked: 1,
      pending: 1,

      pickup_assigned: 2,

      out_for_pickup: 3,

      picked_up: 4,

      reached_store: 5,

      // Internal store processing stages (Stages 1 to 6) all map to step 6 (Processing):
      received: 6,
      received_at_store: 6,
      sorting: 6,
      washing: 6,
      drying: 6,
      ironing: 6,
      qc_check_packed: 6,
      qc_check: 6,
      packed_ready: 6,
      ready: 6,
      processing: 6,

      drop_assigned: 7,

      out_for_delivery: 8,

      delivered: 9,
      closed: 9,

      cancelled: 0,
      payment_failed: 0,
      disputed: 0,
    };

    const currentRank = rank[current] || 1;
    const stepRank = rank[stepKey] || 1;

    if (currentRank > stepRank) return 'completed';
    if (currentRank === stepRank) return 'active';
    return 'pending';
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const finalReason = cancelReason === 'Other' ? (customCancelReason.trim() || 'Customer requested cancellation') : cancelReason;
    cancelOrder(selectedOrder.id, finalReason);
    setShowCancelModal(false);
    alert(`Order #${selectedOrder.invoiceNo} has been cancelled successfully.`);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    rescheduleOrder(selectedOrder.id, rescheduleDate, rescheduleSlot);
    setShowRescheduleModal(false);
    alert(`Pickup for Order #${selectedOrder.invoiceNo} rescheduled to ${rescheduleDate} (${rescheduleSlot}).`);
  };

  const handleFileDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    raiseDispute({
      orderId: selectedOrder.id,
      invoiceNo: selectedOrder.invoiceNo,
      issueType: disputeType,
      description: disputeDesc,
      photoUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500',
    });

    setShowDisputeModal(false);
    alert('Dispute raised. The store manager will review photo evidence within 2 hours.');
  };

  const handleRateOrder = () => {
    if (!selectedOrder) return;
    rateOrder(selectedOrder.id, userRating, feedbackText);
    alert('Thank you for rating DhobiGhat India!');
  };

  // If unauthenticated and no verified order selected, show gate screen
  if (!user && !selectedOrder) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <CustomerNavbar />

        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100 shadow-sm">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <span className="inline-block text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                Customer Verification Required
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Tracking & History</h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct access to customer orders is restricted. Please sign in with your mobile OTP or verify with your invoice number.
              </p>
            </div>

            {/* Option 1: Mobile OTP Login */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Option 1: Sign In with Mobile OTP</span>
              </div>
              <p className="text-[11px] text-slate-600">
                View all your active bookings, past invoices, live rider tracking, and loyalty rewards.
              </p>
              <Link
                href="/customer/auth?redirect=/customer/orders"
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 text-center flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Login with 10-Digit Mobile OTP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-bold uppercase">or</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Option 2: Specific Invoice Tracking */}
            <form onSubmit={handleGuestLookup} className="space-y-3">
              <div className="text-xs font-bold text-slate-800">
                Option 2: Track Specific Order
              </div>

              {lookupError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. IND-2401"
                  value={lookupInv}
                  onChange={(e) => setLookupInv(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow transition-all"
              >
                Verify & Track Order ➔
              </button>
            </form>

            <div className="text-center pt-2">
              <Link href="/customer" className="text-xs font-bold text-slate-500 hover:text-slate-800">
                ← Return to Customer Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6">

        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              Live Order Milestones
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Orders & Status Tracking
            </h1>
          </div>

          <Link
            href="/customer/book"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md"
          >
            + Book Another Pickup
          </Link>
        </div>

        {/* Layout: Left Sidebar Orders List, Right Selected Order Lifecycle Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Orders Selector */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Your Orders ({userOrders.length})
            </h3>

            <div className="space-y-3">
              {userOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                    selectedOrder?.id === ord.id
                      ? 'bg-white border-sky-400 shadow-md ring-2 ring-sky-200/50'
                      : 'bg-white/80 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      #{ord.invoiceNo}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        ord.status === 'delivered' || ord.status === 'closed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : ord.status === 'disputed'
                          ? 'bg-rose-100 text-rose-800'
                          : ord.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : ord.status === 'drop_assigned'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : ord.status === 'out_for_delivery'
                          ? 'bg-sky-100 text-sky-800 animate-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Pickup: {ord.pickupSlot?.date || ord.orderDate} ({ord.pickupSlot?.window ? ord.pickupSlot.window.split(' ')[0] : 'Slot'})
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                    <Clock className="w-3 h-3 text-sky-500 shrink-0" />
                    <span>Updated: {formatDateTime(ord.lastStageUpdatedAt || ord.orderDate)}</span>
                  </div>

                  <div className="flex justify-between items-baseline mt-3 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-400">{ord.totalQty} items</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(ord.grandTotal, settings.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Detailed Lifecycle Tracker */}
          {selectedOrder ? (
            <div className="lg:col-span-2 space-y-6">

              {/* Order Header Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                        #{selectedOrder.invoiceNo}
                      </h2>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                          selectedOrder.status === 'delivered' || selectedOrder.status === 'closed'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black'
                            : selectedOrder.status === 'cancelled'
                            ? 'bg-rose-600 text-white'
                            : selectedOrder.status === 'drop_assigned'
                            ? 'bg-indigo-600 text-white'
                            : selectedOrder.status === 'out_for_delivery'
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {selectedOrder.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Store: <span className="font-semibold text-slate-800">{selectedOrder.storeName}</span>
                    </p>
                  </div>

                  {/* Actions: Reschedule, Cancel, Dispute, Print */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Can cancel and reschedule till pickup stage */}
                    {['order_received', 'booked', 'pending', 'pickup_assigned', 'out_for_pickup'].includes(selectedOrder.status) && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowRescheduleModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-sky-200"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Reschedule</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Order</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-amber-200"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Dispute</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Disputed Notice Banner */}
                {(selectedOrder.status === 'disputed' || selectedOrder.dispute) && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-950 text-xs flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-amber-950">
                          Dispute Under Review: {selectedOrder.dispute?.issueType ? selectedOrder.dispute.issueType.replace(/_/g, ' ').toUpperCase() : 'Investigation Active'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900 border border-amber-300">
                          {selectedOrder.dispute?.status ? selectedOrder.dispute.status.replace(/_/g, ' ') : 'Open'}
                        </span>
                      </div>
                      <p className="text-amber-900">
                        {selectedOrder.dispute?.description ? `"${selectedOrder.dispute.description}"` : 'Your issue report is currently being reviewed by our Store Manager.'}
                      </p>
                      {selectedOrder.dispute?.resolutionNotes && (
                        <div className="mt-2 p-2.5 rounded-xl bg-white/90 border border-amber-300 text-slate-800 space-y-1">
                          <span className="font-bold text-emerald-800 text-xs block">Store Manager Settlement:</span>
                          <p className="text-xs text-slate-700">{selectedOrder.dispute.resolutionNotes}</p>
                          {selectedOrder.dispute.refundAmount ? (
                            <span className="inline-block font-extrabold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Refund Credit: {formatCurrency(selectedOrder.dispute.refundAmount, settings.currency)}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancelled Notice Banner */}
                {selectedOrder.status === 'cancelled' && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-sm text-rose-950">This Order Has Been Cancelled</div>
                      <p className="mt-0.5 text-rose-800">
                        {selectedOrder.cancellationReason ? `Reason: "${selectedOrder.cancellationReason}"` : 'Cancelled before rider collection.'}
                      </p>
                      {selectedOrder.cancelledAt && (
                        <div className="text-[10px] text-rose-600 mt-1">
                          Cancelled Timestamp: {new Date(selectedOrder.cancelledAt).toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rescheduled Notice Banner */}
                {selectedOrder.rescheduledAt && selectedOrder.status !== 'cancelled' && (
                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      Pickup Rescheduled to: <strong className="font-bold">{selectedOrder.pickupSlot?.date} ({selectedOrder.pickupSlot?.window})</strong>
                    </span>
                  </div>
                )}

                {/* Post-Pickup Locked Notice */}
                {!['order_received', 'booked', 'pending', 'pickup_assigned', 'out_for_pickup', 'cancelled'].includes(selectedOrder.status) && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
                    <span>🔒 Clothes already collected by rider. Order is now in facility processing / doorstep logistics and cannot be cancelled or rescheduled.</span>
                  </div>
                )}

                {/* Delivery PIN & Slot Radar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-900 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Doorstep Handover PIN</span>
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                        Customer Only
                      </span>
                    </div>
                    <span className="font-mono text-2xl font-black text-amber-950 tracking-widest block py-0.5">
                      {selectedOrder.deliveryPin}
                    </span>
                    <p className="text-[10px] text-amber-800 leading-snug">
                      🔒 Only you have this PIN. The delivery rider will ask you for it at your doorstep to verify handover.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 block text-[11px] font-medium">Pickup Window</span>
                    <span className="font-bold text-slate-900 block">{selectedOrder.pickupSlot?.date || selectedOrder.orderDate}</span>
                    <span className="text-[10px] text-slate-500">{selectedOrder.pickupSlot?.window || 'Standard Window'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-slate-400 block text-[11px] font-medium">Payment Settlement</span>
                    <span className="font-bold text-slate-900 capitalize block">
                      {selectedOrder.paymentMethod.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        selectedOrder.paymentStatus === 'paid' ? 'text-emerald-600 font-extrabold' : 'text-amber-600'
                      }`}
                    >
                      ● {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Doorstep UPI Payment Banner when Out For Delivery or Payment Pending */}
                {selectedOrder.paymentStatus !== 'paid' && selectedOrder.status !== 'cancelled' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-indigo-950/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase">
                          Payment Due: {formatCurrency(selectedOrder.grandTotal)}
                        </span>
                        <span className="text-[11px] text-purple-200">
                          Mode: {selectedOrder.paymentMethod.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-purple-400" />
                        <span>Pay via UPI at Delivery</span>
                      </h4>
                      <p className="text-[11px] text-purple-200">
                        UPI payment completion at delivery time will immediately verify & mark your order Delivered!
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowUpiPayModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all shrink-0"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Pay {formatCurrency(selectedOrder.grandTotal)} via UPI</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Lifecycle Progress Bar (9 Stages) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                    Order Booking & Processing Milestones
                  </h3>
                  {(selectedOrder.status === 'delivered' || selectedOrder.status === 'closed') && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Order Completed (Delivered)</span>
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {lifecycleSteps.map((st, idx) => {
                    const stepState = getStepStatus(st.key, selectedOrder.status);
                    const isDeliveredStep = st.key === 'delivered';
                    const isDeliveredActiveOrDone = isDeliveredStep && (stepState === 'completed' || stepState === 'active');
                    const stepTime = getMilestoneTimestamp(st.key, selectedOrder);

                    return (
                      <div key={st.key} className="flex items-start gap-4">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm transition-all ${
                            isDeliveredActiveOrDone
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 shadow-emerald-500/25'
                              : stepState === 'completed'
                              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                              : stepState === 'active'
                              ? 'bg-sky-600 text-white ring-4 ring-sky-100 animate-pulse'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {stepState === 'completed' || isDeliveredActiveOrDone ? '✓' : idx + 1}
                        </div>

                        <div className="flex-1 pb-3.5 border-b border-slate-100 last:border-b-0 space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <h4
                              className={`text-sm font-bold ${
                                isDeliveredActiveOrDone
                                  ? 'text-emerald-700 font-black'
                                  : stepState === 'active'
                                  ? 'text-sky-700 font-extrabold'
                                  : stepState === 'completed'
                                  ? 'text-slate-900 font-bold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {st.label}
                            </h4>

                            <div className="flex items-center gap-2">
                              {/* Stage Recorded Timestamp Badge */}
                              {stepTime && (stepState === 'completed' || stepState === 'active' || isDeliveredActiveOrDone) && (
                                <span className="text-[11px] font-mono text-slate-600 bg-slate-100/90 border border-slate-200/90 px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-semibold">
                                  <Clock className="w-3 h-3 text-sky-500 shrink-0" />
                                  <span>{formatDateTime(stepTime)}</span>
                                </span>
                              )}

                              <span
                                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                  isDeliveredActiveOrDone
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : stepState === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : stepState === 'active'
                                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                    : 'text-slate-400 bg-slate-50'
                                }`}
                              >
                                {isDeliveredActiveOrDone ? 'Delivered' : stepState}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <p className="text-slate-500">{st.desc}</p>
                            {stepState === 'completed' && stepTime && (
                              <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Completed • {formatDateTime(stepTime)}</span>
                              </span>
                            )}
                            {stepState === 'active' && (
                              <span className="text-[10px] font-bold text-sky-700 flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3 text-sky-600 animate-spin" />
                                <span>In Progress {stepTime ? `since ${formatDateTime(stepTime)}` : ''}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Store Processing Stage Indicator */}
                {['received', 'sorting', 'washing', 'drying', 'ironing', 'qc_check', 'packed_ready', 'processing'].includes(selectedOrder.status) && (
                  <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between text-xs text-indigo-900">
                    <span className="font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      <span>
                        Live Store Floor Stage:{" "}
                        <span className="uppercase text-indigo-700 underline font-black">
                          {selectedOrder.status === 'processing' ? (selectedOrder.subStage || 'Washing') : selectedOrder.status.replace(/_/g, ' ')}
                        </span>
                      </span>
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-100/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Since: {formatDateTime(selectedOrder.lastStageUpdatedAt || selectedOrder.orderDate)}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Comprehensive Date & Time Audit Trail & Event Timeline */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-xs">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Date & Time Stage Tracking History</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                          {selectedOrder.stageHistory?.length || 1} Events Logged
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Exact time records of each transition, processing milestone, and handlers
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAuditTrail(!showAuditTrail)}
                    className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-100 transition-colors"
                  >
                    <span>{showAuditTrail ? 'Hide Log' : 'View Full Log'}</span>
                    {showAuditTrail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showAuditTrail && (
                  <div className="space-y-3 pt-1">
                    {selectedOrder.stageHistory && selectedOrder.stageHistory.length > 0 ? (
                      <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {selectedOrder.stageHistory.map((item, hIdx) => (
                          <div key={hIdx} className="relative group">
                            <div className="absolute -left-6 top-2 w-3.5 h-3.5 rounded-full bg-sky-500 ring-4 ring-sky-100 border-2 border-white" />
                            <div className="bg-slate-50/90 hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 transition-all space-y-1">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900">
                                    {item.label || item.stage.replace(/_/g, ' ')}
                                  </span>
                                  {item.actorRole && (
                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                                      {item.actorRole}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-mono font-bold text-sky-700 flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-sky-500" />
                                  <span>{formatDateTime(item.timestamp)}</span>
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-1">
                                <span>Handled By: <strong className="text-slate-700 font-semibold">{item.actorName || 'DhobiGhat Operations Team'}</strong></span>
                                {item.notes && <span className="text-[11px] text-slate-600 italic bg-white/70 px-2 py-0.5 rounded border border-slate-200/50">{item.notes}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                        <span>Order Received: {formatDateTime(selectedOrder.orderDate)}</span>
                        <span className="font-mono text-slate-500">Last Stage Update: {formatDateTime(selectedOrder.lastStageUpdatedAt || selectedOrder.orderDate)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rider Handover Card (if rider collected) */}
              {selectedOrder.riderHandover && (
                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-sky-400">
                          Doorstep Collection & Scale Weight Evidence
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Collected by Rider: <strong className="text-white font-semibold">{selectedOrder.riderHandover.riderName}</strong>
                          {selectedOrder.riderHandover.riderPhone && ` (${selectedOrder.riderHandover.riderPhone})`}
                        </span>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                      ✓ Intake Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block mb-0.5 text-[11px]">Rider Weight Scale</span>
                      <span className="font-mono font-bold text-white text-base">
                        {selectedOrder.riderHandover.riderWeightKg} Kg
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block mb-0.5 text-[11px]">Store Verified Weight</span>
                      <span className="font-mono font-bold text-emerald-400 text-base">
                        {selectedOrder.riderHandover.storeVerifiedWeightKg || selectedOrder.riderHandover.riderWeightKg} Kg
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
                      <span className="text-slate-400 block mb-0.5 text-[11px]">Bags & Pieces</span>
                      <span className="font-mono font-bold text-white text-base">
                        {selectedOrder.riderHandover.bagCount} Bags • {selectedOrder.totalQty} Pcs
                      </span>
                    </div>
                  </div>

                  {/* Rider Photo Evidence Display */}
                  {selectedOrder.riderHandover.riderPhotoEvidence ? (
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                          <Camera className="w-3.5 h-3.5 text-sky-400" />
                          <span>Rider Doorstep Photo Proof</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(selectedOrder.riderHandover?.riderPhotoEvidence || null)}
                          className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Full Photo</span>
                        </button>
                      </div>

                      <div 
                        onClick={() => setPreviewPhotoUrl(selectedOrder.riderHandover?.riderPhotoEvidence || null)}
                        className="relative group rounded-2xl overflow-hidden border border-white/15 bg-black/40 cursor-pointer max-w-sm"
                      >
                        <img
                          src={selectedOrder.riderHandover.riderPhotoEvidence}
                          alt="Rider Doorstep Intake Evidence"
                          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                          <div className="text-[10px] text-white flex items-center justify-between w-full">
                            <span className="font-semibold">Taken at Customer Doorstep</span>
                            <span className="font-mono font-bold text-sky-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                              🔍 Click to Zoom
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Rider verified physical garment intake at customer doorstep.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Itemized Garment List */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                  Itemized Garments & Instructions
                </h4>

                <div className="divide-y divide-slate-100 text-xs">
                  {selectedOrder.items.map((it) => (
                    <div key={it.id} className="py-3 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">{it.clothName}</span>
                        <div className="text-[11px] text-slate-400">
                          {it.serviceName} • Starch: {it.starchLevel || 'None'} • {it.foldStyle || 'Folded'}
                        </div>
                        {it.stainNote && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm inline-block mt-0.5">
                            Note: {it.stainNote}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900 block font-mono">₹{it.total}</span>
                        <span className="text-[10px] text-slate-400">Qty: {it.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount ({selectedOrder.couponCode}):</span>
                      <span>-₹{selectedOrder.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span className="font-mono">₹{(selectedOrder.gstAmount ?? selectedOrder.taxAmount ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                    <span>Grand Total:</span>
                    <span className="text-sky-700">₹{selectedOrder.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Rating Section (If delivered or closed) */}
              {['delivered', 'closed'].includes(selectedOrder.status) && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200/80 space-y-3">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                    Rate Your Laundry Experience
                  </span>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        className="text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (selectedOrder.rating || userRating) ? 'fill-current' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {selectedOrder.rating ? `${selectedOrder.rating} Stars Recorded` : `${userRating} Stars`}
                    </span>
                  </div>

                  {!selectedOrder.rating && (
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Share your compliments or feedback..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleRateOrder}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                      >
                        Submit Review
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              No orders found. Click &ldquo;Book Pickup&rdquo; to place your first order.
            </div>
          )}

        </div>

        {/* Dispute Modal */}
        {showDisputeModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>Raise Order Dispute (#{selectedOrder.invoiceNo})</span>
                </div>
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFileDispute} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Category *</label>
                  <select
                    value={disputeType}
                    onChange={(e) => setDisputeType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="damage">Fabric Tear / Color Bleed / Damaged</option>
                    <option value="stain_not_removed">Stain Not Removed as Promised</option>
                    <option value="missing_item">Missing Garment</option>
                    <option value="weight_mismatch">Incorrect Weight Computation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Please explain the issue in detail..."
                    value={disputeDesc}
                    onChange={(e) => setDisputeDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-1">
                  <Camera className="w-5 h-5 text-slate-400 mx-auto" />
                  <span className="text-[11px] text-slate-600 font-semibold block">Attach Photo Evidence</span>
                  <span className="text-[9px] text-slate-400">Garment photo preview attached automatically</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancel Order Modal */}
        {showCancelModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>Cancel Booking #{selectedOrder.invoiceNo}</span>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                You can cancel your booking for free anytime prior to the rider picking up your garments.
              </p>

              <form onSubmit={handleConfirmCancel} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Cancellation *</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                  >
                    <option value="Change of plans / Not available">Change of plans / Not available</option>
                    <option value="Booked wrong date/time slot">Booked wrong date/time slot</option>
                    <option value="Decided to self-wash">Decided to wash clothes myself</option>
                    <option value="Need to add more clothes / re-book">Need to modify laundry garment list</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>

                {cancelReason === 'Other' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Specify Reason</label>
                    <input
                      type="text"
                      required
                      placeholder="Please tell us why you are cancelling..."
                      value={customCancelReason}
                      onChange={(e) => setCustomCancelReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
                  <div className="font-bold">Cancellation Policy:</div>
                  <div>• No cancellation fee charged before rider pickup.</div>
                  <div>• Any applied discount coupons will be restored to your account.</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/20"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reschedule Pickup Modal */}
        {showRescheduleModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  <span>Reschedule Pickup #{selectedOrder.invoiceNo}</span>
                </div>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Choose a convenient morning or evening pickup slot. Our rider will arrive at your doorstep in this window.
              </p>

              <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Pickup Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Slot Window *</label>
                  <select
                    value={rescheduleSlot}
                    onChange={(e) => setRescheduleSlot(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="Morning (07:00 AM - 10:00 AM)">🌅 Morning (07:00 AM - 10:00 AM)</option>
                    <option value="Morning (10:00 AM - 01:00 PM)">☀️ Morning (10:00 AM - 01:00 PM)</option>
                    <option value="Evening (04:00 PM - 07:00 PM)">🌇 Evening (04:00 PM - 07:00 PM)</option>
                    <option value="Evening (07:00 PM - 10:00 PM)">🌙 Evening (07:00 PM - 10:00 PM)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRescheduleModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-600/20"
                  >
                    Confirm Reschedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Doorstep UPI Payment Modal */}
        {showUpiPayModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  <span>Doorstep UPI Payment • #{selectedOrder.invoiceNo}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpiPayModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-center space-y-1">
                <span className="text-[11px] text-purple-700 font-bold uppercase tracking-wider block">
                  Amount Due for Delivery
                </span>
                <span className="font-mono text-3xl font-black text-purple-950 block">
                  {formatCurrency(selectedOrder.grandTotal)}
                </span>
                <p className="text-[10px] text-purple-800">
                  Instant settlement with Zero Convenience Fee
                </p>
              </div>

              {/* UPI ID & Copy */}
              <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-3 border border-slate-800 text-center">
                <div className="flex items-center justify-between text-xs bg-slate-800 p-2.5 rounded-xl">
                  <span className="text-slate-400 font-mono text-[11px]">Merchant UPI ID:</span>
                  <span className="font-mono font-bold text-sky-300 text-xs">{settings.upiId || 'dhobighat.pay@icici'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(settings.upiId || 'dhobighat.pay@icici');
                      setUpiPayCopied(true);
                      setTimeout(() => setUpiPayCopied(false), 2000);
                    }}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[10px] text-white flex items-center gap-1 transition-colors"
                  >
                    {upiPayCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{upiPayCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* QR Code */}
                <div className="w-32 h-32 bg-white p-2 rounded-2xl mx-auto flex flex-col items-center justify-center shadow-md">
                  <QrCode className="w-20 h-20 text-slate-900" />
                  <span className="font-mono text-[9px] font-black text-slate-900">
                    ₹{selectedOrder.grandTotal.toFixed(0)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <a
                    href={generateUpiUri({
                      upiId: settings.upiId || 'dhobighat.pay@icici',
                      name: 'DhobiGhat Delivery',
                      amount: selectedOrder.grandTotal,
                      note: `Order ${selectedOrder.invoiceNo}`,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Launch UPI App</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                    <button
                    type="button"
                    disabled={upiSimulating}
                    onClick={() => {
                      setUpiSimulating(true);
                      setTimeout(() => {
                        const ref = `UPI/${Date.now().toString().slice(-8)}/CUST_OK`;
                        settleDeliveryUpiPayment(selectedOrder.id, ref);
                        setUpiSimulating(false);
                        setShowUpiPayModal(false);
                      }, 600);
                    }}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    {upiSimulating ? (
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{upiSimulating ? 'Verifying...' : 'Confirm UPI Paid (Auto-Deliver)'}</span>
                  </button>
                </div>

                <p className="text-[10px] text-emerald-400 font-medium">
                  ✓ Instant UPI Confirmation: Once payment is confirmed, your order is automatically marked Delivered. No handover PIN is required!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Photo Evidence Zoom Modal */}
        {previewPhotoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 rounded-3xl p-4 max-w-2xl w-full shadow-2xl border border-slate-700 space-y-3">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Camera className="w-4 h-4 text-sky-400" />
                  <span>Rider Doorstep Intake Evidence Photo</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPhotoUrl(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black max-h-[70vh] flex items-center justify-center border border-slate-800">
                <img
                  src={previewPhotoUrl}
                  alt="High Resolution Doorstep Pickup Proof"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>

              <div className="flex justify-between items-center px-2 text-xs text-slate-400">
                <span>Verified garment physical intake with scale weight record</span>
                <button
                  type="button"
                  onClick={() => window.open(previewPhotoUrl, '_blank')}
                  className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Original</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CustomerOrdersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Orders...</div>}>
      <CustomerOrdersContent />
    </Suspense>
  );
}
