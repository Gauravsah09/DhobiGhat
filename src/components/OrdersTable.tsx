'use client';

import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Truck, 
  ArrowUpDown, 
  Eye,
  Filter
} from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { Order, OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface OrdersTableProps {
  onSelectOrder: (order: Order) => void;
}

export function OrdersTable({ onSelectOrder }: OrdersTableProps) {
  const { orders, updateOrderStatus, deleteOrder, settings } = useLaundry();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerPhone && order.customerPhone.includes(searchQuery));

    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const statusConfig: Partial<Record<OrderStatus, { label: string; bg: string; text: string; icon: any }>> = {
    booked: { label: 'Booked', bg: 'bg-amber-100/80 border-amber-200', text: 'text-amber-800', icon: Clock },
    pending: { label: 'Pending', bg: 'bg-amber-100/80 border-amber-200', text: 'text-amber-800', icon: Clock },
    picked_up: { label: 'Picked Up', bg: 'bg-indigo-100/80 border-indigo-200', text: 'text-indigo-800', icon: Truck },
    received_at_store: { label: 'Received', bg: 'bg-sky-100/80 border-sky-200', text: 'text-sky-800', icon: Sparkles },
    washing: { label: 'Washing', bg: 'bg-sky-100/80 border-sky-200', text: 'text-sky-800', icon: Sparkles },
    processing: { label: 'Processing', bg: 'bg-purple-100/80 border-purple-200', text: 'text-purple-800', icon: Sparkles },
    ready: { label: 'Ready', bg: 'bg-emerald-100/80 border-emerald-200', text: 'text-emerald-800', icon: CheckCircle },
    out_for_delivery: { label: 'Out for Delivery', bg: 'bg-sky-100/80 border-sky-200', text: 'text-sky-800', icon: Truck },
    delivered: { label: 'Delivered', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', icon: Truck },
    closed: { label: 'Closed', bg: 'bg-emerald-100/80 border-emerald-200', text: 'text-emerald-800', icon: CheckCircle },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-100 border-rose-200', text: 'text-rose-700', icon: Clock },
    disputed: { label: 'Disputed', bg: 'bg-rose-100 border-rose-200', text: 'text-rose-700', icon: Clock },
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Table Toolbar */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-sky-500 transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {['all', 'pending', 'washing', 'ready', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize shrink-0 transition-all ${
                selectedStatus === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
            <tr>
              <th className="py-3.5 px-5">Invoice</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4 text-center">Items</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Payment</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  No orders found matching your search.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const badge = statusConfig[order.status] || statusConfig.pending || { label: order.status, bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock };
                const StatusIcon = badge.icon;

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Invoice */}
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {order.invoiceNo}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.customerName}</div>
                      {order.customerPhone && (
                        <div className="text-[11px] text-slate-400">{order.customerPhone}</div>
                      )}
                    </td>

                    {/* Order Date */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {order.orderDate}
                    </td>

                    {/* Pieces */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {order.totalQty} pcs
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">
                        {formatCurrency(order.grandTotal, settings.currency)}
                      </div>
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3.5 px-4">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {order.paymentMethod.replace('by', '')}
                      </span>
                    </td>

                    {/* Live Status Selector */}
                    <td className="py-3.5 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className={`text-[11px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-lg border focus:outline-none cursor-pointer transition-all ${badge.bg} ${badge.text}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="washing">Washing</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectOrder(order)}
                          title="Print / View Invoice"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-[11px] transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete order ${order.invoiceNo}?`)) {
                              deleteOrder(order.id);
                            }
                          }}
                          title="Delete Order"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
