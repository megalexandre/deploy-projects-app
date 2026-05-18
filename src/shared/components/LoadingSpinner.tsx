import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className }) => (
  <div className={`flex h-64 items-center justify-center ${className ?? ''}`}>
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" />
  </div>
);
