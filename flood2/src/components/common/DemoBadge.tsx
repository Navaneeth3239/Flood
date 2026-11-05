import React from 'react';
import { useTranslation } from 'react-i18next';
import { Database, AlertTriangle, ShieldCheck } from 'lucide-react';
import { isMockDataEnabled } from '@/api';

interface DemoBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'page' | 'inline' | 'floating';
  className?: string;
  customText?: string;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({
  size = 'md',
  className = '',
  customText,
}) => {
  const { t } = useTranslation();
  const isMock = isMockDataEnabled();

  if (!isMock && !customText) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 ${className}`}
        title="Connected to production hydrometric stations"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <ShieldCheck className="w-3.5 h-3.5" />
        {t('app.liveBadge')}
      </span>
    );
  }

  const text = customText || t('app.demoBadge');

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wide uppercase rounded-md shadow-sm border bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 ${sizeClasses} ${className}`}
      title={t('app.demoBadgeDesc')}
      role="status"
      aria-label={`Data status: ${text}`}
    >
      <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      <span>{text}</span>
    </span>
  );
};

export const IllustrativeNotice: React.FC<{ text?: string; className?: string }> = ({
  text,
  className = '',
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 ${className}`}
    >
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{text || t('app.illustrative')}</span>
    </div>
  );
};
