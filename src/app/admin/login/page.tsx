'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  Building2, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { AdminRole } from '@/types';

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminSession, isLoaded } = useLaundry();
  const { loginAdmin, isAdminLoggedIn, admin } = adminSession;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, seamlessly forward to admin dashboard
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
        setErrorMsg('Invalid admin credentials. Access denied.');
        setIsLoading(false);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Master Launchpad</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-400 font-mono">RBAC Security Engine Active</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full space-y-6">
          
          {/* Brand & Badge */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-sky-500/20">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-bold mt-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HQ Executive Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin Console Login</h1>
            <p className="text-xs text-slate-400">
              Sign in to manage multi-store branches, dynamic pricing, GST tax registers, and operator permissions.
            </p>
          </div>

          {/* Login Form Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="e.g. admin or admin@dhobighat.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password or Master PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="admin123 or 9999"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Administrator Directory Reference */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <div className="text-center">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Administrator Directory (Testing Reference)
                </span>
                <span className="text-[10px] text-slate-500">
                  Click to autofill credentials into form, then click Sign In
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('admin');
                    setPassword('admin123');
                    setErrorMsg('');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                      👑
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                        Super Admin (Vikram Singhania)
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">admin • Password: admin123</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-400/20">
                    Fill Form
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('owner.blr');
                    setPassword('admin123');
                    setErrorMsg('');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      🏢
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        Franchise Owner (Rajesh Hegde)
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">owner.blr • Password: admin123</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-400/20">
                    Fill Form
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('finance');
                    setPassword('admin123');
                    setErrorMsg('');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      📊
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Finance Auditor (Ananya Sharma)
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">finance • Password: admin123</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-400/20">
                    Fill Form
                  </span>
                </button>
              </div>
            </div>

          </div>

          {/* Quick links to Store and Customer */}
          <div className="flex justify-between items-center text-xs text-slate-500 px-2">
            <Link href="/store/login" className="hover:text-slate-300 transition-colors">
              Store Floor Shift Login ➔
            </Link>
            <Link href="/customer" className="hover:text-slate-300 transition-colors">
              Customer App ➔
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
