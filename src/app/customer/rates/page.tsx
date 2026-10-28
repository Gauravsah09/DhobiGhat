'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tag, Search, Sparkles, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/CustomerNavbar';
import { useLaundry } from '@/context/LaundryContext';
import { formatCurrency } from '@/lib/utils';

export default function CustomerRateCardPage() {
  const { perKgRates, clothTypes, services, priceMatrix, settings } = useLaundry();

  const [activeTab, setActiveTab] = useState<'per_kg' | 'per_piece'>('per_kg');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Men', 'Women', 'Ethnic', 'Household', 'Woollen'];

  const filteredMatrix = priceMatrix.filter((item) => {
    const cloth = clothTypes.find((c) => c.id === item.clothId);
    if (!cloth) return false;

    if (selectedCategory !== 'All' && cloth.category !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const serv = services.find((s) => s.id === item.serviceId);
      return cloth.name.toLowerCase().includes(q) || (serv && serv.name.toLowerCase().includes(q));
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--c-canvas)] text-[var(--c-ink)] flex flex-col font-mono transition-colors duration-150">
      <CustomerNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:px-6 space-y-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            Official Indian Rate Card
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Transparent Pricing Matrix (₹)
          </h1>
          <p className="text-slate-500 text-sm">
            Zero hidden charges. GST 18% clearly itemized. Guaranteed processing durations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="bg-slate-200/80 p-1 rounded-2xl flex text-xs font-extrabold shadow-inner">
            <button
              onClick={() => setActiveTab('per_kg')}
              className={`px-6 py-2.5 rounded-xl transition-all ${
                activeTab === 'per_kg'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              ⚖️ Per-Kg Weight Plans
            </button>
            <button
              onClick={() => setActiveTab('per_piece')}
              className={`px-6 py-2.5 rounded-xl transition-all ${
                activeTab === 'per_piece'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              👔 Per-Piece Garments (Dry Clean / Press)
            </button>
          </div>
        </div>

        {/* Tab 1: Per Kg Weight Rates */}
        {activeTab === 'per_kg' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {perKgRates.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                      Min {pkg.minWeightKg} Kg Order
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base">{pkg.serviceName}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{pkg.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Duration: {pkg.durationHours} Hours</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-black text-slate-900 font-mono">
                        {formatCurrency(pkg.ratePerKg, settings.currency)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium"> / kg</span>
                    </div>

                    <Link
                      href={`/customer/book?plan=${pkg.id}`}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Clothes are weighed digitally at your doorstep by our rider. No rounding up surprises.
              </span>
            </div>
          </div>
        ) : (
          /* Tab 2: Per Piece Rates with Categories */
          <div className="space-y-6">
            {/* Category Pills & Search */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Saree, Kurta, Suit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatrix.map((item) => {
                const cloth = clothTypes.find((c) => c.id === item.clothId);
                const serv = services.find((s) => s.id === item.serviceId);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                          {cloth?.code} • {cloth?.category}
                        </span>
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                          {serv?.name}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base">{cloth?.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Duration: {serv?.durationHours} hrs • High-pressure finishing
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          {formatCurrency(item.price, settings.currency)}
                        </span>
                        <span className="text-xs text-slate-400"> / pc</span>
                      </div>

                      <Link
                        href="/customer/book"
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs"
                      >
                        Add to Order
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
