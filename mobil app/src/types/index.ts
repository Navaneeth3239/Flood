// Shared TypeScript definitions for Smart Flood Community Mobile App
// Aligned with web emergency response dashboard

export type IncidentStatus = 'unverified' | 'under_review' | 'verified' | 'rejected' | 'resolved';

export type ProblemType =
  | 'flooded_road'
  | 'water_entering_homes'
  | 'river_overflow'
  | 'embankment_damage'
  | 'landslide_erosion'
  | 'power_line_water'
  | 'person_needs_help'
  | 'blocked_drain'
  | 'other';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  address?: string;
  landmark?: string;
}

export interface Incident {
  id: string;
  clientId: string; // Idempotency key generated on client
  title: string;
  description: string;
  type: ProblemType;
  severity: SeverityLevel;
  location: LocationCoords;
  photos: string[];
  contact?: string;
  anonymous: boolean;
  language: string;
  status: IncidentStatus;
  createdAt: string; // ISO 8601
  updatedAt?: string;
  responderNotes?: string;
  timeline?: {
    status: IncidentStatus;
    timestamp: string;
    note?: string;
  }[];
  source: 'community' | 'sensor' | 'mock';
}

export type SyncState = 'draft' | 'pending_upload' | 'uploading' | 'synced' | 'failed';

export interface LocalReport {
  localId: string; // UUID v4 used as clientId
  serverId?: string; // Assigned once server confirms creation
  title: string;
  description: string;
  type: ProblemType;
  severity: SeverityLevel;
  location: LocationCoords;
  localPhotoUris: string[];
  uploadedPhotoUrls: string[];
  contact?: string;
  anonymous: boolean;
  language: string;
  status: IncidentStatus;
  syncStatus: SyncState;
  syncAttempts: number;
  lastSyncError?: string;
  createdAt: string;
  updatedAt?: string;
  responderNotes?: string;
  timeline?: {
    status: IncidentStatus;
    timestamp: string;
    note?: string;
  }[];
}

export type AlertSeverity = 'watch' | 'warning' | 'danger' | 'critical' | 'normal';

export interface Alert {
  id: string;
  stationId?: string;
  stationName?: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string; // ISO 8601
  status: 'active' | 'acknowledged' | 'resolved';
  location?: {
    latitude: number;
    longitude: number;
    areaName?: string;
  };
  distanceKm?: number;
  source: 'sensor' | 'official' | 'mock';
}

export interface EmergencyContact {
  id: string;
  name: string;
  department: string;
  phone: string;
  alternativePhone?: string;
  availableHours: string;
  isOfficial: boolean;
}

export interface SafetyInstruction {
  id: string;
  category: 'before' | 'during' | 'after';
  title: string;
  steps: string[];
  officialSource: string;
}

export interface SafetyInfo {
  emergencyContacts: EmergencyContact[];
  instructions: SafetyInstruction[];
  lastUpdated: string;
  isOfficial: boolean;
}

export interface DeviceRegistration {
  token: string;
  platform: 'android' | 'ios' | 'web';
  language: string;
  preferences: {
    minSeverity: AlertSeverity;
    radiusKm: number;
  };
}

export interface UserSettings {
  language: 'en' | 'ta' | 'hi' | 'ml';
  notificationsEnabled: boolean;
  minAlertSeverity: AlertSeverity;
  alertRadiusKm: number;
  defaultAnonymous: boolean;
  defaultContactPhone?: string;
  theme: 'system' | 'light' | 'dark';
}
