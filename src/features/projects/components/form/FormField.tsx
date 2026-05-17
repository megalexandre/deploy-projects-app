import React from 'react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  colSpan?: 'full';
}

export const FormField: React.FC<FormFieldProps> = ({ label, children, colSpan }) => (
  <div className={colSpan === 'full' ? 'md:col-span-2' : undefined}>
    <label className="block text-sm text-gray-300 mb-2">{label}</label>
    {children}
  </div>
);
