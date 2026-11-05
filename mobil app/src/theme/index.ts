// Color palettes, spacing, and typography designed for accessibility, high-contrast readability in sunlight,
// and proper rendering of Indic scripts without font clipping.

export const Colors = {
  light: {
    primary: '#0284c7', // Sky-600
    primaryDark: '#0369a1',
    primaryLight: '#e0f2fe',
    accent: '#dc2626', // Emergency Red
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    border: '#cbd5e1',
    borderLight: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    danger: '#dc2626',
    warning: '#d97706',
    success: '#16a34a',
    info: '#2563eb',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    primary: '#38bdf8', // Sky-400
    primaryDark: '#0284c7',
    primaryLight: '#082f49',
    accent: '#ef4444',
    background: '#090d16',
    surface: '#131b2e',
    surfaceSecondary: '#1e293b',
    border: '#334155',
    borderLight: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
    info: '#60a5fa',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
  },
  severity: {
    low: {
      color: '#2563eb',
      bgLight: '#eff6ff',
      bgDark: '#172554',
      border: '#93c5fd',
    },
    medium: {
      color: '#d97706',
      bgLight: '#fffbeb',
      bgDark: '#451a03',
      border: '#fde68a',
    },
    high: {
      color: '#ea580c',
      bgLight: '#fff7ed',
      bgDark: '#431407',
      border: '#fed7aa',
    },
    urgent: {
      color: '#dc2626',
      bgLight: '#fef2f2',
      bgDark: '#450a0a',
      border: '#fca5a5',
    },
  },
  status: {
    unverified: {
      color: '#64748b',
      bgLight: '#f1f5f9',
      bgDark: '#1e293b',
      border: '#cbd5e1',
    },
    under_review: {
      color: '#0284c7',
      bgLight: '#e0f2fe',
      bgDark: '#082f49',
      border: '#7dd3fc',
    },
    verified: {
      color: '#16a34a',
      bgLight: '#f0fdf4',
      bgDark: '#052e16',
      border: '#86efac',
    },
    rejected: {
      color: '#b91c1c',
      bgLight: '#fef2f2',
      bgDark: '#450a0a',
      border: '#fca5a5',
    },
    resolved: {
      color: '#475569',
      bgLight: '#f8fafc',
      bgDark: '#1e293b',
      border: '#94a3b8',
    },
  },
  sync: {
    draft: '#64748b',
    pending_upload: '#d97706',
    uploading: '#0284c7',
    synced: '#16a34a',
    failed: '#dc2626',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Accessible minimum touch targets (at least 48dp)
export const TouchTarget = {
  minHeight: 48,
  minWidth: 48,
};

// Typography with extra vertical spacing to accommodate Malayalam, Tamil, and Devanagari descenders
export const Typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
  },
  lineHeights: {
    xs: 18,
    sm: 22,
    md: 26,
    lg: 30,
    xl: 32,
    xxl: 36,
    title: 40,
  },
};
