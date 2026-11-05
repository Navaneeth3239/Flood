import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { SeverityLevel, AlertSeverity } from '@/types';

interface SeverityBadgeProps {
  severity: SeverityLevel | AlertSeverity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const getDetails = () => {
    switch (severity) {
      case 'urgent':
      case 'critical':
      case 'danger':
        return {
          label: severity === 'urgent' ? 'URGENT' : severity.toUpperCase(),
          icon: <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
        };
      case 'high':
      case 'warning':
        return {
          label: severity === 'high' ? 'HIGH' : severity.toUpperCase(),
          icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
        };
      case 'medium':
      case 'watch':
        return {
          label: severity === 'medium' ? 'MEDIUM' : severity.toUpperCase(),
          icon: <AlertCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        };
      case 'low':
      case 'normal':
      default:
        return {
          label: severity === 'low' ? 'LOW' : severity.toUpperCase(),
          icon: <Info className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
          classes: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
        };
    }
  };

  const details = getDetails();

  return (
    <span
      className={`inline-flex items-center gap-1 font-extrabold uppercase tracking-wider border rounded-md ${
        details.classes
      } ${size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}
    >
      {details.icon}
      <span>{details.label}</span>
    </span>
  );
};
