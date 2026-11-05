import { Alert } from '@/types';

// Clearly marked mock alerts for prototype testing.
export const mockAlerts: Alert[] = [
  {
    id: 'ALT-2026-101',
    stationId: 'ST-001',
    stationName: 'Adyar River Basin Gauge #4',
    severity: 'danger',
    title: 'Flash Flood Danger Level Exceeded',
    message: 'Water level reached 8.42m (Danger threshold 7.80m). Residents in low-lying sectors of Kotturpuram and Saidapet advised to relocate to designated relief shelters.',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    status: 'active',
    location: {
      latitude: 13.018,
      longitude: 80.221,
      areaName: 'Adyar Basin Sector 3',
    },
    distanceKm: 0.8,
    source: 'mock',
  },
  {
    id: 'ALT-2026-102',
    stationId: 'ST-003',
    stationName: 'Cooum Sluice Gate Monitor',
    severity: 'warning',
    title: 'Rapid Water Rise Warning',
    message: 'Inflow rate 145 m³/s due to upstream cloudburst. Sluice gate #2 partially opened. Road underpasses may experience 1-2 feet inundation.',
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    status: 'active',
    location: {
      latitude: 13.045,
      longitude: 80.245,
      areaName: 'Cooum Central Zone',
    },
    distanceKm: 2.3,
    source: 'mock',
  },
  {
    id: 'ALT-2026-103',
    stationId: 'ST-007',
    stationName: 'Buckingham Canal Sensor B',
    severity: 'watch',
    title: 'High Tide & Runoff Advisory',
    message: 'Canal surface elevation 1.8m above mean sea level. Watch conditions active during peak tidal cycle between 21:00 and 01:00.',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    status: 'active',
    location: {
      latitude: 13.002,
      longitude: 80.252,
      areaName: 'South Coastal Corridor',
    },
    distanceKm: 3.5,
    source: 'mock',
  },
];
