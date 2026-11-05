import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading telemetry...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 gap-3 text-slate-500 dark:text-slate-400"
      role="status"
      aria-live="polite"
    >
      <Loader2 className={`${sizeClasses} animate-spin text-sky-600 dark:text-sky-400`} />
      <span className="text-xs font-medium tracking-wide">{label}</span>
    </div>
  );
};
