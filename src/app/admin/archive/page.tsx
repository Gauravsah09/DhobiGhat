'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Archive,
  ArrowLeft,
  Search,
  Filter,
  RotateCcw,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  Building,
  CreditCard,
  QrCode,
  Banknote,
  Eye,
  KeyRound,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Order } from '@/types';

function AdminOrderArchiveContent() {
  const router = useRouter();
  const { 
    adminSession, 
    orders, 
    archiveOrder, 
    unarchiveOrder, 
    archiveAllDeliveredOrders,
    settings,
    isLoaded
  } = useLaundry();
  const { admin, isAdminLoggedIn } = adminSession;

  // Strict Redirect Guard: If not logged in as admin, redirect to /admin/login
  useEffect(() => {
    if (!isLoaded) return;
    const localAdminId = typeof window !== 'undefined' ? localStorage.getItem('lms_ind_auth_admin_id_v3') : null;
    if (!isAdminLoggedIn && !localAdminId) {
      router.replace('/admin/login');
    }
  }, [isAdminLoggedIn, isLoaded, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'online' | 'walk_in'>('all');
  const [selectedAuditOrder, setSelectedAuditOrder] = useState<Order | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Orders that are archived
  const archivedOrders = useMemo(() => {
    return orders
      .filter((o) => o.isArchived)
      .filter((o) => {
        if (channelFilter !== 'all') {
          if (channelFilter === 'online' && o.orderChannel === 'walk_in') return false;
          if (channelFilter === 'walk_in' && o.orderChannel !== 'walk_in') return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (o.invoiceNo || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.customerPhone && o.customerPhone.includes(q)) ||
          (o.upiTransactionRef && o.upiTransactionRef.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (b.archivedAt || '').localeCompare(a.archivedAt || ''));
  }, [orders, channelFilter, searchQuery]);

  // Delivered or closed orders that are not yet archived
  const unarchivedDelivered = useMemo(() => {
    return orders.filter(
      (o) => (o.status === 'delivered' || o.status === 'closed') && !o.isArchived
    );
  }, [orders]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalArchived = archivedOrders.length;
    const totalArchivedValue = archivedOrders.reduce((s, o) => s + o.grandTotal, 0);
    const aov = totalArchived > 0 ? totalArchivedValue / totalArchived : 0;
    const allDeliveredCount = orders.filter((o) => o.status === 'delivered' || o.status === 'closed').length;
    const archiveRate = allDeliveredCount > 0 ? (totalArchived / allDeliveredCount) * 100 : 0;

    return {
      totalArchived,
      totalArchivedValue,
      aov,
      archiveRate,
    };
  }, [archivedOrders, orders]);

  // Handle Bulk Archive All Delivered Orders
  const handleBulkArchive = () => {
    if (unarchivedDelivered.length === 0) {
      alert('All delivered and closed orders are already archived!');
      return;
    }
    const res = archiveAllDeliveredOrders(admin?.name || 'Admin HQ');
    setActionSuccessMsg(`Successfully archived ${res.count} delivered orders! Operational queues updated.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Handle Unarchive Order
  const handleUnarchive = (orderId: string) => {
    const res = unarchiveOrder(orderId);
    setActionSuccessMsg(res.message);
    if (selectedAuditOrder?.id === orderId) {
      setSelectedAuditOrder(null);
    }
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Export Archive to CSV
  const exportArchiveCSV = () => {
    const headers = [
      'Invoice No',
      'Customer Name',
      'Phone',
      'Channel',
      'Order Date',
      'Delivery Date',
      'Total Items',
      'Grand Total (INR)',
      'Payment Method',
      'Payment Status',
      'Archived Timestamp (IST)',
      'Archived By'
    ];

    const rows = archivedOrders.map((o) => [
      `"${o.invoiceNo}"`,
      `"${o.customerName}"`,
      `"${o.customerPhone || ''}"`,
      o.orderChannel === 'walk_in' ? 'Walk-in' : 'Online',
      o.orderDate,
      o.deliveryDate || '',
      o.totalQty,
      o.grandTotal.toFixed(2),
      o.paymentMethod,
      o.paymentStatus || 'paid',
      `"${formatDateTime(o.archivedAt)}"`,
      `"${o.archivedBy || 'Admin HQ'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DhobiGhat_Archived_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hydration state check
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-xs">Verifying Administrator Session...</p>
      </div>
    );
  }

  // Unauthorized Access Guard Screen (Evaluated strictly after all React Hooks)
  if (!isAdminLoggedIn || !admin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Restricted Archive Access</h2>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          Order archives contain historical operational and customer records. Direct access is restricted. Redirecting to admin login screen...
        </p>
        <Link
          href="/admin/login"
          className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all shadow-lg shadow-sky-500/20"
        >
          Go to Admin Login Screen ➔
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Return to Admin Console"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  Historical Records Vault
                </span>
                <span className="text-[11px] text-slate-400">DhobiGhat Order Lifecycle</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Archive className="w-5 h-5 text-purple-400" />
                <span>Delivered Order Archive</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/admin/ledger"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Revenue Ledger</span>
            </Link>

            <button
              type="button"
              onClick={exportArchiveCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {unarchivedDelivered.length > 0 && (
              <button
                type="button"
                onClick={handleBulkArchive}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive {unarchivedDelivered.length} Delivered Orders</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* Action Success Alert Banner */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{actionSuccessMsg}</span>
          </div>
        )}

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
              Total Orders in Archive
            </span>
            <span className="text-2xl font-black text-white font-mono block">
              {metrics.totalArchived}
            </span>
            <span className="text-[10px] text-purple-300">
              Completed lifecycle vault
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-1 shadow-xs">
            <span className="text-purple-300 text-[10px] font-bold uppercase tracking-wider block">
              Total Archived Financial Value
            </span>
            <span className="text-2xl font-black text-purple-300 font-mono block">
              {formatCurrency(metrics.totalArchivedValue)}
            </span>
            <span className="text-[10px] text-slate-400">
              Settled & closed revenue
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider block">
              Average Order Value (AOV)
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono block">
              {formatCurrency(metrics.aov)}
            </span>
            <span className="text-[10px] text-slate-400">
              Per archived invoice
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider block">
              Pending Archive Queue
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono block">
              {unarchivedDelivered.length}
            </span>
            <span className="text-[10px] text-slate-400">
              Delivered orders awaiting archiving
            </span>
          </div>
        </div>

        {/* Controls: Search, Channel Filter & Quick Archive Trigger */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-lg">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search archived invoice #, customer name, phone, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setChannelFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  channelFilter === 'all' ? 'bg-purple-600 text-white font-black' : 'text-slate-400'
                }`}
              >
                All Channels
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('online')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  channelFilter === 'online' ? 'bg-sky-600 text-white font-black' : 'text-slate-400'
                }`}
              >
                Online Doorstep
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('walk_in')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  channelFilter === 'walk_in' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400'
                }`}
              >
                Walk-in Counter
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Showing <strong className="text-white">{archivedOrders.length}</strong> archived records</span>
          </div>
        </div>

        {/* Archived Orders Table */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Archive className="w-4 h-4 text-purple-400" />
              <span>PERMANENT ORDER ARCHIVE VAULT</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Preserved for tax audits, DLT messaging history, and customer lifetime value
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Order Date</th>
                  <th className="py-3 px-3">Archived Timestamp (IST)</th>
                  <th className="py-3 px-3">Archived By</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Grand Total</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {archivedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-slate-500 font-sans space-y-2">
                      <Archive className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                      <p className="font-bold text-sm text-slate-400">No archived orders found.</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Orders marked as Delivered or Closed can be archived from Central Orders Desk to keep active operations clean.
                      </p>
                      {unarchivedDelivered.length > 0 && (
                        <button
                          type="button"
                          onClick={handleBulkArchive}
                          className="mt-3 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          Archive {unarchivedDelivered.length} Delivered Orders Now
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  archivedOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-sky-400">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditOrder(ord)}
                          className="hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>#{ord.invoiceNo}</span>
                          <Eye className="w-3 h-3 text-slate-500" />
                        </button>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="font-bold text-white block">{ord.customerName}</span>
                        {ord.customerPhone && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            +91 {ord.customerPhone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ord.orderChannel === 'walk_in'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-sky-500/20 text-sky-300'
                          }`}
                        >
                          {ord.orderChannel === 'walk_in' ? 'Walk-in' : 'Online'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300">
                        {ord.orderDate}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300 text-[11px]">
                        {formatDateTime(ord.archivedAt)}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                        {ord.archivedBy || 'Admin HQ'}
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        {ord.totalQty} {ord.isPerKgOrder ? 'kg' : 'pcs'}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {formatCurrency(ord.grandTotal)}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {ord.paymentMethod.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedAuditOrder(ord)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Audit order details"
                          >
                            <Eye className="w-3 h-3 text-sky-400" />
                            <span>Audit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUnarchive(ord.id)}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Restore order to active desk"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ORDER AUDIT MODAL */}
        {selectedAuditOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-black uppercase">
                      Archived Order Audit
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Archived: {formatDateTime(selectedAuditOrder.archivedAt)}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Invoice #{selectedAuditOrder.invoiceNo}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Customer: <strong className="text-white">{selectedAuditOrder.customerName}</strong> (+91 {selectedAuditOrder.customerPhone})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAuditOrder(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Order Details & Handover Security */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Security Handover PIN</span>
                  <span className="font-mono text-xl font-black text-amber-400 block tracking-widest">
                    {selectedAuditOrder.deliveryPin || '1234'}
                  </span>
                  <span className="text-[10px] text-slate-500">Customer verification token</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Settlement Method</span>
                  <span className="font-bold text-white capitalize block">
                    {(selectedAuditOrder.paymentMethod || 'cash').replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    {selectedAuditOrder.upiTransactionRef || 'Cash Settled'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Grand Total</span>
                  <span className="font-mono text-xl font-black text-white block">
                    {formatCurrency(selectedAuditOrder.grandTotal || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    GST 18% included ({formatCurrency(selectedAuditOrder.gstAmount || (selectedAuditOrder.grandTotal || 0) * 0.18 / 1.18)})
                  </span>
                </div>
              </div>

              {/* Garments Items Breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Itemized Garments ({selectedAuditOrder.items?.length || 0})
                </h4>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden text-xs">
                  {selectedAuditOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white block">{item.clothName}</span>
                        <span className="text-[11px] text-slate-400">
                          {item.serviceName} • Qty: {item.quantity} {item.foldStyle ? `• ${item.foldStyle}` : ''}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-200">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lifecycle Stage History with Exact System IST Timestamps */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Audit Lifecycle Timeline (Exact IST Records)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedAuditOrder.stageHistory && selectedAuditOrder.stageHistory.length > 0 ? (
                    selectedAuditOrder.stageHistory.map((st, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex justify-between items-start gap-3"
                      >
                        <div>
                          <div className="font-bold text-sky-400">{st.label || st.stage}</div>
                          {st.notes && <p className="text-[11px] text-slate-300 mt-0.5">{st.notes}</p>}
                          {st.actorName && (
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Actor: {st.actorName} ({st.actorRole || 'System'})
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {formatDateTime(st.timestamp)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-slate-500 text-xs bg-slate-950 rounded-xl">
                      Standard lifecycle completed on {selectedAuditOrder.orderDate}.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleUnarchive(selectedAuditOrder.id)}
                  className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore to Active Orders Desk</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAuditOrder(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function AdminOrderArchivePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs font-bold">Loading Order Archive...</div>}>
      <AdminOrderArchiveContent />
    </Suspense>
  );
}
