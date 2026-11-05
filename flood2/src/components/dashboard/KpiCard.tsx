import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SeverityLevel } from '@/types';
import { getSeverityClasses } from '@/utils/formatters';
import { DemoBadge } from '@/components/common/DemoBadge';
import { isMockDataEnabled } from '@/api';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: 'rising' | 'falling' | 'steady';
  severity?: SeverityLevel;
  icon: LucideIcon;
  isMock?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  trend,
  severity = 'normal',
  icon: Icon,
  isMock = isMockDataEnabled(),
}) => {
  const sev = getSeverityClasses(severity);

  return (
    <div
      className={`relative p-5 rounded-2xl border transition-all duration-150 bg-white dark:bg-slate-800/90 shadow-xs hover:shadow-md ${sev.border}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className={`p-3 rounded-xl ${sev.bg} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 truncate">
          {trend === 'rising' && (
            <span className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              Rising
            </span>
          )}
          {trend === 'falling' && (
            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingDown className="w-3.5 h-3.5" />
              Receding
            </span>
          )}
          {trend === 'steady' && (
            <span className="inline-flex items-center gap-0.5 text-slate-500 font-semibold">
              <Minus className="w-3.5 h-3.5" />
              Steady
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>

        {isMock && <DemoBadge size="sm" />}
      </div>
    </div>
  );
};
