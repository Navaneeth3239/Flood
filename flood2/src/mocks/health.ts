import { SystemHealth } from '@/types';

export const mockSystemHealth: SystemHealth = {
  overallStatus: 'degraded',
  sensorFailures: 2, // STN-GD-001 rain gauge & STN-GD-002 offline sensors
  missingDataGaps: 7, // Identified intermittent packets
  communicationLosses: 1, // STN-GD-002 LoRa drop
  lowBatteryCount: 2, // STN-GD-001 (18%) and STN-GD-002 (4%)
  bufferedReadings: {
    pending: 14,
    synced: 1482,
    failed: 1,
  },
  components: [
    {
      name: 'Primary Ingestion Gateway (MQTT / HTTP)',
      status: 'healthy',
      message: 'Telemetry ingestion running nominally with avg latency 42ms',
      lastChecked: new Date(Date.now() - 30 * 1000).toISOString(),
    },
    {
      name: 'LoRaWAN Regional Gateway Matrix',
      status: 'warning',
      message: 'Gateway GW-AP-09 experiencing high packet packet drop rate (8.4%)',
      lastChecked: new Date(Date.now() - 60 * 1000).toISOString(),
    },
    {
      name: 'Hydrological ML Forecasting Service',
      status: 'healthy',
      message: 'Model inference pipeline active, 6h/12h/24h models serving predictions',
      lastChecked: new Date(Date.now() - 120 * 1000).toISOString(),
    },
    {
      name: 'Emergency Broadcast SMS / WebPush Gateway',
      status: 'healthy',
      message: 'National alert gateway links connected and standing by',
      lastChecked: new Date(Date.now() - 90 * 1000).toISOString(),
    },
    {
      name: 'Edge Station STN-GD-002 (Bhadrachalam Ghat)',
      status: 'error',
      message: 'Hardware communication timeout: Station offline for > 2 hours. Battery critically low.',
      lastChecked: new Date(Date.now() - 145 * 60 * 1000).toISOString(),
    },
  ],
  lastSyncTimestamp: new Date(Date.now() - 45 * 1000).toISOString(),
};
