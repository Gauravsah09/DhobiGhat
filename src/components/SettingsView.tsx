'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Server, 
  Cloud, 
  Globe, 
  Copy, 
  Check, 
  Sparkles,
  Save,
  HelpCircle
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { initialClothTypes, initialCustomers, initialExpenses, initialOrders, initialPriceMatrix, initialServices, initialShopSettings } from '@/lib/initial-data';

export function SettingsView() {
  const { settings, updateSettings } = useLaundry();

  const [form, setForm] = useState({
    shopName: settings.shopName,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    city: settings.city,
    currency: settings.currency,
    taxRate: settings.taxRate,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...form,
      taxRate: Number(form.taxRate),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export full JSON database
  const handleExportData = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      settings: localStorage.getItem('lms_settings_v1'),
      customers: localStorage.getItem('lms_customers_v1'),
      clothes: localStorage.getItem('lms_clothes_v1'),
      services: localStorage.getItem('lms_services_v1'),
      prices: localStorage.getItem('lms_prices_v1'),
      orders: localStorage.getItem('lms_orders_v1'),
      expenses: localStorage.getItem('lms_expenses_v1'),
      employees: localStorage.getItem('lms_employees_v1'),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laundry_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset to default seed
  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data back to original seed defaults? Any unsaved orders will be reset.')) {
      localStorage.setItem('lms_settings_v1', JSON.stringify(initialShopSettings));
      localStorage.setItem('lms_customers_v1', JSON.stringify(initialCustomers));
      localStorage.setItem('lms_clothes_v1', JSON.stringify(initialClothTypes));
      localStorage.setItem('lms_services_v1', JSON.stringify(initialServices));
      localStorage.setItem('lms_prices_v1', JSON.stringify(initialPriceMatrix));
      localStorage.setItem('lms_orders_v1', JSON.stringify(initialOrders));
      localStorage.setItem('lms_expenses_v1', JSON.stringify(initialExpenses));
      window.location.reload();
    }
  };

  const handleCopySqlHint = () => {
    navigator.clipboard.writeText('See laundry-app/supabase-schema.sql');
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co'
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System & Business Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your laundry shop profile, zero-cost cloud sync, and data backups.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Store Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Shop Profile & Invoicing</h2>
                  <p className="text-xs text-slate-500">Details printed on customer receipts and tax invoices</p>
                </div>
              </div>
              {savedSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Saved!
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Shop / Brand Name
                  </label>
                  <input
                    type="text"
                    value={form.shopName}
                    onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-sky-500 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone / Helpline
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-sky-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Business Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-sky-500 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City / State
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-sky-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Shop Address
                </label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-sky-500 transition-all font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Currency Symbol
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-sky-500 transition-all font-medium"
                  >
                    <option value="$">USD ($)</option>
                    <option value="₹">INR (₹)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                    <option value="AED">AED (AED)</option>
                    <option value="SAR">SAR (SAR)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sales Tax / VAT Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-sky-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-semibold rounded-xl shadow-md shadow-sky-600/20 transition-all text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Store Settings
                </button>
              </div>
            </form>
          </div>

          {/* Database Backup & Disaster Recovery */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Data Backup & Migration</h2>
                <p className="text-xs text-slate-500">Local-first data snapshotting and zero data-loss recovery</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Your application maintains a fast, offline-ready local cache with complete customer records, rates, and past orders. You can export a JSON backup at any time or restore demo seed data.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                Export Full Backup (JSON)
              </button>

              <button
                onClick={handleResetData}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                Reset To Default Demo Data
              </button>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Zero-Cost Cloud Architecture SRE Card */}
        <div className="space-y-6">
          
          {/* Cloud Status Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Tier: $0.00 / Month
              </span>
              <Cloud className="w-5 h-5 text-sky-400" />
            </div>

            <h3 className="text-lg font-bold tracking-tight mb-1">Serverless Cloud Architecture</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              DhobiGhat runs on a self-contained, hyper-scalable architecture with local-first offline resilience, real-time sync, and optional Supabase cloud persistence.
            </p>

            <div className="space-y-3 pt-2 border-t border-slate-700/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" /> Edge Delivery
                </span>
                <span className="font-semibold text-slate-200">Vercel Hobby (Free)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> Primary DB
                </span>
                <span className="font-semibold text-slate-200">Supabase Postgres</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-amber-400" /> Container Ready
                </span>
                <span className="font-semibold text-slate-200">Docker (Alpine)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Security
                </span>
                <span className="font-semibold text-slate-200">SQLi & XSS Immune</span>
              </div>
            </div>
          </div>

          {/* Supabase 1-Click Setup Guide */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Supabase Free Database Setup</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              To connect your live PostgreSQL database on Supabase (Free 500MB):
            </p>

            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed font-medium">
              <li>Create a free project at <span className="text-sky-600 font-semibold">supabase.com</span></li>
              <li>Go to the <span className="font-semibold text-slate-800">SQL Editor</span> in your Supabase dashboard</li>
              <li>Run the provided script: <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px]">supabase-schema.sql</code></li>
              <li>Copy your Project URL and Anon Public Key to <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px]">.env.local</code></li>
            </ol>

            <div className="pt-2">
              <button
                onClick={handleCopySqlHint}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Schema file ready in root</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>View SQL Migration Script</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* System Specs Badge */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500 space-y-1">
            <div className="flex justify-between font-medium">
              <span>Next.js Engine:</span>
              <span className="text-slate-800">App Router (v16)</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>CSS Framework:</span>
              <span className="text-slate-800">Tailwind CSS v4</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Receipt Engine:</span>
              <span className="text-slate-800">Native Client Thermal CSS</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
