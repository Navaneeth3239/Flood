import { Reading } from '@/types';
import { mockStations } from './stations';

export function generateHistoricalReadings(): Reading[] {
  const readings: Reading[] = [];
  const now = Date.now();

  mockStations.forEach((station) => {
    // Generate readings for the past 24 hours at 1-hour intervals
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString();
      const sinOffset = Math.sin((24 - i) / 3);
      
      let baseWaterLevel = (station.thresholds.normalMax + station.thresholds.watchMax) / 2;
      let rainfall = Math.max(0, 15 + sinOffset * 12);
      let soilMoisture: number | null = Math.min(100, Math.max(30, Math.round(65 + sinOffset * 18)));
      let temp: number | null = +(28.5 - sinOffset * 2.2).toFixed(1);
      let humidity: number | null = Math.min(100, Math.max(45, Math.round(78 + sinOffset * 10)));
      let flowRate: number | null = Math.round(240 + sinOffset * 80);

      // Station specific conditions
      if (station.id === 'STN-ADY-001') {
        // High risk / near warning
        baseWaterLevel = station.thresholds.warningMax - 0.4 + sinOffset * 0.9;
        rainfall = Math.max(0, 42.5 + sinOffset * 20);
      } else if (station.id === 'STN-YM-001') {
        // Critical water level
        baseWaterLevel = station.thresholds.dangerMax - 0.3 + sinOffset * 0.6;
        rainfall = Math.max(0, 28.0 + sinOffset * 15);
      } else if (station.id === 'STN-GD-001') {
        // Faulty rain gauge (testing null data rule)
        rainfall = null as any;
        temp = null;
      } else if (station.id === 'STN-GD-002') {
        // Offline station: missing recent readings
        if (i < 3) continue;
      }

      const prevLevel = baseWaterLevel - 0.1;
      const trend = baseWaterLevel > prevLevel + 0.05 ? 'rising' : baseWaterLevel < prevLevel - 0.05 ? 'falling' : 'steady';

      readings.push({
        id: `RD-${station.id}-${24 - i}`,
        stationId: station.id,
        timestamp,
        waterLevel: baseWaterLevel !== null ? +baseWaterLevel.toFixed(2) : null,
        rainfall: rainfall !== null ? +rainfall.toFixed(1) : null,
        soilMoisture,
        temperature: temp,
        humidity,
        flowRate,
        trend,
        source: 'mock',
        dataQuality: station.id === 'STN-GD-001' ? 'degraded' : 'good',
      });
    }
  });

  return readings;
}

export const mockReadings: Reading[] = generateHistoricalReadings();

export function getLatestReadingForStation(stationId: string): Reading | undefined {
  const stationReadings = mockReadings
    .filter((r) => r.stationId === stationId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return stationReadings[0];
}
