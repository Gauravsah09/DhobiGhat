'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Phone, 
  Lock, 
  User, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Shirt,
  Eye,
  EyeOff,
  ShoppingBag,
  Sparkles,
  Check
} from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/CustomerNavbar';
import { useLaundry } from '@/context/LaundryContext';
import { hasSqlInjection, sanitizePhoneNumber } from '@/lib/security';

function CustomerAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/customer';

  const { customerSession } = useLaundry();
  const { user, isLoggedIn, loginWithPassword, signupCustomer, logout } = customerSession;

  // Active tab: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Login Form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup Form state
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Alert & loading states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your registered mobile number or email.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    // SQL Injection check
    if (hasSqlInjection(loginIdentifier) || hasSqlInjection(loginPassword)) {
      setErrorMsg('Invalid characters detected (SQL Injection protection).');
      return;
    }

    setIsLoading(true);
    try {
      const res = loginWithPassword(loginIdentifier, loginPassword);
      if (res.success) {
        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => {
          router.push(redirectUrl);
        }, 600);
      } else {
        setErrorMsg(res.message || 'Invalid mobile number/email or password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Signup submission
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!signupFirstName.trim()) {
      setErrorMsg('First name is required.');
      return;
    }

    const cleanPhone = signupPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address for your GST invoices.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service to create your account.');
      return;
    }

    // SQL injection checks
    if (
      hasSqlInjection(signupFirstName) ||
      hasSqlInjection(signupLastName) ||
      hasSqlInjection(signupPhone) ||
      hasSqlInjection(signupEmail) ||
      hasSqlInjection(signupPassword)
    ) {
      setErrorMsg('Invalid characters detected (SQL Injection protection).');
      return;
    }

    setIsLoading(true);
    try {
      const res = signupCustomer({
        firstName: signupFirstName.trim(),
        lastName: signupLastName.trim() || '-',
        phone: cleanPhone,
        email: signupEmail.trim(),
        password: signupPassword,
      });

      if (res.success) {
        setSuccessMsg('Account created successfully with ₹100 Welcome Credit! Redirecting...');
        setTimeout(() => {
          router.push(redirectUrl);
        }, 800);
      } else {
        setErrorMsg(res.message || 'Could not create account. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
              {isLoggedIn ? 'Your DhobiGhat Account' : 'Customer Account Access'}
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {isLoggedIn
                ? `Logged in as +91 ${user?.phone}`
                : 'Sign in to your account or create a new profile with password security.'}
            </p>
          </div>

          {/* Error & Success Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* Already logged in view */}
          {isLoggedIn && user ? (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                  <span className="text-slate-500 font-medium">Customer Name</span>
                  <span className="font-bold text-slate-900 text-sm">{user.firstName} {user.lastName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                  <span className="text-slate-500 font-medium">Registered Mobile</span>
                  <span className="font-mono font-bold text-slate-900">+91 {user.phone}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                  <span className="text-slate-500 font-medium">Email for Invoices</span>
                  <span className="text-slate-800 font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-medium">Wallet Cashback Balance</span>
                  <span className="font-black text-emerald-600 text-base">₹{user.walletBalance || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/customer/orders"
                  className="py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs text-center shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>View My Orders</span>
                </Link>
                <Link
                  href="/customer/book"
                  className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Book Pickup</span>
                </Link>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out & Clear All Session Data</span>
              </button>
            </div>
          ) : (
            /* Tabs: Sign In vs Create Account */
            <div className="space-y-5">
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg('');
                  }}
                  className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setErrorMsg('');
                  }}
                  className={`py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'signup'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {activeTab === 'login' ? (
                /* TAB 1: Password Login */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Mobile Number or Email *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9876543210 or yourname@mail.com"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-sm shadow-md shadow-sky-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <span>{isLoading ? 'Signing In...' : 'Sign In with Password'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1 text-xs text-slate-500">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signup')}
                      className="font-bold text-sky-600 hover:underline"
                    >
                      Create one now
                    </button>
                  </div>
                </form>
              ) : (
                /* TAB 2: Signup / Account Creation */
                <form onSubmit={handleSignupSubmit} className="space-y-4 text-xs">
                  <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl text-sky-900 font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Get ₹100 Welcome Laundry Credit automatically upon signup!</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kumar"
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                      10-Digit Mobile Number *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500 text-xs font-bold border-r border-slate-200 pr-2">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="98765 43210"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-18 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                      Email Address (for Invoices & Updates) *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. ramesh@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                        Password (min 6 chars) *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Confirm"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      I agree to the DhobiGhat Enterprise Terms of Service and Privacy Policy.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <span>{isLoading ? 'Creating Account...' : 'Create Account & Claim ₹100'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1 text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="font-bold text-sky-600 hover:underline"
                    >
                      Sign in here
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Privacy Guarantee */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 border-t border-slate-100 pt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure 256-bit encrypted authentication • SQL injection protected</span>
          </div>

        </div>

      </main>
    </div>
  );
}

export default function CustomerAuthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Account Access...</div>}>
      <CustomerAuthContent />
    </Suspense>
  );
}
