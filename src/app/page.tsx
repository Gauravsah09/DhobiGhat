'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Shirt, 
  Store, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Truck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { EditorialButton, EditorialCard } from '@/components/editorial/Primitives';

export default function MainPage() {
  return (
    <div className="min-h-screen bg-[var(--c-canvas)] text-[var(--c-ink)] flex flex-col justify-between font-mono selection:bg-amber-500 selection:text-white transition-colors duration-150">
      
      {/* Top Technical Header */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-6 pt-8 flex items-center justify-between border-b border-[var(--c-border)] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
            <Shirt className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-[var(--c-ink)] block leading-tight">
              DHOBIGHAT // OS
            </span>
            <span className="text-[10px] font-medium tracking-wider text-[var(--c-ink-faint)] uppercase">
              Precision Garment Processing & Logistics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2 text-xs text-[var(--c-ink-muted)] bg-[var(--c-canvas-sunken)] px-3 py-1.5 rounded-full border border-[var(--c-border)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>HUBS ONLINE: 100% DISPATCH</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Hero & Portals */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col items-center text-center space-y-10">
        
        {/* Kicker Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--c-canvas-sunken)] border border-[var(--c-border)] text-[var(--c-accent)] text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>[ SYSTEM STATUS: ALL LAUNDRY HUBS OPERATIONAL ]</span>
        </div>

        {/* Hero Title & Mission */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--c-ink)] leading-[1.15]">
            DhobiGhat — Precision Garment Care OS
          </h1>
          <p className="max-w-2xl mx-auto text-[var(--c-ink-muted)] text-sm sm:text-base leading-relaxed font-normal">
            Industrial fabric processing, walk-in counter point-of-sale, and doorstep logistics dispatch engineered for modern laundry and dry cleaning operations.
          </p>
        </div>

        {/* Three Operational Gateway Portals */}
        <div className="w-full space-y-4 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--c-ink-faint)] text-left max-w-4xl mx-auto">
            SELECT ACCESS WORKSPACE
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            
            {/* Customer Portal */}
            <EditorialCard className="p-6 text-left flex flex-col justify-between hover:border-[var(--c-accent)] transition-colors group">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Shirt className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--c-ink)]">
                    Customer Lounge
                  </h2>
                  <p className="text-xs text-[var(--c-ink-muted)] mt-1 leading-relaxed">
                    Doorstep laundry booking, live stage tracking, digital payment & itemized rates.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/customer" id="customer-portal-link" className="w-full block">
                  <EditorialButton variant="primary" size="sm" className="w-full justify-between group-hover:ring-2 group-hover:ring-amber-500/50">
                    <span>Enter Customer Portal</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </EditorialButton>
                </Link>
              </div>
            </EditorialCard>

            {/* Store Counter POS */}
            <EditorialCard className="p-6 text-left flex flex-col justify-between hover:border-[var(--c-accent)] transition-colors group">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center">
                  <Store className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--c-ink)]">
                    Store Counter POS
                  </h2>
                  <p className="text-xs text-[var(--c-ink-muted)] mt-1 leading-relaxed">
                    Walk-in order intake, rapid piece counting, UPI QR collection, and instant thermal receipt printing.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/store" id="store-portal-link" className="w-full block">
                  <EditorialButton variant="primary" size="sm" className="w-full justify-between group-hover:ring-2 group-hover:ring-amber-500/50">
                    <span>Open Store Register</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </EditorialButton>
                </Link>
              </div>
            </EditorialCard>

            {/* Admin HQ */}
            <EditorialCard className="p-6 text-left flex flex-col justify-between hover:border-[var(--c-accent)] transition-colors group">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--c-ink)]">
                    Operations HQ
                  </h2>
                  <p className="text-xs text-[var(--c-ink-muted)] mt-1 leading-relaxed">
                    Factory pipeline telemetry, driver dispatch queues, shift cash reconciliation & audit logging.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/admin" id="admin-portal-link" className="w-full block">
                  <EditorialButton variant="primary" size="sm" className="w-full justify-between group-hover:ring-2 group-hover:ring-amber-500/50">
                    <span>Launch Admin Console</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </EditorialButton>
                </Link>
              </div>
            </EditorialCard>

          </div>
        </div>

        {/* Operational Quality Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full pt-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-canvas-sunken)] border border-[var(--c-border)] text-left">
            <Clock className="w-4 h-4 text-[var(--c-accent)] shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-[var(--c-ink)]">24-48h Express</div>
              <div className="text-[var(--c-ink-faint)]">Standard Turnaround</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-canvas-sunken)] border border-[var(--c-border)] text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-[var(--c-ink)]">Organic Solvents</div>
              <div className="text-[var(--c-ink-faint)]">Eco-Safe Garment Care</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-canvas-sunken)] border border-[var(--c-border)] text-left">
            <Truck className="w-4 h-4 text-sky-500 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-[var(--c-ink)]">Doorstep Logistics</div>
              <div className="text-[var(--c-ink-faint)]">PIN-Verified Delivery</div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-6 py-6 border-t border-[var(--c-border)] text-xs text-[var(--c-ink-faint)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>© 2026 DhobiGhat Precision Garment Care OS. Built for operations.</div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Industrial Pipeline</span>
          <span>//</span>
          <span>Thermal POS Ready</span>
          <span>//</span>
          <span>Zero-FOUC Dual Theme</span>
        </div>
      </footer>

    </div>
  );
}
