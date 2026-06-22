import React from 'react';

type StatusVariant = 'active' | 'inactive' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
};

const dotStyles: Record<StatusVariant, string> = {
  active: 'bg-emerald-400',
  inactive: 'bg-slate-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  info: 'bg-blue-400',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, label, className }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className ?? ''}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} />
    {label}
  </span>
);
