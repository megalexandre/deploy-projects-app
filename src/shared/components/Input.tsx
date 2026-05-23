/** Componente reutilizavel 'Input': encapsula estrutura visual e comportamento isolado da UI. */
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  inputRef,
  className = '',
  id,
  ...props
}) => {
  const inputId =
    id ??
    label
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const baseClasses =
    'block w-full rounded-xl border border-white/20 bg-slate-900/50 text-slate-100 placeholder-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35 focus:outline-none transition-colors duration-200';
  const classes = `${baseClasses} ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-200">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-slate-400">{icon}</div>
          </div>
        )}
        <input id={inputId} ref={inputRef} className={classes} {...props} />
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
