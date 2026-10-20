'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, 
  Building, 
  Tag, 
  Clock, 
  ShoppingBag, 
  Users, 
  ShieldCheck, 
  Receipt, 
  TrendingUp, 
  MessageSquare, 
  Sliders, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  MapPin, 
  Percent, 
  Phone, 
  ArrowRight,
  FileSpreadsheet,
  UserPlus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  Check,
  X,
  Archive,
  RotateCcw,
  Sparkles,
  CreditCard,
  QrCode,
  Banknote,
  Camera,
  ExternalLink
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { Order, OrderStatus, StoreStaff, StoreOperatorRole, PaymentMethod, CustomerUser, IndianAddress } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function AdminConsoleApp() {
  const router = useRouter();
  const { 
    adminSession,
    orders, 
    branches, 
    customers, 
    addCustomer,
    updateCustomer,
    deleteCustomer,
    deleteOrder,
    staffList,
    addStaff,
    updateStaff,
    deleteStaff,
    clothTypes, 
    services, 
    priceMatrix, 
    perKgRates, 
    dltTemplates, 
    updateOrderStatus,
    resolveDispute,
    adminSettleAndCloseOrder,
    archiveOrder,
    unarchiveOrder,
    archiveAllDeliveredOrders,
    settings, 
    updateSettings 
  } = useLaundry();

  const { admin, isAdminLoggedIn, logoutAdmin } = adminSession;

  // Strict Redirect Guard: If not logged in as admin, immediately redirect to /admin/login
  useEffect(() => {
    if (!isAdminLoggedIn || !admin) {
      router.replace('/admin/login');
    }
  }, [isAdminLoggedIn, admin, router]);

  type AdminTab = 
    | 'dashboard' 
    | 'stores_zones' 
    | 'staff_users'
    | 'catalogue_pricing' 
    | 'slots_capacity' 
    | 'orders' 
    | 'customers' 
    | 'support' 
    | 'finance' 
    | 'reports' 
    | 'marketing';

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Staff User Management filters & modal states
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('all');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Add staff form inputs
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StoreOperatorRole>('store_operator');
  const [newStaffStoreId, setNewStaffStoreId] = useState(branches[0]?.id || 'branch-blr-1');
  const [newStaffShift, setNewStaffShift] = useState<'morning' | 'evening' | 'night'>('morning');
  const [newStaffPin, setNewStaffPin] = useState('1234');

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPhone.trim() || !newStaffPin.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    const cleanPhone = newStaffPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Please provide a valid 10-digit mobile phone number.');
      return;
    }
    const targetBranch = branches.find((b) => b.id === newStaffStoreId) || branches[0];
    addStaff({
      name: newStaffName.trim(),
      phone: cleanPhone,
      pin: newStaffPin.trim(),
      role: newStaffRole,
      storeId: targetBranch.id,
      storeName: targetBranch.name,
      activeShift: newStaffShift,
      status: 'active',
    });

    setShowAddStaffModal(false);
    setNewStaffName('');
    setNewStaffPhone('');
    setNewStaffPin('1234');
    alert(`User "${newStaffName.trim()}" created successfully with role ${newStaffRole.replace('_', ' ')}! Shift PIN: ${newStaffPin}`);
  };

  // Order filters and settlement modal
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'active' | 'delivered' | 'closed' | 'payment_pending' | 'archived' | 'manual_settlement'>('all');
  const [settleModalOrder, setSettleModalOrder] = useState<Order | null>(null);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('cod_cash');
  const [settleRef, setSettleRef] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleReason, setSettleReason] = useState<string>('Manual Admin Settlement');
  const [settleSuccessMsg, setSettleSuccessMsg] = useState('');

  // Task 1: Customer Accounts Management (Admin CRM)
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'all' | 'enable' | 'disable'>('all');
  const [editingCustomer, setEditingCustomer] = useState<CustomerUser | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWalletBalance, setEditWalletBalance] = useState('');
  const [editStatus, setEditStatus] = useState<'enable' | 'disable'>('enable');
  const [editFlatNo, setEditFlatNo] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerUser | null>(null);

  // Add Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustFirstName, setNewCustFirstName] = useState('');
  const [newCustLastName, setNewCustLastName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustWallet, setNewCustWallet] = useState('100');
  const [newCustFlatNo, setNewCustFlatNo] = useState('');
  const [newCustStreet, setNewCustStreet] = useState('');
  const [newCustCity, setNewCustCity] = useState('Bengaluru');
  const [newCustPincode, setNewCustPincode] = useState('560038');

  // Task 2: Order Deletion modal
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [deleteOrderReason, setDeleteOrderReason] = useState('Stuck order / cancelled test');

  // Task 3: Order Channel filter
  const [orderChannelFilter, setOrderChannelFilter] = useState<'all' | 'online' | 'walk_in'>('all');

  // Task 4: Rider photo evidence modal
  const [previewEvidencePhoto, setPreviewEvidencePhoto] = useState<{ url: string; invoiceNo: string; customerName: string } | null>(null);

  // Total metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalKg = orders.reduce((sum, o) => sum + (o.recordedWeightKg || 0), 0);
  const pendingIntake = orders.filter((o) => o.status === 'booked' || o.status === 'order_received').length;
  const inProcessing = orders.filter((o) => ['processing', 'washing', 'drying', 'ironing', 'qc_check', 'sorting', 'received'].includes(o.status)).length;
  const outDelivery = orders.filter((o) => o.status === 'out_for_delivery').length;
  const activeDisputes = orders.filter((o) => o.status === 'disputed' || o.dispute).length;

  // Unauthenticated Guard
  if (!isAdminLoggedIn || !admin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-5 rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-400/20">
              Admin Authentication Required
            </span>
            <h2 className="text-xl font-black text-white mt-2">Administrator Access Required</h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              This executive console is protected by RBAC policy. Direct access is restricted. Redirecting to admin login screen...
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/admin/login"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 transition-all text-center block"
            >
              Go to Admin Login Screen ➔
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors text-center block"
            >
              Back to Master Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Admin Executive Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-sky-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm tracking-tight text-white">DhobiGhat Admin HQ</h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  GSTIN: {settings.gstin}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Multi-Store Executive & SRE Console</p>
            </div>
          </div>

          {/* RBAC Operator Profile & Quick Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Active Admin Profile */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-[10px]">
                {admin.name[0]}
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-[11px] leading-none">{admin.name.split(' ')[0]}</div>
                <div className="text-[9px] font-extrabold uppercase text-sky-400 mt-0.5 tracking-wider">
                  {admin.role.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}

            <button
              type="button"
              onClick={logoutAdmin}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
            >
              Sign Out
            </button>

            <Link
              href="/admin/ledger"
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Revenue Ledger</span>
            </Link>

            <Link
              href="/admin/archive"
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Order Archive</span>
            </Link>

            <Link
              href="/store"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition-colors"
            >
              Store Floor ➔
            </Link>
          </div>

        </div>
      </header>

      {/* Admin Nav Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2 overflow-x-auto flex gap-1.5 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'stores_zones', label: 'Stores & Pincodes', icon: Building },
          { id: 'staff_users', label: 'Staff & Roles (RBAC)', icon: ShieldCheck, badge: staffList.length },
          { id: 'catalogue_pricing', label: 'Pricing & Per-Kg', icon: Tag },
          { id: 'slots_capacity', label: 'Slots & Capacity', icon: Clock },
          { id: 'orders', label: 'Orders Desk', icon: ShoppingBag },
          { id: 'customers', label: 'Customers CRM', icon: Users },
          { id: 'support', label: 'Disputes & Support', icon: AlertTriangle, badge: activeDisputes },
          { id: 'finance', label: 'Finance & GST', icon: Receipt },
          { id: 'reports', label: 'Reports & TAT', icon: TrendingUp },
          { id: 'marketing', label: 'DLT SMS & Coupons', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* TAB 1: EXECUTIVE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">Total Revenue (₹)</span>
                <div className="text-2xl font-black text-white font-mono">
                  {formatCurrency(totalRevenue, settings.currency)}
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">● Live Today</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">Pending Intakes</span>
                <div className="text-2xl font-black text-amber-400 font-mono">{pendingIntake}</div>
                <span className="text-[10px] text-slate-500">Pickups held for slot</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">In Factory Wash/QC</span>
                <div className="text-2xl font-black text-sky-400 font-mono">{inProcessing}</div>
                <span className="text-[10px] text-slate-500">Active machines running</span>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">Out for Delivery</span>
                <div className="text-2xl font-black text-purple-400 font-mono">{outDelivery}</div>
                <span className="text-[10px] text-slate-500">With rider PIN handover</span>
              </div>
            </div>

            {/* Store Load & Turnaround Time Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="font-extrabold text-sm uppercase text-slate-300">Throughput & Load Per Store</h3>
                <div className="space-y-3 text-xs">
                  {branches.map((b) => (
                    <div key={b.id} className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">{b.name}</span>
                        <span className="text-sky-400 font-mono">Cap: {b.dailyCapacityKg} Kg/day</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-sky-500 h-2 rounded-full w-2/3" />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Pincodes: {b.servicePincodes.join(', ')}</span>
                        <span>{b.activeWashers} Washers • {b.activeDryers} Dryers</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="font-extrabold text-sm uppercase text-slate-300">Turnaround-Time (TAT) SLA Health</h3>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 text-emerald-300">
                  <div className="font-bold">✓ 98.4% On-Time Delivery Performance</div>
                  <p className="text-slate-400 text-[11px]">Average turnaround: 28.4 hours against 48-hour customer promise.</p>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="text-slate-400 font-bold block uppercase">Recent Critical Milestones</span>
                  {orders.slice(0, 3).map((o) => (
                    <div key={o.id} className="p-2.5 bg-slate-800/40 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white font-mono">#{o.invoiceNo}</span>
                        <span className="text-slate-400 text-[11px] ml-2">{o.customerName}</span>
                      </div>
                      <span className="text-[10px] font-bold text-sky-400 uppercase">{o.status}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: STORES & SERVICE PINCODES */}
        {activeTab === 'stores_zones' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-white">Hub Stores & Indian Pincode Geofencing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {branches.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-sm">{b.name}</h4>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="text-slate-400">{b.address}, {b.city}</p>
                  <div>
                    <span className="text-slate-400 block mb-1 font-bold">Serviceable Pincodes:</span>
                    <div className="flex flex-wrap gap-1">
                      {b.servicePincodes.map((pin) => (
                        <span key={pin} className="px-2 py-0.5 rounded bg-slate-700 text-sky-300 font-mono text-[10px]">
                          {pin}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: STAFF & ROLES (RBAC) */}
        {activeTab === 'staff_users' && (
          <div className="space-y-6">
            
            {/* Header & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    RBAC Policy Enforcement
                  </span>
                  <span className="text-xs font-mono text-slate-400">Multi-Role Governance</span>
                </div>
                <h3 className="font-black text-xl text-white mt-1">Staff & User Management</h3>
                <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
                  Administer operational staff across store hubs. Enforce strict role-based authorizations across both Online Bookings and Walk-in Store floor workflows.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/25 flex items-center gap-2 shrink-0 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add New User / Staff</span>
              </button>
            </div>

            {/* Role Breakdown Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-1">
                <span className="text-[11px] text-purple-400 font-bold uppercase block">Store Managers</span>
                <div className="text-2xl font-black text-white font-mono">
                  {staffList.filter((s) => s.role === 'store_manager' || s.role === 'manager').length}
                </div>
                <span className="text-[10px] text-slate-500">Full Store & Pipeline Access</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-sky-500/30 space-y-1">
                <span className="text-[11px] text-sky-400 font-bold uppercase block">Store Operators</span>
                <div className="text-2xl font-black text-white font-mono">
                  {staffList.filter((s) => s.role === 'store_operator' || s.role === 'counter_operator' || s.role === 'counter').length}
                </div>
                <span className="text-[10px] text-slate-500">Queue Intake, Pick/Drop Assign, POS</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-1">
                <span className="text-[11px] text-amber-400 font-bold uppercase block">Floor Workers</span>
                <div className="text-2xl font-black text-white font-mono">
                  {staffList.filter((s) => s.role === 'worker' || ['wash_operator', 'iron_operator', 'qc_checker'].includes(s.role)).length}
                </div>
                <span className="text-[10px] text-slate-500">Wash, Dry, Iron, QC & Packing</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1">
                <span className="text-[11px] text-emerald-400 font-bold uppercase block">Delivery Riders</span>
                <div className="text-2xl font-black text-white font-mono">
                  {staffList.filter((s) => s.role === 'rider' || s.role === 'dispatch').length}
                </div>
                <span className="text-[10px] text-slate-500">Doorstep Route & Handover PIN</span>
              </div>
            </div>

            {/* VISUAL RBAC PERMISSION MATRIX TABLE */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-white">
                  RBAC Authorization Matrix (Online & Walk-In Pipelines)
                </h4>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] font-black border-b border-slate-700">
                    <tr>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Shift Login</th>
                      <th className="p-3.5">Online Order Pipeline Scope</th>
                      <th className="p-3.5">Walk-In Counter & Floor Scope</th>
                      <th className="p-3.5">Administrative Privileges</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span>Store Manager</span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-sky-400">Phone + 4-Digit PIN</td>
                      <td className="p-3.5">
                        <span className="text-emerald-400 font-semibold">Full Pipeline Access:</span> All 14 Stages, Rider assignments, Drop scheduling, and order cancellations.
                      </td>
                      <td className="p-3.5">
                        <span className="text-emerald-400 font-semibold">Full Store Floor Access:</span> Counter POS, Barcode Tag printing, Kanban processing racks, Day-End Cash register close.
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                          Store Master Admin
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        <span>Store Operator</span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-sky-400">Phone + 4-Digit PIN</td>
                      <td className="p-3.5">
                        <span className="text-sky-400 font-semibold">&quot;Order Receive Queue&quot;</span>, <span className="text-sky-400 font-semibold">&quot;Pickup assigned&quot;</span>, and <span className="text-sky-400 font-semibold">&quot;Drop Assigned&quot;</span> dispatch access, plus Cancel Order till pickup.
                      </td>
                      <td className="p-3.5">
                        <span className="text-sky-400 font-semibold">Counter Intake POS:</span> Create walk-in orders, generate barcode tags, collect UPI/Cash, and close shift cash drawer.
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold text-[10px]">
                          Counter & Logistics
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Worker</span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-sky-400">Phone + 4-Digit PIN</td>
                      <td className="p-3.5">
                        <span className="text-amber-400 font-semibold">Internal Store Processing:</span> Received, Sorting, Washing, Drying, Ironing, and <span className="text-amber-400 font-semibold">&quot;QC Check & Packed Ready&quot;</span>.
                      </td>
                      <td className="p-3.5">
                        <span className="text-amber-400 font-semibold">Floor Processing Racks:</span> Move walk-in garments across the 6 Kanban racks (Washing, Drying, Ironing, QC Pass).
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                          Floor Factory Worker
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Rider</span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-sky-400">Phone + 4-Digit PIN</td>
                      <td className="p-3.5">
                        <span className="text-emerald-400 font-semibold">Logistics Execution:</span> &quot;Out for Pickup&quot;, &quot;Order Picked-up&quot; (Scale Weigh-in & Evidence), &quot;Reached Store&quot;, &quot;Out For Delivery&quot;, and &quot;Delivered&quot; (Security PIN Verification).
                      </td>
                      <td className="p-3.5">
                        <span className="text-emerald-400 font-semibold">Home Delivery Drops:</span> Access customer delivery address and PIN for walk-in items requesting doorstep delivery.
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          Delivery Partner
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* STAFF USER DIRECTORY TABLE */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-white">
                    Staff Accounts Directory ({staffList.length})
                  </h4>
                </div>

                {/* Filter and Search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name, phone..."
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <select
                    value={staffRoleFilter}
                    onChange={(e) => setStaffRoleFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold"
                  >
                    <option value="all">All Roles</option>
                    <option value="store_manager">Store Manager</option>
                    <option value="store_operator">Store Operator</option>
                    <option value="worker">Worker</option>
                    <option value="rider">Rider</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs transition-all shadow-md shadow-sky-500/20 active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add User / Staff</span>
                  </button>
                </div>
              </div>

              {/* Staff Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] font-black border-b border-slate-700">
                    <tr>
                      <th className="p-3.5">Staff User</th>
                      <th className="p-3.5">Assigned Role</th>
                      <th className="p-3.5">Store Hub</th>
                      <th className="p-3.5">Active Shift</th>
                      <th className="p-3.5">Mobile (+91)</th>
                      <th className="p-3.5">4-Digit Shift PIN</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {staffList
                      .filter((s) => {
                        const matchesSearch =
                          s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
                          s.phone.includes(staffSearch) ||
                          s.storeName.toLowerCase().includes(staffSearch.toLowerCase());
                        const matchesRole =
                          staffRoleFilter === 'all' ||
                          s.role === staffRoleFilter ||
                          (staffRoleFilter === 'worker' && ['wash_operator', 'iron_operator', 'qc_checker'].includes(s.role)) ||
                          (staffRoleFilter === 'store_operator' && (s.role === 'counter_operator' || s.role === 'counter')) ||
                          (staffRoleFilter === 'store_manager' && s.role === 'manager') ||
                          (staffRoleFilter === 'rider' && s.role === 'dispatch');
                        return matchesSearch && matchesRole;
                      })
                      .map((st) => {
                        const isPinRevealed = !!revealedPins[st.id];
                        const normRole = (st.role === 'manager' || st.role === 'store_manager') ? 'store_manager'
                          : (st.role === 'counter_operator' || st.role === 'counter' || st.role === 'store_operator') ? 'store_operator'
                          : (st.role === 'rider' || st.role === 'dispatch') ? 'rider'
                          : 'worker';

                        return (
                          <tr key={st.id} className="hover:bg-slate-800/40">
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-700 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                                  {st.name[0]}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs">{st.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{st.id}</div>
                                </div>
                              </div>
                            </td>

                            {/* Role Selector */}
                            <td className="p-3.5">
                              <select
                                value={normRole}
                                onChange={(e) => updateStaff(st.id, { role: e.target.value as StoreOperatorRole })}
                                className={`px-2.5 py-1 rounded-xl text-xs font-black border uppercase tracking-wider ${
                                  normRole === 'store_manager'
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    : normRole === 'store_operator'
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                    : normRole === 'rider'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/20'
                                }`}
                              >
                                <option value="store_manager" className="bg-slate-900 text-white">Store Manager</option>
                                <option value="store_operator" className="bg-slate-900 text-white">Store Operator</option>
                                <option value="worker" className="bg-slate-900 text-white">Worker</option>
                                <option value="rider" className="bg-slate-900 text-white">Rider</option>
                              </select>
                            </td>

                            <td className="p-3.5 text-xs text-slate-300">
                              {st.storeName}
                            </td>

                            <td className="p-3.5 capitalize text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                                {st.activeShift || 'morning'}
                              </span>
                            </td>

                            <td className="p-3.5 font-mono text-xs text-white">
                              +91 {st.phone}
                            </td>

                            {/* PIN with reveal toggle */}
                            <td className="p-3.5 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-amber-400 tracking-wider">
                                  {isPinRevealed ? st.pin : '••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedPins((prev) => ({
                                      ...prev,
                                      [st.id]: !prev[st.id],
                                    }))
                                  }
                                  className="text-slate-400 hover:text-white p-1"
                                  title={isPinRevealed ? 'Hide PIN' : 'Reveal PIN'}
                                >
                                  {isPinRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPin = prompt(`Enter new 4-digit PIN for ${st.name}:`, st.pin);
                                    if (newPin && newPin.trim().length === 4) {
                                      updateStaff(st.id, { pin: newPin.trim() });
                                      alert(`PIN for ${st.name} updated to ${newPin.trim()}`);
                                    } else if (newPin !== null) {
                                      alert('PIN must be exactly 4 digits');
                                    }
                                  }}
                                  className="text-slate-500 hover:text-sky-400 p-1"
                                  title="Change PIN"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="p-3.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateStaff(st.id, {
                                    status: st.status === 'active' ? 'on_leave' : 'active',
                                  })
                                }
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-colors ${
                                  st.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {st.status || 'active'}
                              </button>
                            </td>

                            {/* Delete */}
                            <td className="p-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove ${st.name} (${st.role})?`)) {
                                    deleteStaff(st.id);
                                  }
                                }}
                                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                title="Remove Staff User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: PRICING & PER-KG RATES */}
        {activeTab === 'catalogue_pricing' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-white">Price Matrix & Per-Kg Configuration</h3>
                <p className="text-xs text-slate-400">Maker-Checker pricing list with 18% GST calculation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <span className="font-bold text-slate-300 uppercase block">Per-Kg Wash & Press Rates</span>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden">
                  {perKgRates.map((pkg) => (
                    <div key={pkg.id} className="p-3 bg-slate-800/50 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{pkg.serviceName}</div>
                        <div className="text-[10px] text-slate-400">Min {pkg.minWeightKg} kg • {pkg.durationHours}h</div>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-sm">₹{pkg.ratePerKg} / kg</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-bold text-slate-300 uppercase block">Sample Per-Piece Rates</span>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                  {priceMatrix.slice(0, 8).map((pm) => (
                    <div key={pm.id} className="p-2.5 bg-slate-800/50 flex justify-between items-center">
                      <span className="font-bold text-white">{pm.shortCode}</span>
                      <span className="font-mono font-bold text-sky-400">₹{pm.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ORDERS DESK */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            {/* Top Bar: Title, Search, Status Pills, Archive Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-sky-400" />
                  <span>Central Order Desk & Settlement Queue</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time order pipeline management, admin payment reconciliation, and lifecycle closure.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <Link
                  href="/admin/ledger"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Revenue Ledger</span>
                </Link>

                <Link
                  href="/admin/archive"
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>View Archive ({orders.filter(o => o.isArchived).length})</span>
                </Link>

                {orders.filter(o => (o.status === 'delivered' || o.status === 'closed') && !o.isArchived).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const res = archiveAllDeliveredOrders(admin?.name || 'Admin HQ');
                      setSettleSuccessMsg(`Archived ${res.count} delivered orders to historical vault.`);
                      setTimeout(() => setSettleSuccessMsg(''), 4000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-1 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <Archive className="w-3 h-3" />
                    <span>Archive All Delivered ({orders.filter(o => (o.status === 'delivered' || o.status === 'closed') && !o.isArchived).length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-col gap-2.5 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Status Pills */}
                <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto">
                  {[
                    { id: 'all', label: `All Active (${orders.filter(o => !o.isArchived).length})` },
                    { id: 'active', label: `In Progress (${orders.filter(o => !['delivered', 'closed', 'cancelled', 'manual_settlement'].includes(o.status) && !o.isArchived).length})` },
                    { id: 'manual_settlement', label: `Manual Settlement (${orders.filter(o => o.status === 'manual_settlement' && !o.isArchived).length})` },
                    { id: 'delivered', label: `Delivered (${orders.filter(o => o.status === 'delivered' && !o.isArchived).length})` },
                    { id: 'closed', label: `Closed (${orders.filter(o => o.status === 'closed' && !o.isArchived).length})` },
                    { id: 'payment_pending', label: `Payment Due (${orders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled' && !o.isArchived).length})` },
                    { id: 'archived', label: `Archived (${orders.filter(o => o.isArchived).length})` },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setOrderStatusFilter(pill.id as any)}
                      className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                        orderStatusFilter === pill.id
                          ? 'bg-sky-600 text-white font-black shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter invoice, customer..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Channel Selector: All / Online Pickup / Walk-in Counter */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 w-fit text-xs">
                <span className="text-[10px] font-extrabold text-slate-400 px-2 uppercase tracking-wider">Channel Filter:</span>
                {[
                  { id: 'all', label: `All Channels (${orders.filter(o => !o.isArchived).length})` },
                  { id: 'online', label: `Online Pickup (${orders.filter(o => o.orderChannel !== 'walk_in' && !o.isArchived).length})` },
                  { id: 'walk_in', label: `Walk-in Counter (${orders.filter(o => o.orderChannel === 'walk_in' && !o.isArchived).length})` },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setOrderChannelFilter(ch.id as any)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      orderChannelFilter === ch.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Banner */}
            {settleSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">{settleSuccessMsg}</span>
              </div>
            )}

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                    <th className="py-2.5 px-3">Invoice</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Slot Date</th>
                    <th className="py-2.5 px-3">Pcs/Kg</th>
                    <th className="py-2.5 px-3">Total (₹)</th>
                    <th className="py-2.5 px-3">Order Status</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {(() => {
                    const filtered = orders.filter((o) => {
                      // Channel Filter (Online vs Walk-in)
                      if (orderChannelFilter === 'online' && o.orderChannel === 'walk_in') return false;
                      if (orderChannelFilter === 'walk_in' && o.orderChannel !== 'walk_in') return false;

                      if (orderStatusFilter === 'active') {
                        if (['delivered', 'closed', 'cancelled', 'manual_settlement'].includes(o.status) || o.isArchived) return false;
                      } else if (orderStatusFilter === 'manual_settlement') {
                        if (o.status !== 'manual_settlement' || o.isArchived) return false;
                      } else if (orderStatusFilter === 'delivered') {
                        if (o.status !== 'delivered' || o.isArchived) return false;
                      } else if (orderStatusFilter === 'closed') {
                        if (o.status !== 'closed' || o.isArchived) return false;
                      } else if (orderStatusFilter === 'payment_pending') {
                        if (o.paymentStatus === 'paid' || o.status === 'cancelled' || o.isArchived) return false;
                      } else if (orderStatusFilter === 'archived') {
                        if (!o.isArchived) return false;
                      } else {
                        // all active
                        if (o.isArchived) return false;
                      }

                      if (!orderSearch.trim()) return true;
                      const q = orderSearch.toLowerCase();
                      return (
                        (o.invoiceNo || '').toLowerCase().includes(q) ||
                        (o.customerName || '').toLowerCase().includes(q) ||
                        (o.customerPhone && o.customerPhone.includes(q))
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                            No orders found matching the filter criteria.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-sky-400">
                          <Link href={`/customer/orders?inv=${ord.invoiceNo}`} target="_blank" className="hover:underline">
                            #{ord.invoiceNo}
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{ord.customerName}</span>
                          {ord.customerPhone && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              +91 {ord.customerPhone}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ord.orderChannel === 'walk_in'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-sky-500/20 text-sky-300'
                            }`}
                          >
                            {ord.orderChannel === 'walk_in' ? 'Walk-in' : 'Online'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {ord.pickupSlot?.date || ord.orderDate}
                        </td>
                        <td className="py-3 px-3 text-slate-200">
                          {ord.totalQty} {ord.isPerKgOrder ? 'kg' : 'pcs'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-white">
                          {formatCurrency(ord.grandTotal, settings.currency)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] flex items-center gap-1 w-fit ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : ord.status === 'manual_settlement'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : ord.status === 'closed'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                              : ord.status === 'out_for_delivery'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse'
                              : ord.status === 'cancelled'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {ord.status === 'delivered' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                            <span>{ord.status.replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              ord.paymentStatus === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {ord.paymentStatus === 'paid' ? `Paid (${ord.paymentMethod.replace(/_/g, ' ')})` : 'Pending Due'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Cloudflare R2 Photo Evidence Button */}
                            {ord.riderHandover?.riderPhotoEvidence && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewEvidencePhoto({
                                    url: ord.riderHandover!.riderPhotoEvidence!,
                                    invoiceNo: ord.invoiceNo,
                                    customerName: ord.customerName,
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="View Cloudflare R2 photo evidence"
                              >
                                <Camera className="w-3 h-3 text-sky-400" />
                                <span>R2 Photo</span>
                              </button>
                            )}

                            {/* Manual Settle Action Button */}
                            {ord.status !== 'closed' && ord.status !== 'manual_settlement' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSettleModalOrder(ord);
                                  setSettleMethod(ord.paymentMethod || 'cod_cash');
                                  setSettleRef(ord.upiTransactionRef || `SETTLE/MANUAL/${Date.now().toString().slice(-6)}`);
                                  setSettleNotes('Manual admin settlement and closure at Central Order Desk');
                                  setSettleAmount(ord.grandTotal.toString());
                                  setSettleReason('Admin manual settlement');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Manual Settle</span>
                              </button>
                            )}

                            {ord.status === 'manual_settlement' && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold">
                                Settled: ₹{ord.manualSettlement?.settledAmount ?? ord.paidAmount ?? ord.grandTotal}
                              </span>
                            )}

                            {/* Archive Button for Completed Orders */}
                            {(ord.status === 'delivered' || ord.status === 'closed') && !ord.isArchived && (
                              <button
                                type="button"
                                onClick={() => {
                                  archiveOrder(ord.id, admin?.name || 'Admin HQ');
                                  setSettleSuccessMsg(`Order #${ord.invoiceNo} successfully archived!`);
                                  setTimeout(() => setSettleSuccessMsg(''), 3000);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Move to permanent historical archive"
                              >
                                <Archive className="w-3 h-3" />
                                <span>Archive</span>
                              </button>
                            )}

                            {/* Restore Button if in Archived filter */}
                            {ord.isArchived && (
                              <button
                                type="button"
                                onClick={() => {
                                  unarchiveOrder(ord.id);
                                  setSettleSuccessMsg(`Order #${ord.invoiceNo} restored to active orders!`);
                                  setTimeout(() => setSettleSuccessMsg(''), 3000);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            )}

                            {/* Delete Stuck Order Action Button (Task 2) */}
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingOrder(ord);
                                setDeleteOrderReason('Admin removed stuck order');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Permanently delete stuck order and invoice"
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CUSTOMER ACCOUNTS CRM (TASK 1) */}
        {activeTab === 'customers' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
            
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white">Customer Accounts & CRM Central</h3>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {customers.length} Accounts Registered
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Manage registered customer accounts, update profiles & Indian delivery addresses, adjust wallet balances, and delete obsolete or stuck accounts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewCustFirstName('');
                  setNewCustLastName('');
                  setNewCustPhone('');
                  setNewCustEmail('');
                  setNewCustWallet('100');
                  setNewCustFlatNo('');
                  setNewCustStreet('');
                  setNewCustCity('Bengaluru');
                  setNewCustPincode('560038');
                  setShowAddCustomerModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-sky-600/25 transition-all self-start sm:self-auto cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Customer Account</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Total Customer Accounts</span>
                <span className="font-mono text-xl font-bold text-white">{customers.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Active Accounts</span>
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {customers.filter((c) => c.status !== 'disable').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Total Bookings Recorded</span>
                <span className="font-mono text-xl font-bold text-sky-400">
                  {customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">Total Wallet Balances</span>
                <span className="font-mono text-xl font-bold text-purple-400">
                  {formatCurrency(customers.reduce((sum, c) => sum + (c.walletBalance || 0), 0), settings.currency)}
                </span>
              </div>
            </div>

            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold w-fit">
                {[
                  { id: 'all', label: `All (${customers.length})` },
                  { id: 'enable', label: `Active (${customers.filter((c) => c.status !== 'disable').length})` },
                  { id: 'disable', label: `Disabled (${customers.filter((c) => c.status === 'disable').length})` },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setCustomerStatusFilter(pill.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      customerStatusFilter === pill.id
                        ? 'bg-sky-600 text-white font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search name, phone, email, ID..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Addresses</th>
                    <th className="py-2.5 px-3">Orders</th>
                    <th className="py-2.5 px-3">Wallet</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {(() => {
                    const filtered = customers.filter((c) => {
                      if (customerStatusFilter !== 'all' && c.status !== customerStatusFilter) {
                        return false;
                      }
                      if (!customerSearch.trim()) return true;
                      const q = customerSearch.toLowerCase();
                      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
                      return (
                        fullName.includes(q) ||
                        c.phone.includes(q) ||
                        c.email.toLowerCase().includes(q) ||
                        c.id.toLowerCase().includes(q)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            No customer accounts found matching criteria.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((cust) => {
                      const defaultAddr = cust.addresses?.find((a) => a.id === cust.defaultAddressId) || cust.addresses?.[0];
                      return (
                        <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {cust.firstName[0]?.toUpperCase() || 'C'}
                              </div>
                              <div>
                                <span className="font-bold text-white block">
                                  {cust.firstName} {cust.lastName}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  {cust.id} • Joined {cust.joinDate}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-mono text-slate-200">
                                <Phone className="w-3 h-3 text-sky-400" />
                                <span>+91 {cust.phone}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                                {cust.email}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 max-w-[220px]">
                            {defaultAddr ? (
                              <div className="space-y-0.5">
                                <span className="text-[11px] text-slate-200 truncate block">
                                  {defaultAddr.flatNo}, {defaultAddr.street}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {defaultAddr.city} - {defaultAddr.pincode}
                                  {cust.addresses.length > 1 && ` (+${cust.addresses.length - 1} more)`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">No address saved</span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-slate-200">
                            {cust.totalOrders || 0}
                          </td>

                          <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                            ₹{cust.walletBalance || 0}
                          </td>

                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newStatus = cust.status === 'disable' ? 'enable' : 'disable';
                                updateCustomer(cust.id, { status: newStatus });
                              }}
                              className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border cursor-pointer transition-colors ${
                                cust.status === 'disable'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}
                              title="Click to toggle account status"
                            >
                              {cust.status === 'disable' ? 'Disabled' : 'Active'}
                            </button>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Customer Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCustomer(cust);
                                  setEditFirstName(cust.firstName);
                                  setEditLastName(cust.lastName);
                                  setEditEmail(cust.email);
                                  setEditPhone(cust.phone);
                                  setEditWalletBalance(String(cust.walletBalance || 0));
                                  setEditStatus(cust.status || 'enable');
                                  const defA = cust.addresses?.find((a) => a.id === cust.defaultAddressId) || cust.addresses?.[0];
                                  setEditFlatNo(defA?.flatNo || '');
                                  setEditStreet(defA?.street || '');
                                  setEditCity(defA?.city || 'Bengaluru');
                                  setEditPincode(defA?.pincode || '560038');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Edit Customer Account Details"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              {/* Delete Customer Button */}
                              <button
                                type="button"
                                onClick={() => setDeletingCustomer(cust)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Permanently delete customer account"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: SUPPORT & DISPUTES */}
        {activeTab === 'support' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-base text-white">Dispute & Customer Refund Queue</h3>
            <div className="space-y-3 text-xs">
              {orders.filter(o => o.dispute).map((ord) => (
                <div key={ord.id} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">Order #{ord.invoiceNo} • {ord.customerName} (+91 {ord.customerPhone})</span>
                    <span className="text-rose-400 uppercase">{ord.dispute?.status}</span>
                  </div>
                  <p className="text-slate-300">{ord.dispute?.description}</p>
                  
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        resolveDispute(ord.id, ord.dispute!.id, 'approved_refund', 'Store manager approved full refund for garment damage', 250);
                        alert('Refund of ₹250 approved and credited to customer wallet!');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                    >
                      Approve ₹250 Wallet Refund
                    </button>
                    <button
                      onClick={() => {
                        resolveDispute(ord.id, ord.dispute!.id, 'rejected', 'Pre-existing stain noted during intake');
                        alert('Dispute marked resolved.');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300"
                    >
                      Reject with Reason
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: FINANCE & GST */}
        {activeTab === 'finance' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-white">GST B2C & B2B Tax Invoice Register</h3>
                <p className="text-xs text-slate-400">GSTIN: {settings.gstin} • 18% Integrated Goods and Service Tax</p>
              </div>

              <button
                type="button"
                onClick={() => alert('Accountant CSV exported successfully!')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export for CA / Accountant (.CSV)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block mb-1">Total Taxable Value</span>
                <span className="font-mono text-xl font-bold text-white">₹1,780.00</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block mb-1">Total CGST + SGST (18%)</span>
                <span className="font-mono text-xl font-bold text-sky-400">₹320.40</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                <span className="text-slate-400 block mb-1">UPI Settlements (ICICI)</span>
                <span className="font-mono text-xl font-bold text-emerald-400">₹1,680.90</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: DLT SMS TEMPLATES & COUPONS */}
        {activeTab === 'marketing' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white">TRAI DLT-Registered SMS Templates (India)</h3>
              <p className="text-xs text-slate-400">Pre-approved headers and templates for 100% compliant customer delivery alerts</p>
            </div>

            <div className="space-y-3 text-xs">
              {dltTemplates.map((dlt) => (
                <div key={dlt.templateId} className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{dlt.title}</span>
                    <span className="font-mono text-[10px] text-sky-400">{dlt.templateId}</span>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    {dlt.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD STAFF USER MODAL */}
        {showAddStaffModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-sky-400 font-mono text-xs uppercase tracking-wider mb-1">
                    <UserPlus className="w-4 h-4" />
                    <span>Access Control & Authentication</span>
                  </div>
                  <h3 className="text-lg font-black text-white">Create Staff User & Assign Role</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assign operational permissions across Online pipeline and Walk-in counter/floor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Kumar"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Mobile Number (India) *</label>
                    <div className="flex">
                      <span className="px-3 py-2.5 rounded-l-xl bg-slate-800/80 border border-r-0 border-slate-700 text-slate-400 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 rounded-r-xl bg-slate-800 border border-slate-700 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">4-Digit Shift Login PIN *</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="1234"
                      value={newStaffPin}
                      onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-mono font-bold tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Assign Operational Role *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        role: 'store_manager' as StoreOperatorRole,
                        title: 'Store Manager',
                        badge: 'Full Store Control',
                        desc: 'Full access to all stages, Walk-in POS, Kanban racks, cash register close & cancellations',
                        color: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
                      },
                      {
                        role: 'store_operator' as StoreOperatorRole,
                        title: 'Store Operator',
                        badge: 'Counter & Intake',
                        desc: 'Order Receive Queue, Pickup assigned, Drop Assigned dispatch + Walk-in counter POS',
                        color: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
                      },
                      {
                        role: 'worker' as StoreOperatorRole,
                        title: 'Worker',
                        badge: 'Floor Factory',
                        desc: 'Received, Sorting, Washing, Drying, Ironing, and QC Check & Packed Ready (Kanban racks)',
                        color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
                      },
                      {
                        role: 'rider' as StoreOperatorRole,
                        title: 'Rider',
                        badge: 'Doorstep Logistics',
                        desc: 'Out for Pickup, Order Picked-up, Reached Store, Out For Delivery, and Delivered (PIN verified)',
                        color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
                      },
                    ].map((r) => {
                      const isSelected = newStaffRole === r.role;
                      return (
                        <div
                          key={r.role}
                          onClick={() => setNewStaffRole(r.role)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? `${r.color} ring-2 ring-sky-400 shadow-md`
                              : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-white text-xs">{r.title}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                              {r.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">{r.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Store / Hub</label>
                    <select
                      value={newStaffStoreId}
                      onChange={(e) => setNewStaffStoreId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Shift Schedule</label>
                    <select
                      value={newStaffShift}
                      onChange={(e) => setNewStaffShift(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none capitalize"
                    >
                      <option value="morning">Morning (07:00 AM - 03:00 PM)</option>
                      <option value="evening">Evening (03:00 PM - 11:00 PM)</option>
                      <option value="night">Night (11:00 PM - 07:00 AM)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-lg shadow-sky-500/25 active:scale-95 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create User Account</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN ORDER SETTLEMENT MODAL */}
        {settleModalOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Financial Settlement Desk
                  </span>
                  <h3 className="text-lg font-black text-white">
                    Settle & Close Order #{settleModalOrder.invoiceNo}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Customer: <strong className="text-white">{settleModalOrder.customerName}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettleModalOrder(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Settlement Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Invoice Amount:</span>
                  <span className="font-mono text-base font-black text-white">
                    {formatCurrency(settleModalOrder.grandTotal, settings.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Current Payment Status:</span>
                  <span className="font-bold text-amber-400 uppercase">
                    {settleModalOrder.paymentStatus || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const effectiveAmount = parseFloat(settleAmount) || settleModalOrder.grandTotal;
                  const res = adminSettleAndCloseOrder(
                    settleModalOrder.id,
                    settleMethod,
                    settleRef,
                    settleNotes,
                    effectiveAmount,
                    settleReason
                  );
                  if (res.success) {
                    setSettleSuccessMsg(res.message);
                    setSettleModalOrder(null);
                    setTimeout(() => setSettleSuccessMsg(''), 4000);
                  }
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Recorded Settlement Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Recorded amount will be booked as settled revenue and logged in financial registry.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Settlement Payment Mode *
                  </label>
                  <select
                    value={settleMethod}
                    onChange={(e) => setSettleMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none"
                  >
                    <option value="cod_cash">Cash Received (Doorstep / Desk)</option>
                    <option value="cod_upi">UPI Payment (QR / App intent)</option>
                    <option value="pos_machine">Card Swipe / Tap on POS Terminal</option>
                    <option value="bank_transfer">Direct Bank Transfer (NEFT / IMPS)</option>
                    <option value="admin_waiver">Admin Management Waiver / Compensation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Settlement Reason / Justification
                  </label>
                  <input
                    type="text"
                    value={settleReason}
                    onChange={(e) => setSettleReason(e.target.value)}
                    placeholder="e.g. Counter direct payment / VIP customer concession"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Payment Reference / URN
                  </label>
                  <input
                    type="text"
                    value={settleRef}
                    onChange={(e) => setSettleRef(e.target.value)}
                    placeholder="e.g. UPI/ICICI/9182371 or Receipt #401"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Audit Notes
                  </label>
                  <input
                    type="text"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    placeholder="Notes on settlement..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSettleModalOrder(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Manual Settlement</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 1. DELETE STUCK ORDER MODAL (TASK 2) */}
        {deletingOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Delete Stuck Order & Invoice</span>
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    Order #{deletingOrder.invoiceNo}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Customer: <strong className="text-white">{deletingOrder.customerName}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingOrder(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order Channel:</span>
                  <span className="font-bold text-white uppercase">{deletingOrder.orderChannel || 'online'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Pipeline Status:</span>
                  <span className="font-bold text-amber-400 uppercase">{deletingOrder.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Grand Total:</span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(deletingOrder.grandTotal, settings.currency)}
                  </span>
                </div>
                <p className="text-[11px] text-rose-300 pt-1.5 border-t border-rose-500/20 leading-relaxed">
                  ⚠️ <strong>Permanent Action:</strong> This will completely delete this order and its invoice from the active pipeline, database ledger, and customer history. Use this to clear stuck or corrupted bookings.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Reason for Deletion
                </label>
                <input
                  type="text"
                  value={deleteOrderReason}
                  onChange={(e) => setDeleteOrderReason(e.target.value)}
                  placeholder="e.g. Stuck payment, Duplicate test order, Customer abandoned"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteOrder(deletingOrder.id);
                    setSettleSuccessMsg(`Order #${deletingOrder.invoiceNo} successfully deleted from ledger.`);
                    setDeletingOrder(null);
                    setTimeout(() => setSettleSuccessMsg(''), 4000);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete Order</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. EDIT CUSTOMER ACCOUNT MODAL (TASK 1) */}
        {editingCustomer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-sky-400" />
                    <span>Edit Customer Profile</span>
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    {editingCustomer.firstName} {editingCustomer.lastName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {editingCustomer.id} • Joined: {editingCustomer.joinDate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const updatedAddr: IndianAddress = {
                    id: editingCustomer.defaultAddressId || `addr-${Date.now()}`,
                    label: 'Home',
                    tag: 'Home',
                    flatNo: editFlatNo.trim() || 'Flat 101',
                    society: 'Indiranagar Society',
                    street: editStreet.trim() || 'Main Road',
                    city: editCity.trim() || 'Bengaluru',
                    state: 'Karnataka',
                    pincode: editPincode.trim() || '560038',
                    isDefault: true,
                  };

                  updateCustomer(editingCustomer.id, {
                    firstName: editFirstName.trim(),
                    lastName: editLastName.trim(),
                    email: editEmail.trim().toLowerCase(),
                    phone: editPhone.replace(/\D/g, ''),
                    walletBalance: parseFloat(editWalletBalance) || 0,
                    status: editStatus,
                    addresses: [updatedAddr],
                  });

                  setSettleSuccessMsg(`Customer account "${editFirstName} ${editLastName}" updated successfully.`);
                  setEditingCustomer(null);
                  setTimeout(() => setSettleSuccessMsg(''), 4000);
                }}
                className="space-y-3.5 text-xs"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Mobile Phone (10 digits) *</label>
                    <div className="flex">
                      <span className="px-2.5 py-2 rounded-l-xl bg-slate-800 border border-r-0 border-slate-700 text-slate-400 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 rounded-r-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Wallet Balance (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editWalletBalance}
                      onChange={(e) => setEditWalletBalance(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Account Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="enable">Active (Enable)</option>
                      <option value="disable">Disabled (Disable)</option>
                    </select>
                  </div>
                </div>

                {/* Primary Address */}
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="font-bold text-[11px] text-slate-300 block">Default Indian Delivery Address</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Flat / House / Building"
                      value={editFlatNo}
                      onChange={(e) => setEditFlatNo(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Street / Locality"
                      value={editStreet}
                      onChange={(e) => setEditStreet(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Pincode (6 digits)"
                      value={editPincode}
                      onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ''))}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. DELETE CUSTOMER ACCOUNT MODAL (TASK 1) */}
        {deletingCustomer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Delete Customer Account</span>
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    {deletingCustomer.firstName} {deletingCustomer.lastName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    +91 {deletingCustomer.phone} • {deletingCustomer.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingCustomer(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Orders Placed:</span>
                  <span className="font-bold text-white">{deletingCustomer.totalOrders || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Wallet Balance:</span>
                  <span className="font-mono font-bold text-emerald-400">₹{deletingCustomer.walletBalance || 0}</span>
                </div>
                <p className="text-[11px] text-rose-300 pt-1.5 border-t border-rose-500/20 leading-relaxed">
                  ⚠️ <strong>Irreversible Deletion:</strong> This customer account and all associated delivery addresses will be permanently deleted from the database ledger. Active customer login sessions for this phone will be invalidated.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteCustomer(deletingCustomer.id);
                    setSettleSuccessMsg(`Customer account (${deletingCustomer.firstName} ${deletingCustomer.lastName}) permanently deleted.`);
                    setDeletingCustomer(null);
                    setTimeout(() => setSettleSuccessMsg(''), 4000);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete Customer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. ADD NEW CUSTOMER ACCOUNT MODAL (TASK 1) */}
        {showAddCustomerModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-sky-400" />
                    <span>Customer Registration</span>
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    Create New Customer Account
                  </h3>
                  <p className="text-xs text-slate-400">
                    Register a new customer profile with welcome wallet credit and default address.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCustFirstName.trim() || !newCustPhone.trim()) {
                    alert('Please provide first name and phone number.');
                    return;
                  }
                  const cleanPhone = newCustPhone.replace(/\D/g, '');
                  if (cleanPhone.length < 10) {
                    alert('Please provide a valid 10-digit Indian mobile number.');
                    return;
                  }

                  const defaultAddrId = `addr-${Date.now()}`;
                  addCustomer({
                    firstName: newCustFirstName.trim(),
                    lastName: newCustLastName.trim(),
                    phone: cleanPhone,
                    email: newCustEmail.trim() || `${cleanPhone}@dhobighat.in`,
                    walletBalance: parseFloat(newCustWallet) || 100,
                    status: 'enable',
                    defaultAddressId: defaultAddrId,
                    addresses: [
                      {
                        id: defaultAddrId,
                        label: 'Home',
                        tag: 'Home',
                        flatNo: newCustFlatNo.trim() || 'Flat 101',
                        society: 'Indiranagar Society',
                        street: newCustStreet.trim() || '12th Main Road',
                        city: newCustCity.trim() || 'Bengaluru',
                        state: 'Karnataka',
                        pincode: newCustPincode.trim() || '560038',
                        isDefault: true,
                      },
                    ],
                  });

                  setSettleSuccessMsg(`Customer "${newCustFirstName.trim()}" successfully registered!`);
                  setShowAddCustomerModal(false);
                  setTimeout(() => setSettleSuccessMsg(''), 4000);
                }}
                className="space-y-3 text-xs"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh"
                      value={newCustFirstName}
                      onChange={(e) => setNewCustFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Reddy"
                      value={newCustLastName}
                      onChange={(e) => setNewCustLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Mobile Phone (India) *</label>
                    <div className="flex">
                      <span className="px-2.5 py-2 rounded-l-xl bg-slate-800 border border-r-0 border-slate-700 text-slate-400 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 rounded-r-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="suresh@example.com"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Initial Wallet Credit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCustWallet}
                    onChange={(e) => setNewCustWallet(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Primary Address */}
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="font-bold text-[11px] text-slate-300 block">Initial Delivery Address</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Flat / House / Building"
                      value={newCustFlatNo}
                      onChange={(e) => setNewCustFlatNo(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Street / Locality"
                      value={newCustStreet}
                      onChange={(e) => setNewCustStreet(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={newCustCity}
                      onChange={(e) => setNewCustCity(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Pincode (e.g. 560038)"
                      value={newCustPincode}
                      onChange={(e) => setNewCustPincode(e.target.value.replace(/\D/g, ''))}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Customer Account</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. CLOUDFLARE R2 PHOTO EVIDENCE PREVIEW MODAL (TASK 4) */}
        {previewEvidencePhoto && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Rider Garment Intake Evidence</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Cloudflare R2 Object Storage
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    Order #{previewEvidencePhoto.invoiceNo} • {previewEvidencePhoto.customerName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewEvidencePhoto(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black/60 max-h-[60vh] flex items-center justify-center">
                <img
                  src={previewEvidencePhoto.url}
                  alt={`Evidence for #${previewEvidencePhoto.invoiceNo}`}
                  className="max-h-[58vh] w-auto object-contain rounded-xl"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
                <div className="text-slate-400 font-mono text-[11px] truncate max-w-md">
                  R2 Reference: <span className="text-sky-300">{previewEvidencePhoto.url}</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <a
                    href={previewEvidencePhoto.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    <span>Open in New Tab</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewEvidencePhoto(null)}
                    className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
