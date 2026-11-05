import i18n from '@/i18n';

export function getLocale(): string {
  const lng = i18n.resolvedLanguage || i18n.language || 'en';
  const localeMap: Record<string, string> = {
    ml: 'ml-IN',
    ta: 'ta-IN',
    hi: 'hi-IN',
    en: 'en-IN',
  };
  return localeMap[lng] || 'en-IN';
}

export function formatDate(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(getLocale(), {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '—';
  }
}

export function formatTime(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(getLocale(), {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '—';
  }
}

export function timeAgo(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Just now';
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    try {
      const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });
      if (diffSecs < 60) return rtf.format(-diffSecs, 'second');
      if (diffMins < 60) return rtf.format(-diffMins, 'minute');
      if (diffHours < 24) return rtf.format(-diffHours, 'hour');
      return rtf.format(-diffDays, 'day');
    } catch {
      if (diffSecs < 60) return `${diffSecs}s ago`;
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    }
  } catch {
    return '—';
  }
}

export function isDataStale(isoString: string | undefined | null, thresholdMinutes?: number): boolean {
  if (!isoString) return true;
  const minutes = thresholdMinutes ?? Number(import.meta.env.VITE_STALE_DATA_THRESHOLD_MINUTES || 15);
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMinutes = (now.getTime() - d.getTime()) / (1000 * 60);
    return diffMinutes > minutes;
  } catch {
    return true;
  }
}
