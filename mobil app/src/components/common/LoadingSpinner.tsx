import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, size = 'md' }) => {
  const { t } = useTranslation();
  const displayMsg = message || t('common.loading');

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-sky-600`} />
      {displayMsg && <p className="text-xs text-slate-500 font-medium">{displayMsg}</p>}
    </div>
  );
};
