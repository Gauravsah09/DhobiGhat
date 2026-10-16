'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shirt, 
  MapPin, 
  Phone, 
  User, 
  ShoppingBag, 
  CalendarPlus, 
  Tag, 
  Clock, 
  ArrowRight,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';

export function CustomerNavbar() {
  const pathname = usePathname();
  const { customerSession, settings, orders } = useLaundry();
  const { user, isLoggedIn, logout } = customerSession;

  // Count active orders for current user
  const activeOrdersCount = user
    ? orders.filter(
        (o) =>
          (o.customerId === user.id || o.customerPhone === user.phone) &&
          !['closed', 'cancelled'].includes(o.status)
      ).length
    : 0;

  const navLinks = [
    { href: '/customer', label: 'Home' },
    { href: '/customer/book', label: 'Book Pickup', highlight: true },
    { href: '/customer/rates', label: 'Rate Card (₹/kg & pcs)' },
    { href: '/customer/orders', label: 'My Orders', badge: activeOrdersCount },
    { href: '/customer/account', label: 'Account' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      
      {/* Indian Location & Helpline Top Strip */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-200 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Serving: Bengaluru • Mumbai • Delhi NCR • Pune • Hyderabad</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Phone className="w-3 h-3 text-sky-400" />
              <span>Customer Helpline: {settings.phone}</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Slot Bookings Open: Morning & Evening
            </span>
            <span className="text-slate-500">|</span>
            <Link
              href="/"
              className="text-sky-300 hover:text-white flex items-center gap-1 transition-colors font-medium"
            >
              <span>Switch to Store Floor / Admin</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Indian Branding */}
          <Link href="/customer" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform">
              <Shirt className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-slate-900 tracking-tight">DhobiGhat</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  India
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Smart Laundry & Dry Clean Network</p>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-200/70'
                      : link.highlight
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white hover:opacity-95 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <span>{link.label}</span>
                  {Boolean(link.badge) && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: User Auth & Quick Book */}
          <div className="flex items-center gap-2.5">
            {isLoggedIn && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/customer/account"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center text-[10px]">
                    {user.firstName[0]}
                  </div>
                  <span className="hidden sm:inline">{user.firstName}</span>
                </Link>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/customer/auth"
                className="px-4 py-2 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 transition-all flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Login with OTP</span>
              </Link>
            )}

            <Link
              href="/customer/book"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-md shadow-sky-600/20 active:scale-95 transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Book Pickup</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-200/70 px-3 py-2 gap-1.5 scrollbar-none bg-slate-50/80">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-sky-700 shadow-xs border border-sky-200'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <span>{link.label}</span>
              {Boolean(link.badge) && (
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
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
