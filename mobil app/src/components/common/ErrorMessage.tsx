import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-center space-y-2">
      <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
      <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-200 font-medium">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer mt-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('common.retry')}</span>
        </button>
      )}
    </div>
  );
};
