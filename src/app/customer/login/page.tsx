'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Shirt, 
  Lock, 
  Phone, 
  User, 
  Mail,
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/CustomerNavbar';
import { useLaundry } from '@/context/LaundryContext';

function CustomerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/customer/orders';

  const { customerSession } = useLaundry();
  const { user, isLoggedIn, logout } = customerSession;

  // Active Tab: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sign In handler
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your registered mobile number or email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = customerSession.loginWithPassword(identifier.trim(), password);
      if (res.success) {
        setSuccessMsg(res.message || 'Signed in successfully! Redirecting...');
        setTimeout(() => {
          router.push(redirectParam);
        }, 600);
      } else {
        setErrorMsg(res.message || 'Invalid login credentials. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up handler
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName.trim()) {
      setErrorMsg('Please enter your first name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your 10-digit mobile number.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address for invoice and pickup updates.');
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = customerSession.signupCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        password: signupPassword,
      });

      if (res.success) {
        setSuccessMsg('Account created successfully! Welcome to DhobiGhat. Redirecting to your orders...');
        setTimeout(() => {
          router.push('/customer/orders');
        }, 700);
      } else {
        setErrorMsg(res.message || 'Unable to create account. Mobile number or email may already be registered.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-slate-50 to-white flex flex-col justify-between">
      <CustomerNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-full max-w-md">

          {/* Top Return link */}
          <div className="mb-6 flex items-center justify-between text-xs font-semibold text-slate-500">
            <Link 
              href="/customer" 
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-sky-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Customer Home</span>
            </Link>

            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <span>Store Floor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Already logged in banner */}
          {isLoggedIn && user ? (
            <div className="bg-white rounded-3xl p-8 border border-sky-100 shadow-xl shadow-sky-900/5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1">
                Welcome back, {user.firstName}!
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                You are currently signed in with mobile <span className="font-semibold text-slate-700">+91 {user.phone}</span>
              </p>

              <div className="space-y-3">
                <Link
                  href="/customer/orders"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-600/20 transition-all"
                >
                  <span>Go to My Orders & Invoices</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of this account</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 overflow-hidden">
              
              {/* Header Banner */}
              <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
                    <Shirt className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                      <span>DhobiGhat</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Portal
                      </span>
                    </h1>
                    <p className="text-xs text-slate-300">Smart Laundry & Dry Clean Customer Access</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mt-6 grid grid-cols-2 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      activeTab === 'signin'
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signup');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      activeTab === 'signup'
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <div className="p-8">
                {/* Error feedback */}
                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Success feedback */}
                {successMsg && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {activeTab === 'signin' ? (
                  /* Sign In Form */
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mobile Number or Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="9876543210 or user@example.com"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Password
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Default: customer123
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-11 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-md shadow-sky-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <User className="w-4 h-4" />
                      <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                    </button>

                    <div className="pt-2 text-center">
                      <p className="text-[11px] text-slate-500">
                        New to DhobiGhat?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('signup');
                            setErrorMsg('');
                            setSuccessMsg('');
                          }}
                          className="font-bold text-sky-600 hover:underline"
                        >
                          Sign Up for an account
                        </button>
                      </p>
                    </div>
                  </form>
                ) : (
                  /* Sign Up Form */
                  <form onSubmit={handleSignUp} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          First Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Aarav"
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Sharma"
                          className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Indian Mobile Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="9876543210 (10 digits)"
                          maxLength={10}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="aarav@example.com"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Create strong password"
                          className="w-full pl-9 pr-10 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-[11px] text-amber-800 font-medium">
                        Bonus: Get <strong>₹100 Wallet Credit</strong> instantly credited upon signing up!
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-md shadow-sky-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isLoading ? 'Creating Account...' : 'Sign Up'}</span>
                    </button>

                    <div className="pt-1 text-center">
                      <p className="text-[11px] text-slate-500">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('signin');
                            setErrorMsg('');
                            setSuccessMsg('');
                          }}
                          className="font-bold text-sky-600 hover:underline"
                        >
                          Sign In
                        </button>
                      </p>
                    </div>
                  </form>
                )}
              </div>

              {/* Indian Trust Footer */}
              <div className="px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>256-Bit SSL Secured</span>
                </span>
                <span>GST Compliant Billing</span>
              </div>

            </div>
          )}

          {/* Quick Demo Credentials Footer */}
          <div className="mt-6 text-center text-xs text-slate-400">
            <p>
              Looking for Store Operator access?{' '}
              <Link href="/" className="font-semibold text-sky-600 hover:underline">
                Open Store Terminal
              </Link>
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} DhobiGhat India. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/customer/rates" className="hover:text-slate-700">Rate Card</Link>
            <span>•</span>
            <Link href="/customer/book" className="hover:text-slate-700">Book Pickup</Link>
            <span>•</span>
            <Link href="/" className="hover:text-slate-700">Store Floor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    }>
      <CustomerLoginContent />
    </Suspense>
  );
}
