/** Componente reutilizavel 'Button': encapsula estrutura visual e comportamento isolado da UI. */
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0';
  
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_12px_26px_-14px_rgba(59,130,246,0.95)] hover:brightness-110 hover:-translate-y-0.5',
    secondary:
      'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_12px_26px_-14px_rgba(251,146,60,0.95)] hover:brightness-110 hover:-translate-y-0.5',
    outline:
      'border border-white/20 bg-slate-900/50 text-slate-100 hover:bg-slate-800/80 hover:border-cyan-300/45'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};
