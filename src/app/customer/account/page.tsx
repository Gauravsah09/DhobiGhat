'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  MapPin, 
  Plus, 
  Phone, 
  Mail, 
  CreditCard, 
  LogOut, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2,
  Building,
  CheckCircle2,
  ShoppingBag
} from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/CustomerNavbar';
import { useLaundry } from '@/context/LaundryContext';
import { IndianAddress } from '@/types';

export default function CustomerAccountPage() {
  const { customerSession, orders, settings } = useLaundry();
  const { user, isLoggedIn, logout, updateProfile, addAddress, setDefaultAddress } = customerSession;

  // Edit profile states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fName, setFName] = useState(user?.firstName || '');
  const [lName, setLName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');

  // Add Address states
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [flatNo, setFlatNo] = useState('');
  const [society, setSociety] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <CustomerNavbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Please Sign In</h2>
          <p className="text-xs text-slate-500">
            Sign in with your 10-digit mobile number to view saved Indian addresses, wallet balance, and order history.
          </p>
          <Link
            href="/customer/auth"
            className="inline-block px-6 py-3 rounded-2xl bg-sky-600 text-white font-bold text-xs shadow-md"
          >
            Login with Mobile OTP
          </Link>
        </main>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ firstName: fName, lastName: lName, email });
    setIsEditingProfile(false);
  };

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNo || !society || !street || !pincode) {
      alert('Please fill out all required address fields.');
      return;
    }
    addAddress({
      label: addrLabel,
      flatNo,
      society,
      street,
      landmark,
      city,
      state,
      pincode,
      isDefault: false,
    });
    setShowAddAddress(false);
    setFlatNo('');
    setSociety('');
    setStreet('');
    setPincode('');
  };

  // Disputes raised by this user
  const userDisputes = orders
    .filter((o) => (o.customerId === user.id || o.customerPhone === user.phone) && o.dispute)
    .map((o) => o.dispute!);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 space-y-8">

        {/* Account Top Summary */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-sky-600/25">
              {user.firstName[0]}
              {user.lastName[0] || ''}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {user.firstName} {user.lastName}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Verified Customer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                +91 {user.phone} • {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFName(user.firstName);
                setLName(user.lastName);
                setEmail(user.email);
                setIsEditingProfile(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Edit Profile Form Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Edit Customer Details</h3>
              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lName}
                    onChange={(e) => setLName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Section 1: Saved Indian Addresses */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Saved Indian Addresses</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage your home, apartment, and office locations</p>
            </div>

            <button
              onClick={() => setShowAddAddress(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.addresses.map((addr) => {
              const isDef = user.defaultAddressId === addr.id || addr.isDefault;
              return (
                <div
                  key={addr.id}
                  className={`p-4 rounded-2xl border text-xs space-y-2 relative transition-all ${
                    isDef ? 'bg-sky-50/60 border-sky-300 ring-1 ring-sky-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-sky-600" />
                      <span>{addr.label}</span>
                    </span>
                    {isDef ? (
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="text-[10px] font-semibold text-slate-500 hover:text-sky-600 underline"
                      >
                        Set Default
                      </button>
                    )}
                  </div>

                  <p className="text-slate-700 leading-relaxed">
                    <span className="font-bold">{addr.flatNo}</span>, {addr.society}, {addr.street}
                    {addr.landmark && <span> (Near {addr.landmark})</span>}
                  </p>
                  <p className="text-slate-500 font-mono font-medium">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Address Modal */}
        {showAddAddress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2">Add New Indian Delivery Address</h3>
              <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Address Label</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Home', 'Work', 'Other'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setAddrLabel(l)}
                        className={`p-2 rounded-xl border text-xs font-bold ${
                          addrLabel === l ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Flat / Door No. *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 501, 5th Floor"
                      value={flatNo}
                      onChange={(e) => setFlatNo(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Society / Colony *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sobha Iris"
                      value={society}
                      onChange={(e) => setSociety(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Street / Area *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Outer Ring Road, Bellandur"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Landmark</label>
                    <input
                      type="text"
                      placeholder="e.g. Near Shell Pump"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pincode (6-Digit) *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="560103"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white font-bold"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Section 2: Wallet & Past Disputes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Wallet Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                DhobiGhat Wallet Balance
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-medium block">Available Cashback Balance</span>
                <span className="font-mono text-3xl font-black text-emerald-950">₹{user.walletBalance}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-1 rounded-md">
                Auto-Applied on Checkout
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cashback earned from coupon codes and referral rewards can be used towards your next order.
            </p>
          </div>

          {/* Active Disputes History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">
                Support Tickets & Disputes ({userDisputes.length})
              </h3>
            </div>

            {userDisputes.length > 0 ? (
              <div className="space-y-2 text-xs">
                {userDisputes.map((disp) => (
                  <div key={disp.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 font-mono">Order #{disp.invoiceNo}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        {disp.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-slate-600">{disp.description}</p>
                    {disp.resolutionNotes && (
                      <p className="text-[11px] text-emerald-700 bg-emerald-50 p-1.5 rounded-md mt-1">
                        Resolution: {disp.resolutionNotes} (Refund: ₹{disp.refundAmount})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl">
                No active dispute tickets. All orders delivered satisfactorily.
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
