'use client';

import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { Order } from '@/types';
import { useLaundry } from '@/context/LaundryContext';
import { formatCurrency } from '@/lib/utils';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const { settings } = useLaundry();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Preview</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 text-sky-700">
              {order.invoiceNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/track?inv=${order.invoiceNo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Track Live</span>
            </a>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 overflow-y-auto print-only space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{settings.shopName}</h1>
              <div className="mt-1 text-xs text-slate-500 space-y-0.5">
                <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {settings.address}, {settings.city}</div>
                <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {settings.phone}</div>
                <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {settings.email}</div>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white tracking-widest uppercase">
                Tax Invoice
              </span>
              <div className="text-xl font-mono font-bold text-slate-900">{order.invoiceNo}</div>
              <div className="text-xs text-slate-500">Order Date: <span className="font-semibold text-slate-700">{order.orderDate}</span></div>
              {order.deliveryDate && (
                <div className="text-xs text-slate-500">Est. Delivery: <span className="font-semibold text-slate-700">{order.deliveryDate}</span></div>
              )}
            </div>
          </div>

          {/* Customer & Status Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed To Customer</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{order.customerName}</div>
              {order.customerPhone && (
                <div className="text-xs text-slate-600 mt-0.5">Mobile: {order.customerPhone}</div>
              )}
            </div>
            <div className="sm:text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment & Status</div>
              <div className="flex sm:justify-end items-center gap-2 mt-1">
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md uppercase bg-emerald-100 text-emerald-800">
                  {order.paymentMethod.replace('by', '')}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md uppercase bg-sky-100 text-sky-800">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Garment</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{item.serviceName}</td>
                    <td className="py-2.5 px-3 font-medium">{item.clothName}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice, settings.currency)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.total, settings.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-xs text-slate-500 max-w-xs space-y-1">
              {order.remarks && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-800">
                  <span className="font-semibold">Special Notes:</span> {order.remarks}
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                Terms: Goods inspected upon receipt. Clothes not claimed within 30 days are subject to standard warehouse fee.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Pieces:</span>
                <span className="font-semibold">{order.totalQty} pcs</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(order.subtotal, settings.currency)}</span>
              </div>
              {order.discountPct > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({order.discountPct}%):</span>
                  <span>-{formatCurrency(order.discountAmount, settings.currency)}</span>
                </div>
              )}
              {(order.taxPct ?? order.gstRate ?? 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Gov Tax / GST ({order.taxPct ?? order.gstRate ?? 0}%):</span>
                  <span>+{formatCurrency(order.taxAmount ?? order.gstAmount ?? 0, settings.currency)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-sky-700">{formatCurrency(order.grandTotal, settings.currency)}</span>
              </div>
            </div>
          </div>

          {/* Barcode & Footer Visual */}
          <div className="pt-6 border-t border-dashed border-slate-200 text-center space-y-1">
            <div className="inline-block font-mono text-xl tracking-widest px-4 py-1 bg-slate-100 rounded-md text-slate-800">
              ||| | ||||| || |||||| ||| ||| {order.invoiceNo}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Track live laundry progress anytime: <span className="font-mono text-sky-700 underline">/track?inv={order.invoiceNo}</span>
            </p>
            <p className="text-[10px] text-slate-400">Thank you for trusting {settings.shopName} with your garments.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
