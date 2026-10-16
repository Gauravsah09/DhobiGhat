'use client';

import React, { useState } from 'react';
import { Receipt, Plus, Trash2, Calendar, DollarSign, X } from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { formatCurrency } from '@/lib/utils';
import { PaymentMethod } from '@/types';

export function ExpensesView() {
  const { expenses, addExpense, deleteExpense, settings } = useLaundry();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    payeeName: '',
    type: 'Electricity',
    amount: 50.0,
    paidBy: 'bycash' as PaymentMethod,
    remarks: '',
    date: '',
  });

  React.useEffect(() => {
    setForm((prev) => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
  }, []);

  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.payeeName.trim() || form.amount <= 0) return;

    addExpense({
      payeeName: form.payeeName.trim(),
      type: form.type,
      amount: form.amount,
      paidBy: form.paidBy,
      remarks: form.remarks,
      date: form.date,
    });

    setIsModalOpen(false);
    setForm({
      payeeName: '',
      type: 'Electricity',
      amount: 50.0,
      paidBy: 'bycash',
      remarks: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Business Expenses Ledger</h2>
          <p className="text-xs text-slate-500">Record laundry utility bills, machinery parts, chemicals, and driver fuel.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800">
            Total Outflow: {formatCurrency(totalExpenses, settings.currency)}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-4">Payee / Vendor</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-mono text-slate-500">{exp.date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{exp.payeeName}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                        {exp.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-500">
                      {exp.paidBy.replace('by', '')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{exp.remarks || '—'}</td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-700 text-sm">
                      -{formatCurrency(exp.amount, settings.currency)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete expense for ${exp.payeeName}?`)) deleteExpense(exp.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Record Business Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Payee / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Electric Power Utility, Fuel Station"
                  value={form.payeeName}
                  onChange={(e) => setForm({ ...form, payeeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Expense Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Travelling">Travelling / Fuel</option>
                    <option value="Detergents">Detergent & Supplies</option>
                    <option value="Maintenance">Machinery Repair</option>
                    <option value="Rent">Shop Rent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Amount ({settings.currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={form.paidBy}
                    onChange={(e) => setForm({ ...form, paidBy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="bycash">Cash</option>
                    <option value="online">Online / Card</option>
                    <option value="bycheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Optional notes or receipt voucher ref"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl font-bold text-white shadow-xs"
                >
                  Save Outflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
