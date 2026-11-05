import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle } from 'lucide-react';
import { isDataStale, timeAgo } from '@/utils/date';

interface StaleDataWarningProps {
  lastUpdated?: string | null;
  thresholdMinutes?: number;
  className?: string;
}

export const StaleDataWarning: React.FC<StaleDataWarningProps> = ({
  lastUpdated,
  thresholdMinutes,
  className = '',
}) => {
  const { t } = useTranslation();

  if (!lastUpdated) return null;

  const stale = isDataStale(lastUpdated, thresholdMinutes);
  if (!stale) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium ${className}`}
      role="status"
    >
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <span>{t('app.staleWarning')}</span>
      <span className="opacity-80">({timeAgo(lastUpdated)})</span>
    </div>
  );
};

export const LastUpdatedBadge: React.FC<{ timestamp?: string | null }> = ({ timestamp }) => {
  if (!timestamp) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
      <Clock className="w-3 h-3" />
      <span>Updated {timeAgo(timestamp)}</span>
    </span>
  );
};
