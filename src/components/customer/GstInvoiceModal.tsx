'use client';

import React from 'react';
import { X, Printer, ShieldCheck, FileCheck, CheckCircle2 } from 'lucide-react';
import { Order } from '@/types';
import { formatDateTime } from '@/lib/utils';

interface GstInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export function GstInvoiceModal({ order, onClose }: GstInvoiceModalProps) {
  if (!order) return null;

  // Format pickup address cleanly
  const formatAddress = () => {
    if (!order.pickupAddress) return 'Walk-in / Store Intake';
    if (typeof order.pickupAddress === 'string') return order.pickupAddress;
    const parts = [
      order.pickupAddress.flatNo,
      order.pickupAddress.society,
      order.pickupAddress.street,
      order.pickupAddress.landmark,
      order.pickupAddress.city,
      order.pickupAddress.state,
      order.pickupAddress.pincode,
    ].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  const discount = order.discountAmount || 0;
  const taxableValue = Math.max(0, (order.subtotal || 0) - discount);
  const cgstAmount = order.gstAmount ? order.gstAmount / 2 : taxableValue * 0.09;
  const sgstAmount = order.gstAmount ? order.gstAmount / 2 : taxableValue * 0.09;
  const deliveryFee = order.deliveryFee || 0;
  const computedGrandTotal = Math.round(order.grandTotal ?? (taxableValue + cgstAmount + sgstAmount + deliveryFee));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #gst-invoice-sheet, #gst-invoice-sheet * {
            visibility: visible;
          }
          #gst-invoice-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Tax Invoice Viewer</h3>
              <p className="text-[11px] text-slate-400">Official Indian GST Compliant Invoice</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable GST Invoice Sheet */}
        <div id="gst-invoice-sheet" className="p-8 sm:p-10 text-slate-900 bg-white">
          {/* Header & Company Details */}
          <div className="border-b-2 border-slate-900 pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase bg-slate-900 text-white mb-2">
                  Tax Invoice
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">DhobiGhat India</h1>
                <p className="text-xs text-slate-600 font-medium mt-1">Premium Fabric Care & Laundry Services</p>
                <div className="mt-2 text-xs text-slate-700 space-y-0.5 font-sans">
                  <p>State: <strong className="font-semibold text-slate-900">Karnataka (Code: 29)</strong></p>
                  <p>GSTIN: <strong className="font-mono font-bold text-slate-900">29AABCU9603R1ZM</strong></p>
                  <p>SAC Code: <strong className="font-mono font-bold text-slate-900">999719</strong> (Washing, Cleaning & Dyeing Services)</p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="sm:text-right bg-slate-50 border border-slate-200 rounded-2xl p-4 min-w-[220px]">
                <div className="text-[11px] text-slate-500 font-medium">Invoice Number</div>
                <div className="text-base font-extrabold font-mono text-slate-900">{order.invoiceNo || order.id}</div>
                <div className="mt-2 text-[11px] text-slate-500 font-medium">Invoice Date</div>
                <div className="text-xs font-semibold text-slate-800">
                  {order.orderDate ? formatDateTime(order.orderDate) : new Date().toLocaleDateString('en-IN')}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 font-medium">Order Channel</div>
                <div className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                  {order.orderChannel || (order.pickupAddress ? 'Online Pickup' : 'Store Walk-In')}
                </div>
                {order.deliveryDate && (
                  <>
                    <div className="mt-2 text-[11px] text-slate-500 font-medium">Delivery Date</div>
                    <div className="text-xs font-semibold text-slate-800">{order.deliveryDate}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bill To & Dispatch Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Billed To (Customer Details)
              </div>
              <div className="text-sm font-bold text-slate-900">{order.customerName || 'Valued Customer'}</div>
              <div className="text-xs text-slate-600 mt-1">
                Phone: <span className="font-mono font-semibold text-slate-800">{order.customerPhone || 'N/A'}</span>
              </div>
              {order.customerEmail && (
                <div className="text-xs text-slate-600">
                  Email: <span className="font-medium text-slate-800">{order.customerEmail}</span>
                </div>
              )}
              <div className="text-xs text-slate-600 mt-1 max-w-sm">
                Address: <span className="text-slate-800">{formatAddress()}</span>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Fulfillment Store
              </div>
              <div className="text-sm font-bold text-slate-900">{order.storeName || 'DhobiGhat Central Store'}</div>
              <div className="text-xs text-slate-600 mt-1">
                Place of Supply: <span className="font-semibold text-slate-800">Karnataka (29)</span>
              </div>
              <div className="text-xs text-slate-600">
                Reverse Charge: <span className="font-semibold text-slate-800">No</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Itemized Services</div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-50">
                  <th className="py-2.5 px-3 font-bold text-slate-900">#</th>
                  <th className="py-2.5 px-3 font-bold text-slate-900">Description</th>
                  <th className="py-2.5 px-3 font-bold text-slate-900">SAC Code</th>
                  <th className="py-2.5 px-3 text-center font-bold text-slate-900">Qty</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900">Unit Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900">Taxable Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {it.clothName}
                        <span className="text-slate-500 font-normal ml-1">({it.serviceName})</span>
                        {it.foldStyle && <span className="text-[10px] text-slate-400 block">Fold: {it.foldStyle}</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">999719</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-800">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{it.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {(it.total || it.unitPrice * it.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : order.isPerKgOrder ? (
                  <tr>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">1</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      Bulk Laundry Service by Weight
                      <span className="text-[10px] text-slate-400 block font-normal">Intake Weight: {order.recordedWeightKg || 0} kg</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">999719</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-800">{order.recordedWeightKg || 1} kg</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{(order.perKgRate || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{(order.subtotal || 0).toFixed(2)}</td>
                  </tr>
                ) : (
                  <tr>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">1</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Laundry & Dry Cleaning Service</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">999719</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-800">{order.totalQty || 1}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{(order.subtotal || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{(order.subtotal || 0).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax Computation & Summary */}
          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {/* Payment Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">Payment Breakdown</div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-slate-900 uppercase">{order.paymentMethod || 'UPI / Online'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Payment Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    (order.paymentStatus || 'paid') === 'paid' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {(order.paymentStatus || 'paid').toUpperCase()}
                  </span>
                </div>
                {order.upiTransactionRef && (
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Transaction Ref:</span>
                    <span className="font-mono font-semibold text-slate-900">{order.upiTransactionRef}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 pt-2 text-[11px] text-emerald-700 font-semibold border-t border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>GST Verification: Input Tax Credit eligible</span>
                </div>
              </div>

              {/* Tax Computation Summary */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Taxable Value (Services):</span>
                  <span className="font-mono font-bold text-slate-900">₹{taxableValue.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between py-1 text-emerald-600 font-medium">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 text-slate-700 border-t border-slate-100">
                  <span>CGST (9%):</span>
                  <span className="font-mono font-semibold text-slate-900">₹{cgstAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between py-1 text-slate-700">
                  <span>SGST (9%):</span>
                  <span className="font-mono font-semibold text-slate-900">₹{sgstAmount.toFixed(2)}</span>
                </div>

                {deliveryFee > 0 && (
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Delivery Fee:</span>
                    <span className="font-mono font-semibold text-slate-900">₹{deliveryFee.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 text-sm font-black border-t-2 border-slate-900 text-slate-900">
                  <span>Grand Total (Rounded):</span>
                  <span className="font-mono text-base text-sky-800">₹{computedGrandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Declaration */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <p className="font-bold text-slate-700">Declaration:</p>
              <p>We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.</p>
              <p className="mt-1">Laundry SAC 999719 • Subject to Bengaluru, Karnataka jurisdiction.</p>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="font-bold text-slate-900">For DhobiGhat India</p>
              <p className="mt-6 text-slate-400 font-mono">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default GstInvoiceModal;

