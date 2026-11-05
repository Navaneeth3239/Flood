import { RiskZoneCollection } from '@/types';

export const mockRiskZones: RiskZoneCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'ZONE-DEL-01',
        name: 'Yamuna River Bank & Low-Lying Khadar (Delhi)',
        riskLevel: 'danger',
        simulated: true, // Must be true per data-honesty rule
        description: 'Vulnerable floodplain inundation buffer from Old Railway Bridge to ITO Barrage.',
        affectedPopulationEstimated: 35000,
        waterLevelAnomalyMeters: +1.4,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [77.230, 28.685],
            [77.265, 28.675],
            [77.268, 28.640],
            [77.245, 28.630],
            [77.228, 28.650],
            [77.230, 28.685],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZONE-ADY-01',
        name: 'Adyar River Corridor - Saidapet to Kotturpuram',
        riskLevel: 'warning',
        simulated: true,
        description: 'Simulated low-lying urban riparian corridor susceptible to reservoir sluice overflow.',
        affectedPopulationEstimated: 42000,
        waterLevelAnomalyMeters: +0.9,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [80.200, 13.025],
            [80.240, 13.020],
            [80.255, 13.005],
            [80.220, 13.008],
            [80.195, 13.015],
            [80.200, 13.025],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZONE-GD-01',
        name: 'Godavari Island Villages (Lanka Habitations)',
        riskLevel: 'watch',
        simulated: true,
        description: 'Agricultural sandbars and deltaic bifurcations subject to high-stage canal backwater.',
        affectedPopulationEstimated: 18000,
        waterLevelAnomalyMeters: +0.5,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [81.740, 16.960],
            [81.800, 16.940],
            [81.790, 16.910],
            [81.720, 16.930],
            [81.740, 16.960],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ZONE-KV-01',
        name: 'Biligundlu Gorge Inundation Zone',
        riskLevel: 'normal',
        simulated: true,
        description: 'Upstream canyon channel within standard seasonal embankments.',
        affectedPopulationEstimated: 2500,
        waterLevelAnomalyMeters: 0.0,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [77.550, 12.180],
            [77.585, 12.170],
            [77.575, 12.145],
            [77.545, 12.155],
            [77.550, 12.180],
          ],
        ],
      },
    },
  ],
};
