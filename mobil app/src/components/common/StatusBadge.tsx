import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, XCircle, HelpCircle } from 'lucide-react';
import { IncidentStatus } from '@/types';

interface StatusBadgeProps {
  status: IncidentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { t } = useTranslation();

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          label: t('myReports.filterVerified'),
          icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'under_review':
        return {
          label: t('myReports.filterReview'),
          icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
        };
      case 'rejected':
        return {
          label: t('myReports.filterRejected'),
          icon: <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        };
      case 'resolved':
        return {
          label: 'Resolved',
          icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        };
      case 'unverified':
      default:
        return {
          label: t('myReports.filterUnverified'),
          icon: <HelpCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider border rounded-md ${
        config.classes
      } ${size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
