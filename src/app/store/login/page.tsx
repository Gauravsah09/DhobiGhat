'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { StoreOperatorRole, StoreStaff } from '@/types';

function getRoleMetadata(role: StoreOperatorRole | string) {
  switch (role) {
    case 'store_manager':
    case 'manager':
      return {
        label: 'Store Manager',
        icon: '👑',
        badge: 'Operations Lead',
        desc: 'Full operations access, floor, cash drawer, and staff supervision',
      };
    case 'store_operator':
    case 'counter_operator':
    case 'counter':
      return {
        label: 'Store Operator',
        icon: '🏪',
        badge: 'Front Desk & POS',
        desc: 'Counter intake, POS, drop dispatch, and customer billing',
      };
    case 'rider':
    case 'dispatch':
      return {
        label: 'Logistics Rider',
        icon: '🛵',
        badge: 'Pickup & Delivery',
        desc: 'Out for pickup, handover collections, out for delivery',
      };
    case 'worker':
    case 'wash_operator':
    case 'iron_operator':
    case 'qc_checker':
    default:
      return {
        label: 'Floor Worker',
        icon: '🫧',
        badge: 'Floor & Processing',
        desc: 'Sorting, machine wash, tumble dry, steam press, and QC packed',
      };
  }
}

export default function StoreOperatorLoginPage() {
  const router = useRouter();
  const { staffSession, staffList, branches } = useLaundry();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || 'branch-blr-1');
  const [selectedShift, setSelectedShift] = useState<'morning' | 'evening'>('morning');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedStaff: StoreStaff | undefined =
    staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  const selectedMeta = selectedStaff ? getRoleMetadata(selectedStaff.role) : null;

  const handleSelectStaff = (staff: StoreStaff) => {
    setSelectedStaffId(staff.id);
    if (staff.storeId) setSelectedBranch(staff.storeId);
    if (staff.activeShift && (staff.activeShift === 'morning' || staff.activeShift === 'evening')) {
      setSelectedShift(staff.activeShift);
    }
    setPassword('');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) {
      setErrorMsg('Please select a staff member to sign in.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const identifier = selectedStaff.phone || selectedStaff.role;
      const success = staffSession.loginWithPassword(identifier, password, selectedBranch, selectedShift);
      if (success) {
        router.push('/store');
      } else {
        setErrorMsg('Invalid staff credentials. Please check your shift password.');
        setIsLoading(false);
      }
    }, 250);
  };

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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-2xl w-full space-y-6">

          {/* Brand & Badge */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-sky-500/20">
              <Building2 className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-bold mt-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Store Operations Terminal (RBAC)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Staff Shift Check-In</h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select your staff profile and enter your shift credentials to open store floor pipelines and POS registers.
            </p>
          </div>

          {/* If No Staff Registered: Show Empty State with Link to Admin Console */}
          {staffList.length === 0 ? (
            <div className="rounded-3xl bg-slate-800/90 border border-slate-700/80 p-8 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white">No Store Staff Accounts Registered</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  All previous mock and test staff records have been purged. Only Admin accounts are active. Please sign in to the HQ Admin Console to create store operators, managers, and riders.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/admin/login"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Go to Admin Console & Add Staff</span>
                </Link>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition-all text-center"
                >
                  Return to Portal Home
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Dynamic Staff Tiles from registered staffList */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {staffList.map((st) => {
                  const meta = getRoleMetadata(st.role);
                  const isSelected = selectedStaff?.id === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      id={`staff-tile-${st.id}`}
                      onClick={() => handleSelectStaff(st)}
                      className={`text-left p-4 rounded-2xl border transition-all relative flex flex-col justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 border-sky-500 shadow-lg shadow-sky-500/20 ring-2 ring-sky-500/40'
                          : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center">
                            {meta.icon}
                          </span>
                          <div>
                            <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                              <span>{st.name}</span>
                            </div>
                            <div className="text-xs font-bold text-sky-400 font-mono">
                              {meta.label}
                            </div>
                          </div>
                        </div>
                        {isSelected ? (
                          <span className="p-1 rounded-full bg-sky-500 text-white">
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-700/70 text-slate-300">
                            {meta.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-1">
                        {meta.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Form Card */}
              <div className="rounded-3xl bg-slate-800/90 border border-slate-700/80 p-6 sm:p-7 shadow-2xl space-y-5">
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
                        onChange={(e) => setSelectedShift(e.target.value as 'morning' | 'evening')}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="morning">🌅 Morning Shift (07:00 AM - 03:00 PM)</option>
                        <option value="evening">🌇 Evening Shift (03:00 PM - 10:00 PM)</option>
                      </select>
                    </div>
                  </div>

                  {/* Selected Profile Summary */}
                  {selectedStaff && selectedMeta && (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <UserCheck className="w-4 h-4 text-sky-400" />
                        <span className="text-xs text-slate-300">
                          Signing in as <strong className="text-white font-bold">{selectedStaff.name}</strong> ({selectedMeta.label})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/70 border border-sky-800/40 text-sky-300 font-bold">
                        {selectedMeta.badge}
                      </span>
                    </div>
                  )}

                  {/* Password Input with Show/Hide Toggle */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Staff Shift Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      {showPassword ? (
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Enter shift password"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono"
                        />
                      ) : (
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Enter shift password"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Security Policy Notice */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 text-[11px] text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Enter your operator password issued by store management.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isLoading ? 'Verifying Shift Check-In...' : 'Check In & Open Store Floor'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}

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
