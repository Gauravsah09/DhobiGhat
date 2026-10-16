'use client';

import React from 'react';
import { ShoppingBag, Clock, Sparkles, CheckCircle2, DollarSign, Users } from 'lucide-react';
import { useLaundry } from '@/context/LaundryContext';
import { formatCurrency } from '@/lib/utils';

export function StatsCards() {
  const { orders, customers, settings } = useLaundry();

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'booked').length;
  const activeWashing = orders.filter((o) => o.status === 'washing' || o.status === 'processing' || o.status === 'received_at_store').length;
  const readyOrders = orders.filter((o) => o.status === 'ready' || o.status === 'out_for_delivery').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'closed').length;

  const totalRevenue = orders.reduce((acc, curr) => acc + curr.grandTotal, 0);

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue, settings.currency),
      subtext: `${totalOrders} orders billed`,
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Pending Intake',
      value: pendingOrders,
      subtext: 'Awaiting wash sorting',
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'In Processing',
      value: activeWashing + readyOrders,
      subtext: `${activeWashing} washing, ${readyOrders} ready`,
      icon: Sparkles,
      color: 'from-sky-500 to-blue-600',
      bgColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'Delivered',
      value: deliveredOrders,
      subtext: 'Completed & dispatched',
      icon: CheckCircle2,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Active Customers',
      value: customers.length,
      subtext: 'Registered clients',
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</span>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${stat.bgColor}`}>
                <Icon className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">{stat.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
