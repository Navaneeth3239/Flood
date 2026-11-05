import { TerrainData } from '@/types';

export function generateSampleTerrainGrid(width = 64, height = 64): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const nx = (x / width) - 0.5;
      const ny = (y / height) - 0.5;
      
      // River valley carving through the center
      const riverDist = Math.abs(ny - Math.sin(nx * 3.5) * 0.22);
      const riverTrough = Math.pow(Math.min(1, riverDist * 4), 1.8);

      // Surrounding hills & ridges
      const hills =
        Math.sin(nx * 8) * Math.cos(ny * 7) * 22 +
        Math.cos(nx * 14 + ny * 11) * 12 +
        Math.sin(nx * 22 - ny * 18) * 6;

      const baseElevation = 180 + hills * riverTrough + riverDist * 60;
      row.push(+baseElevation.toFixed(1));
    }
    grid.push(row);
  }
  return grid;
}

export const mockTerrainData: Record<string, TerrainData> = {
  'basin-yamuna': {
    areaId: 'basin-yamuna',
    name: 'Yamuna River Basin & Northern Plains Fluvial Corridor',
    simulated: true, // Must be true per rule
    width: 64,
    height: 64,
    gridData: generateSampleTerrainGrid(64, 64),
    minElevation: 175,
    maxElevation: 250,
    stationsInArea: [
      {
        stationId: 'STN-YM-001',
        stationName: 'Yamuna - Old Railway Bridge',
        gridX: 32,
        gridY: 32,
        elevation: 204.0,
        severity: 'danger',
      },
      {
        stationId: 'STN-KV-001',
        stationName: 'Kaveri Upper Basin',
        gridX: 18,
        gridY: 22,
        elevation: 242.0,
        severity: 'normal',
      },
      {
        stationId: 'STN-ADY-001',
        stationName: 'Chembarambakkam Weir',
        gridX: 45,
        gridY: 40,
        elevation: 210.0,
        severity: 'warning',
      },
    ],
  },
};
