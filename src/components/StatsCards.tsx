'use client';

import React from 'react';
import { Clock, Sparkles, CheckCircle2, DollarSign, Users } from 'lucide-react';
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
      bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Pending Intake',
      value: pendingOrders,
      subtext: 'Awaiting wash sorting',
      icon: Clock,
      bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      title: 'In Processing',
      value: activeWashing + readyOrders,
      subtext: `${activeWashing} washing, ${readyOrders} ready`,
      icon: Sparkles,
      bgColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    },
    {
      title: 'Delivered',
      value: deliveredOrders,
      subtext: 'Completed & dispatched',
      icon: CheckCircle2,
      bgColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      title: 'Active Customers',
      value: customers.length,
      subtext: 'Registered clients',
      icon: Users,
      bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-[var(--c-canvas-surface)] rounded-2xl p-5 border border-[var(--c-border)] shadow-xs hover:border-[var(--c-border-strong)] transition-all duration-150 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--c-ink-muted)] uppercase tracking-wider">{stat.title}</span>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${stat.bgColor}`}>
                <Icon className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xl sm:text-2xl font-bold text-[var(--c-ink)] tracking-tight">{stat.value}</div>
              <p className="text-[11px] text-[var(--c-ink-faint)] mt-1">{stat.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
