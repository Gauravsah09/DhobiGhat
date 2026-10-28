'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'accent' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface EditorialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export function EditorialButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: EditorialButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-full',
    md: 'px-4 py-2 text-sm rounded-full',
    lg: 'px-6 py-3 text-base rounded-full',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-b from-[#35332e] to-[#1b1a17] dark:from-[#2a2620] dark:to-[#171410] text-white shadow-sm hover:ring-2 hover:ring-amber-500/50 border border-white/10 dark:border-amber-500/20 active:scale-[0.98]',
    accent:
      'bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm hover:ring-2 hover:ring-amber-500/50 active:scale-[0.98]',
    ghost:
      'border border-[var(--c-border)] bg-[var(--c-canvas-surface)] hover:bg-[var(--c-canvas-sunken)] hover:border-[var(--c-border-strong)] text-[var(--c-ink)] active:scale-[0.98]',
    danger:
      'bg-rose-700 hover:bg-rose-800 text-white font-medium shadow-sm active:scale-[0.98]',
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-mono font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface EditorialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function EditorialCard({
  className = '',
  children,
  ...props
}: EditorialCardProps) {
  return (
    <div
      className={`bg-[var(--c-canvas-surface)] border border-[var(--c-border)] rounded-2xl shadow-[0_2px_8px_rgba(27,26,23,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

type StageType = 'pending' | 'intake' | 'washing' | 'ironing' | 'ready' | 'delivered' | 'cancelled' | string;

interface StatusLozengeProps {
  status: StageType;
  label?: string;
  className?: string;
}

export function StatusLozenge({ status, label, className = '' }: StatusLozengeProps) {
  const normalized = status.toLowerCase();

  let dotColor = 'bg-amber-500';
  let glowColor = 'ring-amber-500/30';
  let badgeBg = 'bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/20';
  let defaultLabel = 'Pending';

  if (['intake', 'washing', 'ironing', 'in_progress', 'processing'].includes(normalized)) {
    dotColor = 'bg-sky-500';
    glowColor = 'ring-sky-500/30';
    badgeBg = 'bg-sky-500/10 text-sky-900 dark:text-sky-200 border-sky-500/20';
    defaultLabel = normalized === 'washing' ? 'In Wash' : normalized === 'ironing' ? 'Steam Ironing' : 'Processing';
  } else if (['ready', 'delivered', 'completed', 'paid'].includes(normalized)) {
    dotColor = 'bg-emerald-500';
    glowColor = 'ring-emerald-500/30';
    badgeBg = 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border-emerald-500/20';
    defaultLabel = normalized === 'delivered' ? 'Delivered' : 'Ready';
  } else if (['cancelled', 'rejected', 'failed'].includes(normalized)) {
    dotColor = 'bg-rose-500';
    glowColor = 'ring-rose-500/30';
    badgeBg = 'bg-rose-500/10 text-rose-900 dark:text-rose-200 border-rose-500/20';
    defaultLabel = 'Cancelled';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-[var(--c-border)] ${badgeBg} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor} ring-4 ${glowColor} animate-pulse shrink-0`} />
      <span>{label || defaultLabel}</span>
    </span>
  );
}
