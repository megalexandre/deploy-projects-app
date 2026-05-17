import React from 'react';

interface SelectionCardProps {
  active: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  active,
  onClick,
  title,
  description,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded border px-4 py-4 text-left transition-colors ${
      active
        ? 'border-blue-500 bg-blue-900/25 text-blue-100'
        : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
    }`}
  >
    <p className="text-base font-semibold">{title}</p>
    {description && <p className="text-sm opacity-80">{description}</p>}
  </button>
);
