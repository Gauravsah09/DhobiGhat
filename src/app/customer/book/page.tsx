'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CalendarPlus, 
  MapPin, 
  Clock, 
  Shirt, 
  Sparkles, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ShieldCheck, 
  Percent, 
  CheckCircle2, 
  AlertCircle,
  LocateFixed,
  Building,
  Tag,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Loader2
} from 'lucide-react';
import { CustomerNavbar } from '@/components/customer/CustomerNavbar';
import { useLaundry } from '@/context/LaundryContext';
import { GarmentOrderItem, IndianAddress, PaymentMethod } from '@/types';
import { formatCurrency, generateUpiUri } from '@/lib/utils';

interface CartLineItem {
  id: string;
  clothId: string;
  clothName: string;
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  qty: number;
  starchLevel?: 'none' | 'light' | 'medium' | 'heavy';
  foldStyle?: 'hanger' | 'flat_fold' | 'roll_fold';
  stainNote?: string;
}

function CustomerBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlanId = searchParams.get('plan');

  const { 
    clothTypes, 
    services, 
    priceMatrix, 
    perKgRates, 
    branches, 
    customerSession, 
    createOrder, 
    settings 
  } = useLaundry();

  const { user, isLoggedIn, addAddress } = customerSession;

  // Booking mode: 'per_piece' or 'per_kg'
  const [bookingMode, setBookingMode] = useState<'per_kg' | 'per_piece'>(
    preselectedPlanId ? 'per_kg' : 'per_kg'
  );

  // Per Kg inputs
  const [selectedKgPlanId, setSelectedKgPlanId] = useState<string>(
    preselectedPlanId || perKgRates[0]?.id || ''
  );
  const [estimatedKg, setEstimatedKg] = useState<number>(4);

  // Per piece cart
  const [cartItems, setCartItems] = useState<CartLineItem[]>([
    {
      id: 'init-1',
      clothId: clothTypes[0]?.id || 'c-1',
      clothName: clothTypes[0]?.name || 'Men Shirt / T-Shirt',
      serviceId: services[2]?.id || 's-3',
      serviceName: services[2]?.name || 'Wash & Steam Iron',
      unitPrice: 59,
      qty: 3,
      starchLevel: 'none',
      foldStyle: 'hanger',
    },
  ]);

  // Modal item selector
  const [selClothId, setSelClothId] = useState(clothTypes[0]?.id || '');
  const [selServiceId, setSelServiceId] = useState(services[0]?.id || '');
  const [selStarch, setSelStarch] = useState<'none' | 'light' | 'medium' | 'heavy'>('none');
  const [selFold, setSelFold] = useState<'hanger' | 'flat_fold' | 'roll_fold'>('hanger');
  const [selStainNote, setSelStainNote] = useState('');

  // Slot timing states
  const [pickupDate, setPickupDate] = useState('');
  const [timeWindow, setTimeWindow] = useState<
    'Morning (07:00 AM - 10:00 AM)' | 'Morning (10:00 AM - 01:00 PM)' | 'Evening (04:00 PM - 07:00 PM)' | 'Evening (07:00 PM - 10:00 PM)'
  >('Morning (07:00 AM - 10:00 AM)');

  // Address states
  const defaultAddr = user?.addresses.find((a) => a.id === user.defaultAddressId) || user?.addresses[0];
  const [flatNo, setFlatNo] = useState(defaultAddr?.flatNo || '');
  const [society, setSociety] = useState(defaultAddr?.society || '');
  const [street, setStreet] = useState(defaultAddr?.street || '');
  const [landmark, setLandmark] = useState(defaultAddr?.landmark || '');
  const [city, setCity] = useState(defaultAddr?.city || 'Bengaluru');
  const [state, setState] = useState(defaultAddr?.state || 'Karnataka');
  const [pincode, setPincode] = useState(defaultAddr?.pincode || '');

  // Customer contact
  const [custName, setCustName] = useState(user ? `${user.firstName} ${user.lastName}`.trim() : '');
  const [custPhone, setCustPhone] = useState(user ? user.phone : '');

  // Payment method (Defaults to COD Cash, user can switch to COD UPI or Instant UPI QR)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('cod_cash');
  const [upiPaymentStatus, setUpiPaymentStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [upiRef, setUpiRef] = useState('');
  const [upiCopied, setUpiCopied] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const [paymentValidationError, setPaymentValidationError] = useState('');

  const simulateUpiPayment = () => {
    setUpiPaymentStatus('PROCESSING');
    setPaymentValidationError('');
    setTimeout(() => {
      const generatedRef = `UPI/ICICI/${Math.floor(10000000 + Math.random() * 90000000)}/OK`;
      setUpiRef(generatedRef);
      setUpiVerified(true);
      setUpiPaymentStatus('SUCCESS');
    }, 1200);
  };

  // Coupon state
  const [couponCode, setCouponCode] = useState('FIRSTWASH');
  const [couponApplied, setCouponApplied] = useState(true);

  // Set default pickup date on mount
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setPickupDate(d.toISOString().split('T')[0]);
  }, []);

  // Sync with user profile if logged in
  useEffect(() => {
    if (user) {
      setCustName(`${user.firstName} ${user.lastName}`.trim());
      setCustPhone(user.phone);
      if (defaultAddr) {
        setFlatNo(defaultAddr.flatNo || '');
        setSociety(defaultAddr.society || '');
        setStreet(defaultAddr.street || '');
        setLandmark(defaultAddr.landmark || '');
        setCity(defaultAddr.city || 'Bengaluru');
        setState(defaultAddr.state || 'Karnataka');
        setPincode(defaultAddr.pincode || '');
      }
    }
  }, [user, defaultAddr]);

  // Selected Per-Kg Plan
  const activeKgPlan = perKgRates.find((p) => p.id === selectedKgPlanId) || perKgRates[0];

  // Rate lookup for active garment selection
  const activeRateItem = priceMatrix.find(
    (p) => p.clothId === selClothId && p.serviceId === selServiceId
  );
  const activeItemPrice = activeRateItem ? activeRateItem.price : 60;

  // Add Item to cart
  const handleAddToCart = () => {
    const cloth = clothTypes.find((c) => c.id === selClothId);
    const serv = services.find((s) => s.id === selServiceId);
    if (!cloth || !serv) return;

    setCartItems([
      ...cartItems,
      {
        id: `cart-${Date.now()}`,
        clothId: cloth.id,
        clothName: cloth.name,
        serviceId: serv.id,
        serviceName: serv.name,
        unitPrice: activeItemPrice,
        qty: 1,
        starchLevel: selStarch,
        foldStyle: selFold,
        stainNote: selStainNote,
      },
    ]);

    setSelStainNote('');
  };

  const updateCartQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty: it.qty + delta } : it))
        .filter((it) => it.qty > 0)
    );
  };

  const removeCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Financial Calculations
  const perKgSubtotal = bookingMode === 'per_kg' ? (activeKgPlan?.ratePerKg || 79) * estimatedKg : 0;
  const perPieceSubtotal = bookingMode === 'per_piece' 
    ? cartItems.reduce((sum, it) => sum + it.unitPrice * it.qty, 0) 
    : 0;

  const rawSubtotal = bookingMode === 'per_kg' ? perKgSubtotal : perPieceSubtotal;

  // Delivery fee: Free above ₹299
  const freeThreshold = settings.freeDeliveryThreshold ?? 299;
  const standardFee = settings.standardDeliveryFee ?? 49;
  const deliveryFee = rawSubtotal >= freeThreshold ? 0 : standardFee;

  // Coupon discount
  let discountAmount = 0;
  if (couponApplied && couponCode.toUpperCase() === 'FIRSTWASH') {
    discountAmount = Math.min(100, rawSubtotal * 0.5); // ₹100 max off
  } else if (couponApplied && couponCode.toUpperCase() === 'CLEANINDIA') {
    discountAmount = rawSubtotal * 0.15;
  }

  const taxableAmount = Math.max(0, rawSubtotal - discountAmount + deliveryFee);
  const gstAmount = (taxableAmount * settings.taxRate) / 100;
  const grandTotal = taxableAmount + gstAmount;

  // Simulate Location Auto-Detect
  const handleDetectLocation = () => {
    setCity('Bengaluru');
    setState('Karnataka');
    setPincode('560038');
    setSociety('Indiranagar Stage 2');
    setStreet('100 Feet Road, Near Metro');
    setLandmark('Opposite BDA Complex');
  };

  // Submit Booking
  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!custName.trim() || !custPhone.trim()) {
      alert('Please provide your name and contact phone.');
      return;
    }

    if (bookingMode === 'per_piece' && cartItems.length === 0) {
      alert('Please add at least 1 garment to your cart.');
      return;
    }

    // Strict Payment Validation: Don't Place the order until COD options are selected or Instant UPI payment status is Success
    if (!paymentMethod) {
      setPaymentValidationError('Please select a payment option (COD - Cash, COD - UPI, or Instant UPI) before placing your order.');
      return;
    }

    if (paymentMethod === 'upi_qr' && (!upiVerified || upiPaymentStatus !== 'SUCCESS')) {
      setPaymentValidationError('Instant UPI payment has not been completed or verified. Please verify UPI payment or choose a Cash on Delivery (COD) option.');
      return;
    }

    const currentAddress: IndianAddress = {
      id: `addr-${Date.now()}`,
      label: 'Home',
      flatNo,
      society,
      street,
      landmark,
      city,
      state,
      pincode,
      isDefault: true,
    };

    // Construct Garment Order Items
    const defaultPlan = {
      id: 'kg-wash-iron',
      serviceName: 'Wash & Steam Iron (Per Kg)',
      ratePerKg: 79,
      minKg: 3,
      durationHours: 48,
    };
    const safeKgPlan = activeKgPlan || perKgRates[0] || defaultPlan;

    const orderItems: GarmentOrderItem[] = 
      bookingMode === 'per_piece'
        ? cartItems.map((c, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            clothId: c.clothId,
            clothName: c.clothName,
            serviceId: c.serviceId,
            serviceName: c.serviceName,
            unitPrice: c.unitPrice,
            quantity: c.qty,
            total: c.unitPrice * c.qty,
            starchLevel: c.starchLevel,
            foldStyle: c.foldStyle,
            stainNote: c.stainNote,
            tagBarcode: `BAR-${Math.floor(100000 + Math.random() * 900000)}`,
          }))
        : [
            {
              id: `item-kg-${Date.now()}`,
              clothId: 'c-kg',
              clothName: `Mixed Everyday Clothes (${estimatedKg} kg est.)`,
              serviceId: safeKgPlan.id,
              serviceName: safeKgPlan.serviceName,
              unitPrice: safeKgPlan.ratePerKg,
              quantity: estimatedKg,
              total: safeKgPlan.ratePerKg * estimatedKg,
              tagBarcode: `BAR-KG-${Math.floor(100000 + Math.random() * 900000)}`,
            },
          ];

    const validPickupDate = pickupDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const delivDate = new Date(validPickupDate);
    if (isNaN(delivDate.getTime())) {
      delivDate.setTime(Date.now() + 2 * 86400000);
    } else {
      delivDate.setDate(delivDate.getDate() + (safeKgPlan?.durationHours === 24 ? 1 : 2));
    }
    const safeDeliveryDate = !isNaN(delivDate.getTime())
      ? delivDate.toISOString().split('T')[0]
      : new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    const userPhone10 = (user?.phone || '').replace(/\D/g, '').slice(-10);
    const enteredPhone10 = custPhone.replace(/\D/g, '').slice(-10);
    const finalPhone = enteredPhone10 || userPhone10 || custPhone;
    const finalCustomerId = user?.id || (userPhone10 ? `cust-${userPhone10}` : (enteredPhone10 ? `guest-${enteredPhone10}` : `cust-${Date.now()}`));
    const finalCustomerName = (custName || (user ? `${user.firstName} ${user.lastName}`.trim() : 'Valued Customer')).trim();

    const newOrder = createOrder({
      status: 'booked',
      storeId: branches[0]?.id || 'branch-blr-1',
      storeName: branches[0]?.name || 'Bengaluru - Indiranagar Flagship',
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      customerPhone: finalPhone,
      customerEmail: user?.email,
      pickupAddress: currentAddress,
      orderDate: new Date().toISOString().split('T')[0],
      pickupSlot: {
        date: validPickupDate,
        window: timeWindow,
      },
      deliveryDate: safeDeliveryDate,
      deliverySlotWindow: timeWindow,
      items: orderItems,
      isPerKgOrder: bookingMode === 'per_kg',
      perKgRate: bookingMode === 'per_kg' ? safeKgPlan.ratePerKg : undefined,
      recordedWeightKg: bookingMode === 'per_kg' ? estimatedKg : undefined,
      totalQty: bookingMode === 'per_piece' ? cartItems.reduce((s, it) => s + it.qty, 0) : estimatedKg,
      subtotal: rawSubtotal,
      discountPct: discountAmount > 0 ? 10 : 0,
      discountAmount,
      couponCode: couponApplied ? couponCode : undefined,
      deliveryFee,
      gstRate: settings.taxRate,
      gstAmount,
      grandTotal,
      paymentMethod: (paymentMethod || 'cod_cash') as PaymentMethod,
      paymentStatus: paymentMethod === 'upi_qr' ? 'paid' : 'pending',
      upiTransactionRef: paymentMethod === 'upi_qr' ? (upiRef || `UPI/${Date.now().toString().slice(-8)}/ICICI`) : undefined,
      remarks: `[Customer Online Booking] Pickup Slot: ${timeWindow}. Payment: ${(paymentMethod || 'cod').toUpperCase()}`,
    });

    // Redirect to orders page with new invoice
    router.push(`/customer/orders?inv=${newOrder.invoiceNo}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <CustomerNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:px-6">

        {/* Title & Trust Header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-2">
            <CalendarPlus className="w-3.5 h-3.5 text-sky-600" />
            Book Laundry & Dry Cleaning Pickup
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Schedule Doorstep Collection
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Choose your preferred plan, pick a convenient Morning or Evening slot, and relax.
          </p>
        </div>

        <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left 2 Cols: Rate Card, Slots, and Address */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Rate Card Selection: Per-Kg vs Per-Piece */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    1. Choose Laundry Service Rate Card
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Select how you want your clothes charged</p>
                </div>

                {/* Plan Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBookingMode('per_kg')}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      bookingMode === 'per_kg'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⚖️ Per Kg (Wash & Fold)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingMode('per_piece')}
                    className={`px-4 py-2 rounded-xl transition-all ${
                      bookingMode === 'per_piece'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👔 Per Piece (Dry Clean / Iron)
                  </button>
                </div>
              </div>

              {/* Mode A: Per Kg Weight Calculator */}
              {bookingMode === 'per_kg' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {perKgRates.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedKgPlanId(pkg.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          selectedKgPlanId === pkg.id
                            ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-200/50'
                            : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-sm text-slate-900">{pkg.serviceName}</span>
                          <span className="font-mono font-black text-sky-700 text-base">
                            ₹{pkg.ratePerKg}/kg
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pkg.description}</p>
                        <div className="flex items-center gap-2 mt-3 text-[11px] font-semibold text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Turnaround: {pkg.durationHours} Hours</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Weight Slider / Stepper */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Estimated Clothes Weight</span>
                      <span className="font-mono font-bold text-sky-700 text-sm">{estimatedKg} Kg</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setEstimatedKg((k) => Math.max(3, k - 1))}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <input
                        type="range"
                        min={3}
                        max={20}
                        step={1}
                        value={estimatedKg}
                        onChange={(e) => setEstimatedKg(Number(e.target.value))}
                        className="flex-1 accent-sky-600"
                      />

                      <button
                        type="button"
                        onClick={() => setEstimatedKg((k) => k + 1)}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      * Minimum 3 kg. Actual weight will be verified by the pickup rider with digital hanging scale.
                    </p>
                  </div>
                </div>
              ) : (
                /* Mode B: Per Piece Garment Selector */
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Select Garment</label>
                        <select
                          value={selClothId}
                          onChange={(e) => setSelClothId(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-semibold"
                        >
                          {clothTypes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Select Treatment</label>
                        <select
                          value={selServiceId}
                          onChange={(e) => setSelServiceId(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-semibold"
                        >
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.durationHours}h)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Starch Preference</label>
                        <select
                          value={selStarch}
                          onChange={(e) => setSelStarch(e.target.value as any)}
                          className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs"
                        >
                          <option value="none">No Starch (Soft)</option>
                          <option value="light">Light Crisp</option>
                          <option value="medium">Medium Starch</option>
                          <option value="heavy">Heavy Starch (Crisp)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Finishing & Fold</label>
                        <select
                          value={selFold}
                          onChange={(e) => setSelFold(e.target.value as any)}
                          className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs"
                        >
                          <option value="hanger">On Hanger with Poly Bag</option>
                          <option value="flat_fold">Flat Suitcase Fold</option>
                          <option value="roll_fold">Roll Fold (Bedsheets)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs">
                        <span className="text-slate-400">Rate: </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ₹{activeItemPrice}
                        </span>
                        <span className="text-slate-400"> / piece</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Item</span>
                      </button>
                    </div>
                  </div>

                  {/* Added Pieces Cart */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {cartItems.map((it) => (
                      <div key={it.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{it.clothName}</div>
                          <div className="text-slate-400 text-[11px]">
                            {it.serviceName} • ₹{it.unitPrice} ea • Starch: {it.starchLevel} • {it.foldStyle}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => updateCartQty(it.id, -1)}
                              className="w-5 h-5 rounded bg-white text-slate-700 font-bold flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-bold text-slate-900">{it.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(it.id, 1)}
                              className="w-5 h-5 rounded bg-white text-slate-700 font-bold flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-mono font-bold text-slate-900 w-16 text-right">
                            ₹{it.unitPrice * it.qty}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeCartItem(it.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Morning & Evening Time Slots */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                  2. Select Pickup Slot (Morning & Evening Only)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Date</label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time Window</label>
                  <select
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-sky-500"
                  >
                    <optgroup label="🌅 Morning Slots">
                      <option value="Morning (07:00 AM - 10:00 AM)">Morning (07:00 AM - 10:00 AM)</option>
                      <option value="Morning (10:00 AM - 01:00 PM)">Morning (10:00 AM - 01:00 PM)</option>
                    </optgroup>
                    <optgroup label="🌆 Evening Slots">
                      <option value="Evening (04:00 PM - 07:00 PM)">Evening (04:00 PM - 07:00 PM)</option>
                      <option value="Evening (07:00 PM - 10:00 PM)">Evening (07:00 PM - 10:00 PM)</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Detailed Indian Address & Location Feature */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                    3. Pickup & Delivery Address (India)
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs border border-sky-200 transition-colors"
                >
                  <LocateFixed className="w-3.5 h-3.5 text-sky-600" />
                  <span>Auto-Detect GPS</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Rao"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone (+91) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Flat / House / Door No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Block B"
                    value={flatNo}
                    onChange={(e) => setFlatNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Society / Colony / Building *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prestige Ozone Apartments"
                    value={society}
                    onChange={(e) => setSociety(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">Street / Road / Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12th Main, HAL 2nd Stage, Indiranagar"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Sony Signal"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Pune">Pune</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pincode (6 Digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="560038"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Col: Cart Summary & Payment (UPI / COD) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg sticky top-24 space-y-5">
              <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Cart Order Summary</span>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  GST 18% Included
                </span>
              </h3>

              {/* Items Summary */}
              <div className="space-y-2 text-xs">
                {bookingMode === 'per_kg' ? (
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>{activeKgPlan.serviceName} ({estimatedKg} kg)</span>
                    <span className="font-mono font-bold">₹{perKgSubtotal}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {cartItems.map((it) => (
                      <div key={it.id} className="flex justify-between text-slate-600">
                        <span>{it.qty}x {it.clothName} ({it.serviceName})</span>
                        <span className="font-mono font-bold">₹{it.unitPrice * it.qty}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹{rawSubtotal.toFixed(2)}</span>
                </div>

                {/* Delivery fee */}
                <div className="flex justify-between text-slate-500">
                  <span>Doorstep Pickup & Delivery:</span>
                  <span className="font-bold text-emerald-600">
                    {deliveryFee === 0 ? 'FREE (Orders > ₹299)' : `₹${deliveryFee}`}
                  </span>
                </div>

                {/* Coupon discount */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon ({couponCode}):</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500">
                  <span>GST (18% Integrated):</span>
                  <span className="font-mono font-semibold">₹{gstAmount.toFixed(2)}</span>
                </div>

                {/* Grand Total */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total Payable:</span>
                  <span className="text-2xl font-black text-sky-700 font-mono">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Indian Coupon Code Input */}
              <div className="pt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Promo Code"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => setCouponApplied(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                    ✓ Promo FIRSTWASH applied!
                  </span>
                )}
              </div>

              {/* Payment Method Selector (UPI & 2 COD Options) */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Payment Method
                  </label>
                  <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-full">
                    UPI & Cash Enabled
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* 1. Online UPI (Pay Now) */}
                  <label
                    onClick={() => setPaymentMethod('upi_qr')}
                    className={`flex items-start justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'upi_qr'
                        ? 'bg-sky-50/90 border-sky-400 ring-2 ring-sky-200/60 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Pay Online via UPI</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                            Instant
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Google Pay • PhonePe • Paytm • BHIM • UPI QR
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'upi_qr'}
                      onChange={() => setPaymentMethod('upi_qr')}
                      className="accent-sky-600 mt-1"
                    />
                  </label>

                  {/* 2. COD - Cash */}
                  <label
                    onClick={() => {
                      setPaymentMethod('cod_cash');
                      setPaymentValidationError('');
                    }}
                    className={`flex items-start justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'cod_cash'
                        ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-200/60 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Cash on Delivery (COD - Cash)</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                            Available
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Hand physical cash to delivery executive at doorstep
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod_cash'}
                      onChange={() => {
                        setPaymentMethod('cod_cash');
                        setPaymentValidationError('');
                      }}
                      className="accent-emerald-600 mt-1"
                    />
                  </label>

                  {/* 3. COD - UPI */}
                  <label
                    onClick={() => {
                      setPaymentMethod('cod_upi');
                      setPaymentValidationError('');
                    }}
                    className={`flex items-start justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'cod_upi'
                        ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-200/60 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>UPI on Delivery (COD - UPI)</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-purple-100 text-purple-800">
                            Recommended
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Scan rider&apos;s dynamic UPI QR or pay via DhobiGhat app upon doorstep delivery
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod_upi'}
                      onChange={() => {
                        setPaymentMethod('cod_upi');
                        setPaymentValidationError('');
                      }}
                      className="accent-purple-600 mt-1"
                    />
                  </label>
                </div>

                {/* Dynamic Online UPI Box */}
                {paymentMethod === 'upi_qr' && (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl text-center space-y-3 mt-2 border border-slate-800">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Total Payable:</span>
                      <span className="font-mono text-base font-black text-amber-400">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs bg-slate-800/80 p-2 rounded-xl">
                      <span className="text-slate-400 font-mono text-[11px]">UPI ID:</span>
                      <span className="font-mono font-bold text-sky-300 text-xs">{settings.upiId || 'dhobighat.pay@icici'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(settings.upiId || 'dhobighat.pay@icici');
                          setUpiCopied(true);
                          setTimeout(() => setUpiCopied(false), 2000);
                        }}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[10px] text-white flex items-center gap-1 transition-colors"
                      >
                        {upiCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{upiCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Dynamic QR Code */}
                    <div className="w-32 h-32 bg-white p-2.5 rounded-2xl mx-auto flex flex-col items-center justify-between shadow-lg shadow-black/40">
                      <div className="w-full h-full border-4 border-slate-900 rounded-lg p-1 flex flex-col items-center justify-center bg-slate-50 relative">
                        <QrCode className="w-14 h-14 text-slate-900" />
                        <span className="font-mono text-[9px] font-black text-slate-900 mt-0.5">
                          ₹{grandTotal.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Live UPI Payment Status Indicator */}
                    {upiPaymentStatus === 'PROCESSING' && (
                      <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                        <span>Verifying transaction with UPI gateway provider...</span>
                      </div>
                    )}

                    {upiPaymentStatus === 'SUCCESS' && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-bold">✓ Payment of {formatCurrency(grandTotal)} Confirmed (Status: SUCCESS)</span>
                      </div>
                    )}

                    {/* UPI App Quick Intent Triggers */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
                      <a
                        href={generateUpiUri({
                          upiId: settings.upiId || 'dhobighat.pay@icici',
                          name: 'DhobiGhat Laundry',
                          amount: grandTotal,
                          note: 'DhobiGhat Online Booking',
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold flex items-center justify-center gap-1"
                      >
                        <span>GPay / Apps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <button
                        type="button"
                        disabled={upiPaymentStatus === 'PROCESSING'}
                        onClick={simulateUpiPayment}
                        className={`py-2 px-2 col-span-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                          upiVerified && upiPaymentStatus === 'SUCCESS'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white'
                        }`}
                      >
                        {upiPaymentStatus === 'PROCESSING' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : upiVerified ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            <span>Payment Verified ✓</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Simulate Instant UPI & Verify</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Scan using Google Pay, PhonePe, Paytm or BHIM UPI app.
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Validation Alert */}
              {paymentValidationError && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{paymentValidationError}</span>
                </div>
              )}

              {/* Submit Button (Strictly blocked until COD selected or UPI Success) */}
              {(() => {
                const isPlacable = Boolean(
                  paymentMethod === 'cod_cash' ||
                  paymentMethod === 'cod_upi' ||
                  (paymentMethod === 'upi_qr' && upiVerified && upiPaymentStatus === 'SUCCESS')
                );

                return (
                  <button
                    type="submit"
                    disabled={!isPlacable}
                    className={`w-full py-4 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
                      isPlacable
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/30 active:scale-98 cursor-pointer'
                        : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <span>
                      {!paymentMethod
                        ? 'Select Payment Option (COD or Instant UPI)'
                        : paymentMethod === 'upi_qr' && !isPlacable
                        ? `Complete UPI Payment (${formatCurrency(grandTotal)}) to Place Order`
                        : paymentMethod === 'upi_qr'
                        ? `Confirm & Place Order (UPI Paid ${formatCurrency(grandTotal)})`
                        : paymentMethod === 'cod_cash'
                        ? `Confirm & Place Order (Cash on Delivery)`
                        : `Confirm & Place Order (UPI on Delivery)`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                );
              })()}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Damage & Stain Guarantee</span>
              </div>
            </div>
          </div>

        </form>

      </main>
    </div>
  );
}

export default function CustomerBookingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Booking Engine...</div>}>
      <CustomerBookingContent />
    </Suspense>
  );
}
