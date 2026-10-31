'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  Crown,
  KeyRound,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminSession, isLoaded } = useLaundry();
  const { loginAdmin, isAdminLoggedIn, admin } = adminSession;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, forward to admin dashboard
  useEffect(() => {
    if (isLoaded && isAdminLoggedIn && admin) {
      router.replace('/admin');
    }
  }, [isLoaded, isAdminLoggedIn, admin, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const success = loginAdmin(identifier, password);
      if (success) {
        router.replace('/admin');
      } else {
        setErrorMsg('Access Denied: Invalid executive credentials or unauthorized role.');
        setIsLoading(false);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Master Launchpad</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SUPERADMIN LEVEL-4 ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full space-y-6 relative z-10">
          
          {/* Brand & High-Security Authority Badge */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-emerald-500 to-slate-900 p-[1.5px] shadow-2xl shadow-emerald-500/20 mx-auto">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-amber-400">
                  <Crown className="w-8 h-8 stroke-[2.2]" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-md">
                HQ
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Superadmin Headquarters • Master Security Terminal</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Executive Cockpit Console</h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Master control plane for multi-store network routing, capacity overrides, turnaround metrics, and executive governance.
            </p>
          </div>

          {/* Login Form Card */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5 backdrop-blur-xl relative">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Executive Username or Email</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-normal">Superadmin / Executive</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="e.g. admin or admin@dhobighat.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Master Password</span>
                  <span className="text-[10px] text-slate-500 font-normal font-mono">Encrypted Hash Auth</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  {showPassword ? (
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter master password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all font-mono"
                    />
                  ) : (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter master password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all font-mono"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? 'Authenticating Executive Credentials...' : 'Access Executive Cockpit'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Executive Security Notice */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
              <span>Authorized executive credentials required. All login sessions are audited.</span>
            </div>
          </div>

          {/* Quick links to Store and Customer */}
          <div className="flex justify-between items-center text-xs text-slate-500 px-2">
            <Link href="/store/login" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <span>Store Shift Portal</span>
              <span>➔</span>
            </Link>
            <Link href="/customer" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              <span>Customer Portal</span>
              <span>➔</span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
