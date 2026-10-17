'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Shirt, 
  Smartphone, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function MainPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-sky-500 selection:text-white relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-600/15 via-indigo-600/10 to-purple-600/15 blur-3xl pointer-events-none rounded-full" />

      {/* Top Subtle Brand Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Shirt className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white block leading-tight">
              DhobiGhat Enterprise
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
              Modern Laundry & Dry Cleaning OS
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Enterprise Secure Cloud Platform</span>
        </div>
      </header>

      {/* Central Content: Brand Name, Description & 1-Liner Login Section */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col items-center text-center space-y-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>DhobiGhat Enterprise Platform</span>
        </div>

        {/* Brand Name */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            DhobiGhat Enterprise
          </h1>
          <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
            Next-generation enterprise point-of-sale, doorstep logistics dispatch, and floor garment processing platform built for modern laundry and dry cleaning operations.
          </p>
        </div>

        {/* Login Section: Clean 1-Liner Row */}
        <div className="w-full pt-4 space-y-4">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Select Portal to Sign In
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto">
            
            {/* Customer Login */}
            <Link
              href="/customer/auth"
              id="customer-login-portal-btn"
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/60 hover:bg-slate-900 text-left transition-all hover:shadow-xl hover:shadow-sky-500/10 group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white group-hover:text-sky-300 transition-colors">
                    Customer Login
                  </div>
                  <div className="text-[11px] text-slate-400">Bookings & Tracking</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Store Staff Login */}
            <Link
              href="/store/login"
              id="store-staff-login-portal-btn"
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900 text-left transition-all hover:shadow-xl hover:shadow-emerald-500/10 group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                    Store Staff Login
                  </div>
                  <div className="text-[11px] text-slate-400">Floor POS & Dispatch</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            {/* Admin Login */}
            <Link
              href="/admin/login"
              id="admin-login-portal-btn"
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/60 hover:bg-slate-900 text-left transition-all hover:shadow-xl hover:shadow-purple-500/10 group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors">
                    Admin Login
                  </div>
                  <div className="text-[11px] text-slate-400">Executive Desk & HQ</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>© 2026 DhobiGhat Enterprise. All rights reserved.</div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Enterprise Logistics Engine</span>
          <span>•</span>
          <span>Zero-Local-Storage Architecture</span>
        </div>
      </footer>

    </div>
  );
}
