import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Telemetry Error',
  message,
  onRetry,
}) => {
  return (
    <div
      className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 flex items-start gap-3 my-2"
      role="alert"
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        <p className="text-xs text-red-700 dark:text-red-400/90">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors shadow-xs"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Retry Query
          </button>
        )}
      </div>
    </div>
  );
};
