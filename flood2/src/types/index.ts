// Shared TypeScript definitions for Smart Flood Monitoring and Early Warning System

export type SeverityLevel = 'normal' | 'watch' | 'warning' | 'danger' | 'unknown';

export type StationStatus = 'online' | 'offline' | 'degraded';

export type ReadingTrend = 'rising' | 'falling' | 'steady';

export type DataSource = 'sensor' | 'mock';

export type DataQuality = 'good' | 'suspect' | 'degraded' | 'missing';

export interface Station {
  id: string;
  name: string;
  code: string;
  riverBasin: string;
  latitude: number;
  longitude: number;
  elevation: number; // meters above sea level
  status: StationStatus;
  batteryLevel: number; // percentage (0 - 100)
  signalRssi?: number; // dBm e.g. -75
  signalSnr?: number; // dB e.g. 8.5
  lastSeen: string; // ISO 8601
  firmwareVersion: string;
  sensorHealth: {
    waterLevelSensor: 'healthy' | 'degraded' | 'failed';
    rainGauge: 'healthy' | 'degraded' | 'failed';
    soilMoistureSensor: 'healthy' | 'degraded' | 'failed';
    weatherSensor: 'healthy' | 'degraded' | 'failed';
  };
  thresholds: {
    normalMax: number;
    watchMax: number;
    warningMax: number;
    dangerMax: number;
  };
}

export interface Reading {
  id: string;
  stationId: string;
  timestamp: string; // ISO 8601
  waterLevel: number | null; // meters
  rainfall: number | null; // mm/h
  soilMoisture: number | null; // % (0-100)
  temperature: number | null; // Celsius
  humidity: number | null; // % (0-100)
  flowRate: number | null; // m3/s
  trend: ReadingTrend;
  source: DataSource;
  dataQuality: DataQuality;
}

export interface Alert {
  id: string;
  stationId: string;
  stationName: string;
  severity: SeverityLevel;
  title: string;
  message: string;
  timestamp: string; // ISO 8601
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  source: DataSource;
}

export interface ContributingFactor {
  name: string;
  impact: number; // percentage (0 - 100)
  description: string;
}

export interface Prediction {
  id: string;
  stationId: string;
  stationName: string;
  predictionWindow: '3h' | '6h' | '12h' | '24h' | '48h';
  riskCategory: SeverityLevel;
  forecastPeriod: string;
  confidence?: number; // percentage 0-100, optional per data-honesty rule
  predictedWaterLevel: number; // meters
  currentWaterLevel: number; // meters
  contributingFactors: ContributingFactor[];
  timestamp: string;
  source: DataSource;
  disclaimer: string;
}

export type IncidentStatus = 'unverified' | 'under_review' | 'verified' | 'rejected';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: IncidentStatus;
  priority: IncidentPriority;
  timestamp: string;
  reportedBy?: string;
  reporterContact?: string;
  imageUrl?: string;
  source: DataSource;
}

export interface RiskZoneProperties {
  id: string;
  name: string;
  riskLevel: SeverityLevel;
  simulated: boolean; // Must be true for demo/simulated polygons
  description: string;
  affectedPopulationEstimated?: number;
  waterLevelAnomalyMeters?: number;
}

export interface RiskZoneFeature {
  type: 'Feature';
  properties: RiskZoneProperties;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface RiskZoneCollection {
  type: 'FeatureCollection';
  features: RiskZoneFeature[];
}

export interface SatelliteImage {
  id: string;
  title: string;
  date: string;
  source: string;
  resolution: string; // e.g. "10m (Sentinel-2)"
  cloudCoverPercent: number;
  beforeUrl: string;
  afterUrl: string;
  description: string;
  limitationsNotice: string;
  bounds: [[number, number], [number, number]]; // Leaflet latLng bounds
}

export interface TerrainData {
  areaId: string;
  name: string;
  simulated: boolean; // Must be true if generated/sample
  width: number;
  height: number;
  gridData: number[][]; // Elevation in meters
  minElevation: number;
  maxElevation: number;
  stationsInArea: {
    stationId: string;
    stationName: string;
    gridX: number;
    gridY: number;
    elevation: number;
    severity: SeverityLevel;
  }[];
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

export interface SystemHealth {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  sensorFailures: number;
  missingDataGaps: number;
  communicationLosses: number;
  lowBatteryCount: number;
  bufferedReadings: {
    pending: number;
    synced: number;
    failed: number;
  };
  components: {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    message: string;
    lastChecked: string;
  }[];
  lastSyncTimestamp: string;
}

export interface AssistantSource {
  title: string;
  url?: string;
  excerpt: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: AssistantSource[];
  isStreaming?: boolean;
}

export interface HistoricalReportSummary {
  from: string;
  to: string;
  totalRainfallMm: number;
  peakWaterLevelMeters: number;
  warningsIssued: number;
  floodIncidentsCount: number;
  stationStats: {
    stationId: string;
    stationName: string;
    avgWaterLevel: number;
    maxWaterLevel: number;
    totalRainfall: number;
    uptimePercent: number;
  }[];
}

export type ConnectionState = 'live' | 'reconnecting' | 'offline';

export interface WebSocketMessage {
  type: 'reading' | 'alert' | 'station_status';
  payload: any;
}
