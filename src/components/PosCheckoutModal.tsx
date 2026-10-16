'use client';

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  UserPlus, 
  Sparkles, 
  Check, 
  Printer, 
  CreditCard,
  Banknote,
  FileCheck
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { OrderItem, PaymentMethod } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface PosCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId: string) => void;
}

export function PosCheckoutModal({ isOpen, onClose, onOrderCreated }: PosCheckoutModalProps) {
  const { 
    customers, 
    addCustomer, 
    clothTypes, 
    services, 
    priceMatrix, 
    createOrder, 
    settings, 
    getNextInvoiceNumber 
  } = useLaundry();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '1');
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [taxPct, setTaxPct] = useState<number>(settings.taxRate || 5);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bycash');
  const [remarks, setRemarks] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setDeliveryDate(d.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Add Item by matching Garment & Selected Service
  const handleAddGarmentToCart = (clothId: string) => {
    const cloth = clothTypes.find((c) => c.id === clothId);
    const service = services.find((s) => s.id === selectedServiceId);
    if (!cloth || !service) return;

    // Lookup matching price matrix item
    const priceItem = priceMatrix.find(
      (p) => p.serviceId === service.id && p.clothId === cloth.id
    );

    const unitPrice = priceItem ? priceItem.price : 10.0;
    const priceCodeId = priceItem ? priceItem.id : `${service.id}-${cloth.id}`;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.serviceName === service.name && item.clothName === cloth.name
      );

      if (existingIdx > -1) {
        const next = [...prev];
        const current = next[existingIdx];
        const newQty = current.quantity + 1;
        next[existingIdx] = {
          ...current,
          quantity: newQty,
          total: Number((newQty * current.unitPrice).toFixed(2)),
        };
        return next;
      }

      return [
        ...prev,
        {
          id: String(Date.now() + Math.random()),
          priceCodeId,
          serviceName: service.name,
          clothName: cloth.name,
          unitPrice,
          quantity: 1,
          total: unitPrice,
        },
      ];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              quantity: newQty,
              total: Number((newQty * item.unitPrice).toFixed(2)),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Quick Customer Creation
  const handleQuickCreateCustomer = () => {
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    const [first, ...rest] = newCustName.trim().split(' ');
    const newCust = addCustomer({
      firstName: first || 'Customer',
      lastName: rest.join(' ') || '',
      phone: newCustPhone.trim(),
      email: `${newCustPhone.trim()}@laundry.com`,
      address: 'Counter Walk-in',
      status: 'enable',
    });
    setSelectedCustomerId(newCust.id);
    setIsAddingNewCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  // Calculations
  const totalQty = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = cartItems.reduce((acc, i) => acc + i.total, 0);
  const discountAmount = Number(((subtotal * discountPct) / 100).toFixed(2));
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number(((taxableAmount * taxPct) / 100).toFixed(2));
  const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));

  // Submit Order
  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

    const newOrder = createOrder({
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerPhone: customer.phone,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate,
      items: cartItems,
      totalQty,
      subtotal,
      discountPct,
      discountAmount,
      taxPct,
      taxAmount,
      grandTotal,
      paymentMethod,
      remarks,
      status: 'pending',
    });

    onClose();
    onOrderCreated(newOrder.id);
  };

  const activeService = services.find((s) => s.id === selectedServiceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">POS Intake & Quick Checkout</h2>
              <p className="text-xs text-slate-500">Creating Invoice #{getNextInvoiceNumber()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Column: Garment & Service Selector (7 Cols) */}
          <div className="lg:col-span-7 p-6 overflow-y-auto space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200">
            
            {/* Step 1: Customer Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Customer</label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isAddingNewCustomer ? 'Choose Existing' : '+ Quick Add Customer'}
                </button>
              </div>

              {isAddingNewCustomer ? (
                <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-2xl flex gap-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-sky-500"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile / Phone"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-sky-500"
                  />
                  <button
                    onClick={handleQuickCreateCustomer}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-500"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 focus:outline-sky-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.phone}) - {c.address || (c.addresses && c.addresses[0]?.society) || 'Standard'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 2: Service Switcher */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">1. Choose Service</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {services.map((srv) => {
                  const isSelected = selectedServiceId === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServiceId(srv.id)}
                      className={`p-3 rounded-2xl text-left border transition-all text-xs font-semibold flex flex-col justify-between h-16 ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400">Code: {srv.code}</span>
                      <span className="text-sm font-bold truncate">{srv.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Garment Matrix */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                2. Tap Garment to Add ({activeService?.name})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {clothTypes.map((cloth) => {
                  // Find price for current service
                  const priceEntry = priceMatrix.find(
                    (p) => p.serviceId === selectedServiceId && p.clothId === cloth.id
                  );
                  const price = priceEntry ? priceEntry.price : 10.0;

                  return (
                    <button
                      key={cloth.id}
                      type="button"
                      onClick={() => handleAddGarmentToCart(cloth.id)}
                      className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-sky-500 hover:bg-sky-50/40 text-left transition-all active:scale-97 group flex flex-col justify-between h-20 shadow-xs"
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-sky-700 truncate">{cloth.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                          {priceEntry?.shortCode || cloth.code}
                        </span>
                      </div>
                      <div className="flex justify-between items-center w-full mt-2">
                        <span className="text-xs font-black text-sky-700">
                          {formatCurrency(price, settings.currency)}
                        </span>
                        <span className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center text-xs transition-colors">
                          <Plus className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delivery Date & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Target Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Special Wash Notes / Stains</label>
                <input
                  type="text"
                  placeholder="e.g., Collar starch, urgent"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Live Order Summary & Receipt (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-50/70 p-6 flex flex-col justify-between overflow-y-auto">
            
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Basket</span>
                <span className="text-xs font-bold text-slate-800">{totalQty} Items</span>
              </div>

              {/* Items List */}
              <div className="py-3 space-y-2 max-h-56 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Tap garments on the left to add items to this order.
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-bold text-slate-800 truncate">{item.clothName}</div>
                        <div className="text-[10px] text-slate-500">{item.serviceName} • {formatCurrency(item.unitPrice, settings.currency)}</div>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-500 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-14 text-right font-bold text-slate-900">
                        {formatCurrency(item.total, settings.currency)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Calculations & Payment Controls */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              
              {/* Discount & Tax Selectors */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Gov. Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPct}
                    onChange={(e) => setTaxPct(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                  {(['bycash', 'online', 'bycheque'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-1.5 rounded-lg border text-center uppercase tracking-wider text-[10px] transition-all ${
                        paymentMethod === mode
                          ? 'border-sky-600 bg-sky-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {mode.replace('by', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal, settings.currency)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({discountPct}%):</span>
                    <span>-{formatCurrency(discountAmount, settings.currency)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax ({taxPct}%):</span>
                    <span>+{formatCurrency(taxAmount, settings.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-100">
                  <span>Grand Total:</span>
                  <span className="text-sky-700">{formatCurrency(grandTotal, settings.currency)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={handleCheckout}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-md shadow-sky-600/25 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4 stroke-[2.5]" />
                Complete Order & Create Invoice
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
