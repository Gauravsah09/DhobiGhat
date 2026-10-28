'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shirt, 
  MapPin, 
  Phone, 
  User, 
  CalendarPlus, 
  ArrowRight,
  LogOut
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import ThemeToggle from '@/components/ThemeToggle';

export function CustomerNavbar() {
  const pathname = usePathname();
  const { customerSession, settings, orders } = useLaundry();
  const { user, isLoggedIn, logout } = customerSession;

  // Count active orders for current user
  const userPhone10 = (user?.phone || '').replace(/\D/g, '').slice(-10);
  const activeOrdersCount = user
    ? orders.filter((o) => {
        if (!o || ['closed', 'cancelled'].includes(o.status)) return false;
        if (o.customerId && (o.customerId === user.id || o.customerId === `cust-${userPhone10}` || o.customerId === `guest-${userPhone10}`)) {
          return true;
        }
        const ordPhone10 = (o.customerPhone || '').replace(/\D/g, '').slice(-10);
        if (userPhone10.length === 10 && userPhone10 === ordPhone10) return true;
        if (user.email && o.customerEmail && user.email.toLowerCase() === o.customerEmail.toLowerCase()) return true;
        return false;
      }).length
    : 0;

  const navLinks = [
    { href: '/customer', label: 'Home' },
    { href: '/customer/book', label: 'Book Pickup', highlight: true },
    { href: '/customer/rates', label: 'Rate Card' },
    { href: '/customer/orders', label: 'My Orders', badge: activeOrdersCount },
    { href: '/customer/account', label: 'Account' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[var(--c-canvas-surface)]/95 backdrop-blur-md border-b border-[var(--c-border)] font-mono transition-colors duration-150">
      
      {/* Location & Status Top Strip */}
      <div className="bg-[var(--c-canvas-sunken)] text-[var(--c-ink-muted)] text-[11px] py-1.5 px-4 hidden sm:block border-b border-[var(--c-border)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[var(--c-ink)] font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Coverage: Bengaluru • Mumbai • Delhi NCR • Pune • Hyderabad</span>
            </span>
            <span className="text-[var(--c-border-strong)]">|</span>
            <span className="flex items-center gap-1.5 text-[var(--c-ink-faint)]">
              <Phone className="w-3 h-3 text-[var(--c-accent)]" />
              <span>Helpline: {settings.phone}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dispatch Active: Express 24-48h</span>
            </span>
            <span className="text-[var(--c-border-strong)]">|</span>
            <Link
              href="/"
              className="text-[var(--c-accent)] hover:underline flex items-center gap-1 transition-colors font-medium"
            >
              <span>Switch Hub</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/customer" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Shirt className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-[var(--c-ink)] tracking-tight">DhobiGhat</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  Concierge
                </span>
              </div>
              <p className="text-[10px] text-[var(--c-ink-faint)] hidden sm:block">Artisanal Garment Care & Laundry</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--c-canvas-sunken)] text-[var(--c-accent)] border border-[var(--c-border)] shadow-xs'
                      : link.highlight
                      ? 'bg-gradient-to-b from-[#35332e] to-[#1b1a17] text-white hover:ring-2 hover:ring-amber-500/50 shadow-sm'
                      : 'text-[var(--c-ink-muted)] hover:text-[var(--c-ink)] hover:bg-[var(--c-canvas-sunken)]'
                  }`}
                >
                  <span>{link.label}</span>
                  {Boolean(link.badge) && (
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: User Auth, ThemeToggle & Quick Book */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isLoggedIn && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/customer/account"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--c-canvas-sunken)] hover:border-[var(--c-border-strong)] border border-[var(--c-border)] text-[var(--c-ink)] text-xs font-medium transition-colors"
                >
                  <div className="w-5 h-5 rounded-md bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.firstName[0]}
                  </div>
                  <span className="hidden sm:inline">{user.firstName}</span>
                </Link>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-[var(--c-ink-faint)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/customer/auth"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--c-ink)] bg-[var(--c-canvas-sunken)] hover:bg-[var(--c-border)] border border-[var(--c-border)] transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            <Link
              href="/customer/book"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 shadow-sm active:scale-95 transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Book</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="md:hidden flex overflow-x-auto border-t border-[var(--c-border)] px-3 py-2 gap-1.5 scrollbar-none bg-[var(--c-canvas-sunken)]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[var(--c-canvas-surface)] text-[var(--c-accent)] shadow-xs border border-[var(--c-border)]'
                  : 'text-[var(--c-ink-muted)] hover:bg-[var(--c-canvas-surface)]'
              }`}
            >
              <span>{link.label}</span>
              {Boolean(link.badge) && (
                <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

    </header>
  );
}
