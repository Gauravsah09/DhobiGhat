'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shirt, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Truck, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  Percent, 
  Star,
  MapPin,
  ChevronRight,
  Zap,
  Tag
} from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/CustomerNavbar';
import { useLaundry } from '@/context/LaundryContext';
import { formatCurrency } from '@/lib/utils';

export default function CustomerHomePage() {
  const { perKgRates, clothTypes, priceMatrix, services, orders, customerSession, settings } = useLaundry();
  const { user, isLoggedIn } = customerSession;

  // Active orders for this customer
  const activeOrder = user
    ? orders.find(
        (o) =>
          (o.customerId === user.id || o.customerPhone === user.phone) &&
          !['closed', 'cancelled'].includes(o.status)
      )
    : null;

  return (
    <div className="min-h-screen bg-[var(--c-canvas)] text-[var(--c-ink)] flex flex-col font-mono transition-colors duration-150">
      <CustomerNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">

        {/* Live Active Order Alert Card (if user has an in-progress order) */}
        {activeOrder && (
          <div className="bg-gradient-to-r from-sky-900 to-indigo-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-sky-400/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
                <Shirt className="w-6 h-6 text-sky-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-sky-400 text-slate-950">
                    Live Order #{activeOrder.invoiceNo}
                  </span>
                  <span className="text-xs text-sky-200">
                    Status: <span className="font-bold text-white capitalize">{activeOrder.status.replace(/_/g, ' ')}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Expected Delivery: <span className="font-semibold text-white">{activeOrder.deliveryDate || 'Within 48 Hours'}</span> • {activeOrder.totalQty} Clothes
                </p>
              </div>
            </div>

            <Link
              href={`/customer/orders?inv=${activeOrder.invoiceNo}`}
              className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-sky-50 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span>Track Live Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-12 shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            
            {/* Offer pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <Percent className="w-3.5 h-3.5" />
              <span>Use Code FIRSTWASH for ₹100 OFF on your 1st Booking</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              India&apos;s Premium Doorstep <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-300">
                Laundry & Dry Cleaning
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Transparent per-kg and per-piece rates. Doorstep pickup in Morning & Evening slots with contactless digital UPI or Cash on Delivery.
            </p>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Fabric Mixing</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>24h Express Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Free Delivery above ₹299</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/customer/book"
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Pickup Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/customer/rates"
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 flex items-center justify-center gap-2 transition-all"
              >
                <Tag className="w-4 h-4" />
                <span>View Full Rate Card (₹)</span>
              </Link>
            </div>

          </div>
        </div>

        {/* Section 1: Per-Kg Weight Plans (Wash & Fold / Wash & Steam Iron) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Economical Everyday Wear</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Wash & Press by Kilo (Per Kg)
              </h2>
            </div>
            <Link href="/customer/book" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              <span>Book by Weight</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {perKgRates.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                      Min {pkg.minWeightKg} Kg
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{pkg.durationHours} hrs</span>
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-sky-700 transition-colors">
                    {pkg.serviceName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {pkg.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {formatCurrency(pkg.ratePerKg, settings.currency)}
                    </span>
                    <span className="text-slate-400 text-xs font-medium"> / kg</span>
                  </div>

                  <Link
                    href={`/customer/book?plan=${pkg.id}`}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Popular Indian Garments (Per Piece Dry Clean & Ironing) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Expert Fabric Care</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Ethnic & Delicate Care (Per Piece)
              </h2>
            </div>
            <Link href="/customer/rates" className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
              <span>Full Price Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Silk Saree", cat: "Ethnic", rate: "₹249", srv: "Dry Clean & Polish" },
              { name: "Kurta Pajama", cat: "Ethnic", rate: "₹119", srv: "Dry Cleaning" },
              { name: "Business Suit", cat: "Men", rate: "₹349", srv: "2-Pc Dry Clean" },
              { name: "Sherwani", cat: "Ethnic", rate: "₹499", srv: "Specialist Care" },
              { name: "Men Shirt", cat: "Men", rate: "₹25", srv: "Steam Press" },
              { name: "Heavy Blanket", cat: "Home", rate: "₹399", srv: "Sanitized Wash" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all text-center flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-1">
                    {item.cat}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.srv}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 font-black text-slate-900 font-mono text-sm text-sky-700">
                  {item.rate}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Morning & Evening Slots Feature Box */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-bold text-[10px] uppercase tracking-wider">
                Flexible Pickup Timing
              </span>
              <h3 className="text-xl font-extrabold text-amber-950">
                Scheduled Morning & Evening Windows
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Designed around your daily office routine. Book early morning before you leave or relaxed evening slots.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Morning Windows</span>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                <div className="p-2 rounded-lg bg-slate-50 font-medium flex justify-between">
                  <span>Slot 1: 07:00 AM – 10:00 AM</span>
                  <span className="text-emerald-600 font-bold">Available</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 font-medium flex justify-between">
                  <span>Slot 2: 10:00 AM – 01:00 PM</span>
                  <span className="text-emerald-600 font-bold">Available</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Evening Windows</span>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                <div className="p-2 rounded-lg bg-slate-50 font-medium flex justify-between">
                  <span>Slot 3: 04:00 PM – 07:00 PM</span>
                  <span className="text-emerald-600 font-bold">Available</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 font-medium flex justify-between">
                  <span>Slot 4: 07:00 PM – 10:00 PM</span>
                  <span className="text-emerald-600 font-bold">Available</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
