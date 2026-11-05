import { SeverityLevel } from '@/types';
import i18n from '@/i18n';
import { getLocale } from './date';

/**
 * Formats a metric value with unit.
 * If value is null, undefined, or NaN, returns "No data" (NEVER 0).
 */
export function formatMetric(
  value: number | null | undefined,
  unit: string = '',
  decimalPlaces: number = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return i18n.t('app.noData', { defaultValue: 'No data' });
  }
  const formattedNumber = new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);

  return `${formattedNumber} ${unit}`.trim();
}

export function formatWaterLevel(level: number | null | undefined): string {
  return formatMetric(level, 'm', 2);
}

export function formatRainfall(rainfall: number | null | undefined): string {
  return formatMetric(rainfall, 'mm/h', 1);
}

export function formatSoilMoisture(moisture: number | null | undefined): string {
  return formatMetric(moisture, '%', 0);
}

export function formatTemperature(temp: number | null | undefined): string {
  return formatMetric(temp, '°C', 1);
}

export function formatHumidity(humidity: number | null | undefined): string {
  return formatMetric(humidity, '%', 0);
}

export function formatBattery(battery: number | null | undefined): string {
  return formatMetric(battery, '%', 0);
}

export function getSeverityClasses(severity: SeverityLevel) {
  switch (severity) {
    case 'normal':
      return {
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        border: 'border-emerald-500',
        card: 'bg-emerald-500/5 border-emerald-200 dark:border-emerald-800/40',
        text: 'text-emerald-700 dark:text-emerald-400',
      };
    case 'watch':
      return {
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500',
        border: 'border-amber-500',
        card: 'bg-amber-500/5 border-amber-200 dark:border-amber-800/40',
        text: 'text-amber-700 dark:text-amber-400',
      };
    case 'warning':
      return {
        bg: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800',
        dot: 'bg-orange-500',
        border: 'border-orange-500',
        card: 'bg-orange-500/5 border-orange-200 dark:border-orange-800/40',
        text: 'text-orange-700 dark:text-orange-400',
      };
    case 'danger':
      return {
        bg: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
        badge: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800',
        dot: 'bg-red-500 animate-pulse',
        border: 'border-red-500',
        card: 'bg-red-500/5 border-red-200 dark:border-red-800/40',
        text: 'text-red-700 dark:text-red-400',
      };
    default:
      return {
        bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
        badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        dot: 'bg-slate-500',
        border: 'border-slate-500',
        card: 'bg-slate-500/5 border-slate-200 dark:border-slate-800',
        text: 'text-slate-700 dark:text-slate-400',
      };
  }
}
