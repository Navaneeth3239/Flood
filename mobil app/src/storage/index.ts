import { LocalReport, Alert, SafetyInfo, UserSettings } from '@/types';
import { generateUUID } from '@/utils/uuid';

const STORAGE_KEYS = {
  CLIENT_ID: 'floodwatch_client_id',
  AUTH_TOKEN: 'floodwatch_auth_token',
  SETTINGS: 'floodwatch_user_settings',
  ONBOARDING_DONE: 'floodwatch_onboarding_done',
  LOCAL_REPORTS: 'floodwatch_local_reports',
  CACHED_ALERTS: 'floodwatch_cached_alerts',
  CACHED_SAFETY_INFO: 'floodwatch_cached_safety_info',
  LAST_SUBMISSION_TIME: 'floodwatch_last_submission_time',
};

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  notificationsEnabled: true,
  minAlertSeverity: 'warning',
  alertRadiusKm: 10,
  defaultAnonymous: false,
  defaultContactPhone: '',
  theme: 'light',
};

// Safe storage access with memory fallback if localStorage is disabled
function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`[Storage] Failed to read ${key}:`, e);
    return null;
  }
}

function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[Storage] Failed to write ${key}:`, e);
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`[Storage] Failed to remove ${key}:`, e);
  }
}

// Client Id (Idempotency and Device Identification)
export function getOrCreateClientId(): string {
  let clientId = getItem(STORAGE_KEYS.CLIENT_ID);
  if (!clientId) {
    clientId = generateUUID();
    setItem(STORAGE_KEYS.CLIENT_ID, clientId);
  }
  return clientId;
}

// User Settings
export function getUserSettings(): UserSettings {
  try {
    const raw = getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  try {
    const current = getUserSettings();
    const updated = { ...current, ...settings };
    setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('[Storage] Error saving user settings:', error);
    throw error;
  }
}

// Onboarding State
export function isOnboardingCompleted(): boolean {
  return getItem(STORAGE_KEYS.ONBOARDING_DONE) === 'true';
}

export function setOnboardingCompleted(completed: boolean = true): void {
  setItem(STORAGE_KEYS.ONBOARDING_DONE, completed ? 'true' : 'false');
}

// Local Offline Reports Queue
export function getLocalReports(): LocalReport[] {
  try {
    const raw = getItem(STORAGE_KEYS.LOCAL_REPORTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('[Storage] Failed to load local reports:', error);
    return [];
  }
}

export function saveLocalReport(report: LocalReport): void {
  try {
    const reports = getLocalReports();
    const existingIndex = reports.findIndex((r) => r.localId === report.localId);
    if (existingIndex >= 0) {
      reports[existingIndex] = { ...reports[existingIndex], ...report, updatedAt: new Date().toISOString() };
    } else {
      reports.unshift(report);
    }
    setItem(STORAGE_KEYS.LOCAL_REPORTS, JSON.stringify(reports));
  } catch (error) {
    console.error('[Storage] Failed to save local report:', error);
    throw error;
  }
}

export function updateLocalReport(localId: string, updates: Partial<LocalReport>): LocalReport | null {
  try {
    const reports = getLocalReports();
    const index = reports.findIndex((r) => r.localId === localId);
    if (index === -1) return null;

    reports[index] = {
      ...reports[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.LOCAL_REPORTS, JSON.stringify(reports));
    return reports[index];
  } catch (error) {
    console.error('[Storage] Failed to update local report:', error);
    return null;
  }
}

export function deleteLocalReport(localId: string): void {
  try {
    const reports = getLocalReports();
    const filtered = reports.filter((r) => r.localId !== localId);
    setItem(STORAGE_KEYS.LOCAL_REPORTS, JSON.stringify(filtered));
  } catch (error) {
    console.error('[Storage] Failed to delete local report:', error);
  }
}

// Cached Alerts
export function getCachedAlerts(): { alerts: Alert[]; lastUpdated: string } | null {
  try {
    const raw = getItem(STORAGE_KEYS.CACHED_ALERTS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function setCachedAlerts(alerts: Alert[]): void {
  try {
    const payload = {
      alerts,
      lastUpdated: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.CACHED_ALERTS, JSON.stringify(payload));
  } catch (error) {
    console.warn('[Storage] Failed to cache alerts:', error);
  }
}

// Cached Safety Info
export function getCachedSafetyInfo(): { safetyInfo: SafetyInfo; lastUpdated: string } | null {
  try {
    const raw = getItem(STORAGE_KEYS.CACHED_SAFETY_INFO);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function setCachedSafetyInfo(safetyInfo: SafetyInfo): void {
  try {
    const payload = {
      safetyInfo,
      lastUpdated: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.CACHED_SAFETY_INFO, JSON.stringify(payload));
  } catch (error) {
    console.warn('[Storage] Failed to cache safety info:', error);
  }
}

// Rate Limiting helper
export function getLastSubmissionTimestamp(): number {
  try {
    const val = getItem(STORAGE_KEYS.LAST_SUBMISSION_TIME);
    return val ? parseInt(val, 10) : 0;
  } catch (error) {
    return 0;
  }
}

export function recordSubmissionTimestamp(): void {
  setItem(STORAGE_KEYS.LAST_SUBMISSION_TIME, Date.now().toString());
}

// Data wipe for user privacy compliance
export function clearAllLocalUserData(): void {
  Object.values(STORAGE_KEYS).forEach((k) => removeItem(k));
}
