'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shirt, 
  Smartphone, 
  Building2, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Scale, 
  CreditCard, 
  QrCode, 
  Truck, 
  Layers, 
  Sparkles,
  MapPin,
  Tag
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { formatCurrency } from '@/lib/utils';

export default function AppPortalSwitcher() {
  const { staffSession, adminSession, customerSession, orders, branches, customers, perKgRates, settings } = useLaundry();
  const { isCheckedIn, staff, logoutStaff } = staffSession;
  const { isAdminLoggedIn, admin, logoutAdmin } = adminSession;
  const { user, isLoggedIn } = customerSession;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Top Brand Strip */}
      <div className="bg-slate-900/80 border-b border-slate-800 text-[11px] py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Tailored Specifically for Indian Laundry & Dry Cleaning Businesses</span>
            </span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:inline">GSTIN: {settings.gstin}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Tenant Local-First Engine</span>
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Security & Category Access Status */}
      <div className="bg-slate-900 border-b border-slate-800 text-[11px] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            Security & Direct Access Control:
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Store Floor:</span>
              {isCheckedIn && staff ? (
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ✓ {staff.name} ({staff.role.replace('_', ' ')})
                </span>
              ) : (
                <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  🔒 Locked (Login Required)
                </span>
              )}
            </span>

            <span className="text-slate-700">•</span>

            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Admin Console:</span>
              {isAdminLoggedIn && admin ? (
                <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
                  ✓ {admin.name.split(' ')[0]} ({admin.role.replace('_', ' ')})
                </span>
              ) : (
                <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  🔒 Locked (Login Required)
                </span>
              )}
            </span>

            <span className="text-slate-700">•</span>

            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Customer Portal:</span>
              {isLoggedIn && user ? (
                <span className="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/30">
                  ✓ {user.firstName || 'Customer'} ({user.phone})
                </span>
              ) : (
                <span className="text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  Guest Mode
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>DhobiGhat India • Unified Split Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          DhobiGhat Enterprise OS <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
            Split for Customers, Floor Staff & Admin
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
          Select an application below to experience the specialized workflow built for Indian consumers, store floor operators, and executive managers.
        </p>
      </header>

      {/* Main Split Apps Selection Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* APP 1: DEDICATED CUSTOMER APP */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 p-6 sm:p-7 flex flex-col justify-between hover:border-sky-500/60 transition-all hover:shadow-2xl hover:shadow-sky-500/10 group">
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-sky-400/10 text-sky-300 border border-sky-400/30">
                  Customer App
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white group-hover:text-sky-300 transition-colors">
                  Customer Portal & Booking
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Mobile-first web app designed for Indian consumers with quick OTP login, transparent ₹ rates, and live 7-step order tracking.
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Mobile OTP Signup & Name/Email onboarding</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Per-Kg (₹79/kg) & Per-Piece Rate Cards</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Morning & Evening Slots (7-10 AM, 4-7 PM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Indian Address GPS Auto-Detect & Pincode</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Instant UPI QR, GPay / PhonePe & COD</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>7-Stage Lifecycle & Photo Dispute filing</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800">
              <Link
                href="/customer"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 active:scale-98 transition-all"
              >
                <span>Launch Customer App</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* APP 2: STORE FLOOR APP (STAFF TABLET / PHONE) */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/60 transition-all hover:shadow-2xl hover:shadow-emerald-500/10 group">
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                  Floor Staff App
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                  Store Floor & Processing Terminal
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Optimized for store floor staff on Android tablets or phones. Counter intake, rider reconciliation, batch washing, and QC rework loop.
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>RBAC Operator Roles (Manager, Counter, Wash, Iron, QC, Rider)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Divided into Online Orders vs Walk-in Counter Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>14-Stage Online Pipeline (Order Receive ➔ Picked-up ➔ Stages 1-7 ➔ Delivered)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Walk-in Instant Intake (Starch, Fold style & Barcode tags)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Floor Processing Kanban (Received ➔ Wash ➔ QC ➔ Ready)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Day-End Cash & UPI Digital Drawer Close</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800 space-y-2">
              {isCheckedIn && staff ? (
                <>
                  <Link
                    href="/store"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
                  >
                    <span>Enter Active Floor Terminal ({staff.name.split(' ')[0]})</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={logoutStaff}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-500/30 text-[11px] font-bold text-center block transition-colors"
                  >
                    End Shift / Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/store/login"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
                  >
                    <span>Operator Login & Shift Check-In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="text-[11px] text-amber-400/90 text-center font-medium">
                    🔒 Direct access restricted • Must verify PIN to enter
                  </div>
                </>
              )}
            </div>
          </div>

          {/* APP 3: ADMIN & SRE HQ CONSOLE */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 p-6 sm:p-7 flex flex-col justify-between hover:border-purple-500/60 transition-all hover:shadow-2xl hover:shadow-purple-500/10 group">
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-purple-400/10 text-purple-300 border border-purple-400/30">
                  Admin & SRE Console
                </span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
                  HQ Admin & Operations Hub
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Enterprise control desk with RBAC security policies (Super Admin, Franchise Owner, Finance Auditor) for multi-store control and GST filing.
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Dedicated Admin RBAC Login & Permission Gates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Multi-Store Hubs & Pincode Geofencing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Versioned Price Matrix & Per-Kg Overrides</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Morning & Evening Slot Capacity Templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Customer Support Ticket & Dispute Queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>GST B2C/B2B Tax Register & CSV Export</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800 space-y-2">
              {isAdminLoggedIn && admin ? (
                <>
                  <Link
                    href="/admin"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 active:scale-98 transition-all"
                  >
                    <span>Enter HQ Admin Console ({admin.name.split(' ')[0]})</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={logoutAdmin}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-500/30 text-[11px] font-bold text-center block transition-colors"
                  >
                    Sign Out Administrator
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/admin/login"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 active:scale-98 transition-all"
                  >
                    <span>Administrator Credentials Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="text-[11px] text-amber-400/90 text-center font-medium">
                    🔒 Direct access restricted • Must authenticate to enter
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Live Network Stats Strip */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-slate-400 block mb-1">Active Hub Stores</span>
              <span className="font-mono text-xl font-bold text-white">{branches.length} Branches</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Live Indian Orders</span>
              <span className="font-mono text-xl font-bold text-sky-400">{orders.length} Orders</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Total Throughput</span>
              <span className="font-mono text-xl font-bold text-emerald-400">
                {orders.reduce((sum, o) => sum + o.totalQty, 0)} Pcs
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Verified Revenue</span>
              <span className="font-mono text-xl font-bold text-amber-400">
                {formatCurrency(orders.reduce((sum, o) => sum + o.grandTotal, 0), settings.currency)}
              </span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
