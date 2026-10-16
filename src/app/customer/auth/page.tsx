'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, 
  KeyRound, 
  User, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  LogOut,
  Shirt
} from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/CustomerNavbar';
import { useLaundry } from '@/context/LaundryContext';

function CustomerAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/customer';

  const { customerSession } = useLaundry();
  const { user, isLoggedIn, loginWithOtp, logout, updateProfile } = customerSession;

  // Form states
  const [phone, setPhone] = useState('9876543210');
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');

  // Profile onboarding state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setErrorMsg('');
    setStep('otp');
    setCountdown(30);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setErrorMsg('Please enter the 4-digit verification code.');
      return;
    }

    const success = loginWithOtp(phone, otp);
    if (success) {
      // Check if user has real name
      if (user && user.firstName !== 'Valued') {
        router.push(redirectUrl);
      } else {
        setStep('profile');
      }
    } else {
      setErrorMsg('Invalid OTP. Please try again.');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorMsg('Name is required.');
      return;
    }
    updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim() || '-',
      email: email.trim() || `${phone}@customer.dhobighat.in`,
    });
    router.push(redirectUrl);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex flex-col justify-center">

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-6">

          {/* Branded Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-500/25">
              <Shirt className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLoggedIn ? 'Your DhobiGhat Account' : 'Login / Create Account'}
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {isLoggedIn
                ? `Logged in as +91 ${user?.phone}`
                : 'Enter your 10-digit mobile number for instant OTP verification.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Already logged in view */}
          {isLoggedIn && user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400">Customer Name</span>
                  <span className="font-bold text-slate-900">{user.firstName} {user.lastName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400">Mobile Number</span>
                  <span className="font-mono font-bold text-slate-900">+91 {user.phone}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-400">Email Address</span>
                  <span className="text-slate-700">{user.email}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Wallet Cashback</span>
                  <span className="font-black text-emerald-600 text-sm">₹{user.walletBalance}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Link
                  href="/customer/book"
                  className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs text-center shadow-md shadow-sky-600/20"
                >
                  Book New Pickup
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="px-5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-200/60"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : step === 'phone' ? (
            /* Step 1: Mobile Phone Input */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500 text-sm font-semibold border-r border-slate-200 pr-2">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-20 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-sky-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Get OTP Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                Demo Quick Fill:{" "}
                <button
                  type="button"
                  onClick={() => setPhone('9876543210')}
                  className="font-mono text-sky-600 hover:underline font-bold"
                >
                  9876543210 (Arun Rao)
                </button>
              </div>
            </form>
          ) : step === 'otp' ? (
            /* Step 2: 4-digit OTP Input */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Enter 4-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-xs text-sky-600 hover:underline"
                  >
                    Change +91 {phone}
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="Enter 4-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-base font-mono font-black tracking-widest text-center focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-inner"
                  />
                </div>
              </div>

              {/* Demo 1-Click Auto Fill */}
              <button
                type="button"
                onClick={() => setOtp('1234')}
                className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200/80 transition-colors"
              >
                ⚡ 1-Click Auto-Fill Demo OTP (1234)
              </button>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Verify & Login</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                <span>Didn&apos;t receive code?</span>
                {countdown > 0 ? (
                  <span>Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCountdown(30)}
                    className="text-sky-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* Step 3: Name & Email Profile Onboarding */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-3 bg-sky-50 rounded-2xl text-xs text-sky-800 border border-sky-100">
                <span className="font-bold">Almost there!</span> Tell us your name so we can address your laundry bags and invoice correctly.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  First Name (Required) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address (for GST Invoices)
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul.sharma@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md active:scale-98 transition-all"
              >
                Save & Continue
              </button>
            </form>
          )}

          {/* Privacy Guarantee */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 border-t border-slate-100 pt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure 256-bit encrypted Indian telecom OTP</span>
          </div>

        </div>

      </main>
    </div>
  );
}

export default function CustomerAuthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Login...</div>}>
      <CustomerAuthContent />
    </Suspense>
  );
}
