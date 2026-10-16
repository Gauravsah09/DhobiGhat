'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  KeyRound, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  Users
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { StoreOperatorRole } from '@/types';

export default function StoreOperatorLoginPage() {
  const router = useRouter();
  const { staffSession, branches } = useLaundry();
  const { loginWithPin } = staffSession;

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || 'branch-blr-1');
  const [selectedShift, setSelectedShift] = useState<'morning' | 'evening'>('morning');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const success = loginWithPin(phone, pin, selectedBranch, selectedShift);
      if (success) {
        router.push('/store');
      } else {
        setErrorMsg('Invalid phone number or 4-digit shift PIN. Access denied.');
        setIsLoading(false);
      }
    }, 300);
  };

  const rolePills = [
    { role: 'store_manager', label: 'Store Manager', name: 'Vikas Patil', phone: '9876543214', pin: '9999', icon: '👑', desc: 'Full access to online pipeline, walk-ins, and floor' },
    { role: 'store_operator', label: 'Store Operator', name: 'Ramesh Sharma', phone: '9876543210', pin: '1234', icon: '🏪', desc: 'Order Receive Queue, Pickup & Drop Assigned + Walk-in counter' },
    { role: 'worker', label: 'Worker', name: 'Sunil Gowda', phone: '9876543211', pin: '2222', icon: '🫧', desc: 'Received, Sorting, Washing, Drying, Ironing, QC & Packed' },
    { role: 'rider', label: 'Rider', name: 'Mahesh Rider', phone: '9876543216', pin: '6666', icon: '🛵', desc: 'Out for Pickup, Picked-up, Reached Store, Out for Delivery, Delivered' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Master Portal Switcher</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-400 font-mono">Store Floor Terminal • Shift Active</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full space-y-6">
          
          {/* Brand & Badge */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-sky-500/20">
              <Building2 className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-bold mt-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Store Operations Terminal (RBAC)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Store Operator Shift Check-In</h1>
            <p className="text-xs text-slate-400">
              Check in with your registered phone and 4-digit shift PIN to access floor pipelines and counter POS.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl bg-slate-800/80 border border-slate-700/80 p-6 sm:p-7 shadow-2xl space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Store Branch
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Active Shift Slot
                  </label>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="morning">🌅 Morning Shift (07:00 AM - 03:00 PM)</option>
                    <option value="evening">🌇 Evening Shift (03:00 PM - 10:00 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Registered Operator Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="e.g. 9876543214"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  4-Digit Shift PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    placeholder="9999"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Verifying Shift Check-In...' : 'Check In & Open Store Floor'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Operator Credentials Directory Reference */}
            <div className="pt-4 border-t border-slate-700/80 space-y-2.5">
              <div className="text-center">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Operator Credentials Directory
                </span>
                <span className="text-[10px] text-slate-500">
                  Click to autofill credentials into form, then submit to check in
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {rolePills.map((p) => (
                  <button
                    key={p.role}
                    type="button"
                    id={`quick-login-${p.role}`}
                    onClick={() => {
                      setPhone(p.phone);
                      setPin(p.pin);
                      setErrorMsg('');
                      const success = loginWithPin(p.phone, p.pin, selectedBranch, selectedShift);
                      if (success) {
                        router.push('/store');
                      }
                    }}
                    className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700/70 text-left transition-all group hover:border-sky-500/50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{p.icon}</span>
                      <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/40">PIN: {p.pin}</span>
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors mt-1">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                      {p.label} • {p.phone}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Quick links to Admin Login and Customer */}
          <div className="flex justify-between items-center text-xs text-slate-400 px-2">
            <Link href="/admin/login" className="hover:text-slate-200 transition-colors">
              HQ Admin Login ➔
            </Link>
            <Link href="/customer" className="hover:text-slate-200 transition-colors">
              Customer App ➔
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
