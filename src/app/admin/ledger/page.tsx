'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  CreditCard,
  QrCode,
  Banknote,
  DollarSign,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Archive,
  ShoppingBag,
  Building,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Order, PaymentMethod } from '@/types';

type LedgerPeriod = 'daily' | 'monthly' | 'quarterly' | 'yearly';

function AdminLedgerContent() {
  const router = useRouter();
  const { adminSession, orders, branches, settings, isLoaded } = useLaundry();
  const { admin, isAdminLoggedIn } = adminSession;

  // Strict Redirect Guard: If not logged in as admin, redirect to /admin/login
  useEffect(() => {
    if (!isLoaded) return;
    const localAdminId = typeof window !== 'undefined' ? localStorage.getItem('lms_ind_auth_admin_id_v3') : null;
    if (!isAdminLoggedIn && !localAdminId) {
      router.replace('/admin/login');
    }
  }, [isAdminLoggedIn, isLoaded, router]);

  const [period, setPeriod] = useState<LedgerPeriod>('daily');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [journalSearch, setJournalSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ledger' | 'journal'>('ledger');

  // Filter orders by branch
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedBranch !== 'all' && o.storeId !== selectedBranch) return false;
      return true;
    });
  }, [orders, selectedBranch]);

  // Financial KPI Metrics
  const metrics = useMemo(() => {
    let grossTotal = 0;
    let settledTotal = 0;
    let pendingTotal = 0;
    let upiTotal = 0;
    let cashTotal = 0;
    let posTotal = 0;
    let gstTotal = 0;
    let settledCount = 0;

    filteredOrders.forEach((o) => {
      if (o.status === 'cancelled') return;

      const rawGrand = typeof o.grandTotal === 'number' && !isNaN(o.grandTotal) ? o.grandTotal : 0;
      grossTotal += rawGrand;
      const gst = typeof o.gstAmount === 'number' && !isNaN(o.gstAmount) ? o.gstAmount : (rawGrand * 0.18 / 1.18);
      gstTotal += gst;

      if (o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'closed') {
        settledTotal += rawGrand;
        settledCount++;

        const method = o.paymentMethod;
        if (method === 'upi_qr' || method === 'cod_upi') {
          upiTotal += rawGrand;
        } else if (method === 'cod_cash' || method === 'bycash') {
          cashTotal += rawGrand;
        } else if (method === 'pos_machine') {
          posTotal += rawGrand;
        } else {
          upiTotal += rawGrand; // fallback digital
        }
      } else {
        pendingTotal += rawGrand;
      }
    });

    const aov = settledCount > 0 ? settledTotal / settledCount : 0;

    return {
      grossTotal,
      settledTotal,
      pendingTotal,
      upiTotal,
      cashTotal,
      posTotal,
      gstTotal,
      cgst: gstTotal / 2,
      sgst: gstTotal / 2,
      settledCount,
      aov,
      realizationRate: grossTotal > 0 ? (settledTotal / grossTotal) * 100 : 0,
    };
  }, [filteredOrders]);

  // Aggregated Ledger Data by Period
  const ledgerRows = useMemo(() => {
    const map: Record<string, {
      key: string;
      label: string;
      subLabel?: string;
      orderCount: number;
      grossRevenue: number;
      settledAmount: number;
      upiAmount: number;
      cashAmount: number;
      posAmount: number;
      gstAmount: number;
      pendingAmount: number;
    }> = {};

    filteredOrders.forEach((o) => {
      if (o.status === 'cancelled') return;

      const rawGrand = typeof o.grandTotal === 'number' && !isNaN(o.grandTotal) ? o.grandTotal : 0;
      const dateStr = o.pickupSlot?.date || o.orderDate || new Date().toISOString().split('T')[0];
      let d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        d = new Date();
      }
      const year = d.getFullYear() || 2026;
      const month = d.getMonth(); // 0-11

      let groupKey = '';
      let groupLabel = '';
      let subLabel = '';

      if (period === 'daily') {
        groupKey = dateStr;
        try {
          groupLabel = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
          subLabel = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });
        } catch {
          groupLabel = dateStr;
          subLabel = 'Day';
        }
      } else if (period === 'monthly') {
        groupKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        try {
          groupLabel = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' });
        } catch {
          groupLabel = `${month + 1}/${year}`;
        }
        subLabel = `FY ${year}`;
      } else if (period === 'quarterly') {
        const q = Math.floor(month / 3) + 1;
        groupKey = `${year}-Q${q}`;
        const qNames = ['Q1 (Jan - Mar)', 'Q2 (Apr - Jun)', 'Q3 (Jul - Sep)', 'Q4 (Oct - Dec)'];
        groupLabel = `${qNames[q - 1]} ${year}`;
        subLabel = `Quarter ${q}`;
      } else {
        // yearly
        groupKey = `${year}`;
        groupLabel = `FY ${year} - ${year + 1}`;
        subLabel = `Annual Financial Ledger`;
      }

      if (!map[groupKey]) {
        map[groupKey] = {
          key: groupKey,
          label: groupLabel,
          subLabel,
          orderCount: 0,
          grossRevenue: 0,
          settledAmount: 0,
          upiAmount: 0,
          cashAmount: 0,
          posAmount: 0,
          gstAmount: 0,
          pendingAmount: 0,
        };
      }

      const row = map[groupKey];
      row.orderCount++;
      row.grossRevenue += rawGrand;
      const gst = typeof o.gstAmount === 'number' && !isNaN(o.gstAmount) ? o.gstAmount : (rawGrand * 0.18 / 1.18);
      row.gstAmount += gst;

      const isPaid = o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'closed';
      if (isPaid) {
        row.settledAmount += rawGrand;
        const method = o.paymentMethod;
        if (method === 'upi_qr' || method === 'cod_upi') {
          row.upiAmount += rawGrand;
        } else if (method === 'cod_cash' || method === 'bycash') {
          row.cashAmount += rawGrand;
        } else if (method === 'pos_machine') {
          row.posAmount += rawGrand;
        } else {
          row.upiAmount += rawGrand;
        }
      } else {
        row.pendingAmount += rawGrand;
      }
    });

    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredOrders, period]);

  // Transaction Journal List
  const journalEntries = useMemo(() => {
    return filteredOrders
      .filter((o) => {
        if (!journalSearch.trim()) return true;
        const q = journalSearch.toLowerCase();
        return (
          (o.invoiceNo || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.customerPhone && o.customerPhone.includes(q)) ||
          (o.upiTransactionRef && o.upiTransactionRef.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (b.orderDate || '').localeCompare(a.orderDate || ''));
  }, [filteredOrders, journalSearch]);

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = [
      'Period',
      'Cycle',
      'Total Orders',
      'Gross Revenue (INR)',
      'Net Settled (INR)',
      'UPI Collections (INR)',
      'Cash Collections (INR)',
      'POS Card Collections (INR)',
      'GST 18% (INR)',
      'Pending Due (INR)',
      'Realization %'
    ];

    const rows = ledgerRows.map((r) => [
      `"${r.label}"`,
      `"${r.subLabel || ''}"`,
      r.orderCount,
      r.grossRevenue.toFixed(2),
      r.settledAmount.toFixed(2),
      r.upiAmount.toFixed(2),
      r.cashAmount.toFixed(2),
      r.posAmount.toFixed(2),
      r.gstAmount.toFixed(2),
      r.pendingAmount.toFixed(2),
      `${r.grossRevenue > 0 ? ((r.settledAmount / r.grossRevenue) * 100).toFixed(1) : 0}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DhobiGhat_Revenue_Ledger_${period.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
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
        <h2 className="text-xl font-black text-white mb-2">Restricted Ledger Access</h2>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          This financial ledger contains sensitive revenue data and is protected by RBAC policy. Redirecting to admin login screen...
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
              title="Return to Admin HQ"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  DhobiGhat Books
                </span>
                <span className="text-[11px] text-slate-400">GSTIN: {settings.gstin || '29AABCU9603R1ZM'}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Revenue Ledger & Accounting Audit</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/admin/archive"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Archive className="w-3.5 h-3.5 text-purple-400" />
              <span>Order Archive</span>
            </Link>

            <button
              type="button"
              onClick={exportToCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
              Gross Invoiced
            </span>
            <span className="text-lg sm:text-xl font-black text-white font-mono block">
              {formatCurrency(metrics.grossTotal)}
            </span>
            <span className="text-[10px] text-slate-400">Total volume billed</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1 shadow-xs">
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider block">
              Net Settled (Realized)
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono block">
              {formatCurrency(metrics.settledTotal)}
            </span>
            <span className="text-[10px] text-emerald-300/80">
              {metrics.realizationRate.toFixed(1)}% realization rate
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-1">
            <span className="text-purple-300 text-[10px] font-bold uppercase tracking-wider block">
              UPI Collections
            </span>
            <span className="text-lg sm:text-xl font-black text-purple-300 font-mono block">
              {formatCurrency(metrics.upiTotal)}
            </span>
            <span className="text-[10px] text-slate-400">
              {metrics.settledTotal > 0 ? ((metrics.upiTotal / metrics.settledTotal) * 100).toFixed(0) : 0}% of settled
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-amber-300 text-[10px] font-bold uppercase tracking-wider block">
              Cash / POS Terminal
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 font-mono block">
              {formatCurrency(metrics.cashTotal + metrics.posTotal)}
            </span>
            <span className="text-[10px] text-slate-400">
              Cash: {formatCurrency(metrics.cashTotal)} • POS: {formatCurrency(metrics.posTotal)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-sky-300 text-[10px] font-bold uppercase tracking-wider block">
              GST 18% (CGST + SGST)
            </span>
            <span className="text-lg sm:text-xl font-black text-sky-300 font-mono block">
              {formatCurrency(metrics.gstTotal)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              CGST: {formatCurrency(metrics.cgst)} | SGST: {formatCurrency(metrics.sgst)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/20 space-y-1">
            <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider block">
              Pending Receivables
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-400 font-mono block">
              {formatCurrency(metrics.pendingTotal)}
            </span>
            <span className="text-[10px] text-slate-400">
              AOV: {formatCurrency(metrics.aov)}
            </span>
          </div>
        </div>

        {/* Period Navigation & Control Bar */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Period Tabs: Daily, Monthly, Quarterly, Yearly */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => { setPeriod('daily'); setActiveTab('ledger'); }}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                period === 'daily'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daily Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => { setPeriod('monthly'); setActiveTab('ledger'); }}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                period === 'monthly'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Monthly Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => { setPeriod('quarterly'); setActiveTab('ledger'); }}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                period === 'quarterly'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Quarterly Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => { setPeriod('yearly'); setActiveTab('ledger'); }}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                period === 'yearly'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Yearly Ledger</span>
            </button>
          </div>

          {/* Sub Tab View: Aggregate Ledger vs Transaction Journal */}
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('ledger')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'ledger' ? 'bg-slate-800 text-white font-black' : 'text-slate-400'
                }`}
              >
                Aggregated Table
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'journal' ? 'bg-slate-800 text-white font-black' : 'text-slate-400'
                }`}
              >
                Journal Entries ({journalEntries.length})
              </button>
            </div>

            {/* Branch selector */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none"
            >
              <option value="all">All Stores & Counters</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TAB 1: AGGREGATED LEDGER TABLE */}
        {activeTab === 'ledger' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                <span>{period.toUpperCase()} FINANCIAL LEDGER AUDIT</span>
              </span>
              <span className="text-slate-400">
                Aggregating {ledgerRows.length} {period} cycles • All figures in INR (₹)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                    <th className="py-3 px-4">Period / Date</th>
                    <th className="py-3 px-3">Orders</th>
                    <th className="py-3 px-3">Gross Billed</th>
                    <th className="py-3 px-3 text-emerald-400">Settled (Net)</th>
                    <th className="py-3 px-3 text-purple-300">UPI Collected</th>
                    <th className="py-3 px-3 text-amber-300">Cash Collected</th>
                    <th className="py-3 px-3 text-indigo-300">POS Card</th>
                    <th className="py-3 px-3 text-sky-300">GST (18%)</th>
                    <th className="py-3 px-3 text-rose-400">Pending Due</th>
                    <th className="py-3 px-4 text-right">Realization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {ledgerRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                        No financial transactions found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    ledgerRows.map((row) => {
                      const rate = row.grossRevenue > 0 ? (row.settledAmount / row.grossRevenue) * 100 : 0;
                      return (
                        <tr key={row.key} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-sans">
                            <span className="font-bold text-white block">{row.label}</span>
                            {row.subLabel && <span className="text-[10px] text-slate-400 block">{row.subLabel}</span>}
                          </td>
                          <td className="py-3 px-3 text-slate-200 font-bold">{row.orderCount}</td>
                          <td className="py-3 px-3 font-bold text-white">{formatCurrency(row.grossRevenue)}</td>
                          <td className="py-3 px-3 font-bold text-emerald-400 bg-emerald-500/5">
                            {formatCurrency(row.settledAmount)}
                          </td>
                          <td className="py-3 px-3 text-purple-300">{formatCurrency(row.upiAmount)}</td>
                          <td className="py-3 px-3 text-amber-300">{formatCurrency(row.cashAmount)}</td>
                          <td className="py-3 px-3 text-indigo-300">{formatCurrency(row.posAmount)}</td>
                          <td className="py-3 px-3 text-sky-300">{formatCurrency(row.gstAmount)}</td>
                          <td className="py-3 px-3 text-rose-400">
                            {row.pendingAmount > 0 ? formatCurrency(row.pendingAmount) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                rate >= 90
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : rate >= 60
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {rate.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {ledgerRows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-700 bg-slate-950 font-mono font-black text-xs text-white">
                      <td className="py-3.5 px-4 font-sans uppercase">Total Summary</td>
                      <td className="py-3.5 px-3">{ledgerRows.reduce((s, r) => s + r.orderCount, 0)}</td>
                      <td className="py-3.5 px-3 text-white">{formatCurrency(metrics.grossTotal)}</td>
                      <td className="py-3.5 px-3 text-emerald-400">{formatCurrency(metrics.settledTotal)}</td>
                      <td className="py-3.5 px-3 text-purple-300">{formatCurrency(metrics.upiTotal)}</td>
                      <td className="py-3.5 px-3 text-amber-300">{formatCurrency(metrics.cashTotal)}</td>
                      <td className="py-3.5 px-3 text-indigo-300">{formatCurrency(metrics.posTotal)}</td>
                      <td className="py-3.5 px-3 text-sky-300">{formatCurrency(metrics.gstTotal)}</td>
                      <td className="py-3.5 px-3 text-rose-400">{formatCurrency(metrics.pendingTotal)}</td>
                      <td className="py-3.5 px-4 text-right font-sans text-emerald-400">
                        {metrics.realizationRate.toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED TRANSACTION JOURNAL */}
        {activeTab === 'journal' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 space-y-4 p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-extrabold text-base text-white">Line-by-Line Transaction Journal</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Auditable record of all order settlements, payment modes, and gateway references.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search invoice, customer, ref..."
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-black">
                    <th className="py-2.5 px-3">Invoice</th>
                    <th className="py-2.5 px-3">Date / IST Timestamp</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Transaction Ref</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {journalEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500 font-sans">
                        No transactions matched your search query.
                      </td>
                    </tr>
                  ) : (
                    journalEntries.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-sky-400">
                          <Link href={`/customer/orders?inv=${ord.invoiceNo}`} target="_blank" className="hover:underline">
                            #{ord.invoiceNo}
                          </Link>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-300 text-[11px]">
                          {formatDateTime(ord.stageTimestamps?.closed || ord.stageTimestamps?.delivered || ord.orderDate)}
                        </td>
                        <td className="py-3 px-3 font-sans font-bold text-white">
                          {ord.customerName}
                          {ord.customerPhone && (
                            <span className="block text-[10px] text-slate-400 font-normal">
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
                        <td className="py-3 px-3 font-sans text-slate-200 capitalize">
                          {ord.paymentMethod.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-slate-400">
                          {ord.upiTransactionRef || (ord.posDetails ? `RRN:${ord.posDetails.rrn}` : '—')}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          {formatCurrency(ord.grandTotal)}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              ord.paymentStatus === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : ord.status === 'cancelled'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {ord.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function AdminLedgerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs font-bold">Loading Financial Ledger...</div>}>
      <AdminLedgerContent />
    </Suspense>
  );
}
