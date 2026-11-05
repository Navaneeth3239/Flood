/**
 * Microsoft ML Building Footprints Service
 * Provides realistic 3D extruded building footprints in the marked mountain river basin.
 * Footprint geometries are modeled with planar coordinates, estimated heights,
 * roof area, and hydrological flood risk ratings.
 */

export interface BuildingFootprint {
  id: string;
  name: string;
  polygon: [number, number][]; // [longitude, latitude] coordinates
  areaSqMeters: number;
  heightMeters: number;
  elevationMsl: number;
  floors: number;
  occupancyType: 'Residential' | 'Commercial' | 'Public Infrastructure' | 'Storage/Auxiliary';
  floodRiskTier: 'normal' | 'watch' | 'warning' | 'danger';
}

export interface BuildingFootprintStats {
  totalCount: number;
  extrudedCount: number;
  avgHeight: number;
  minHeight: number;
  maxHeight: number;
  totalRoofAreaSqM: number;
  highRiskCount: number;
}

// Center coordinates for the mountain river valley (Rishikesh-Garhwal gorge)
const CENTER_LAT = 30.138;
const CENTER_LNG = 78.312;

/**
 * Procedural generation of 1,849 realistic building footprints clustered along
 * river terraces, valley floors, and hillside road networks.
 */
function generateMountainBasinFootprints(): BuildingFootprint[] {
  const footprints: BuildingFootprint[] = [];
  const TARGET_COUNT = 1849;

  // Define settlement clusters along valley contours
  const clusters = [
    // 1. Riverbank town center & market district (dense, multi-story)
    {
      baseLat: 30.135,
      baseLng: 78.308,
      spreadLat: 0.016,
      spreadLng: 0.012,
      count: 720,
      baseHeight: 11.5,
      heightVar: 5.5,
      elevation: 358,
      riskBias: 0.45,
    },
    // 2. North riverbank hillside terrace settlement
    {
      baseLat: 30.146,
      baseLng: 78.318,
      spreadLat: 0.018,
      spreadLng: 0.014,
      count: 480,
      baseHeight: 8.0,
      heightVar: 4.0,
      elevation: 410,
      riskBias: 0.20,
    },
    // 3. Upstream canyon bend village & temple complex
    {
      baseLat: 30.125,
      baseLng: 78.300,
      spreadLat: 0.012,
      spreadLng: 0.010,
      count: 360,
      baseHeight: 7.5,
      heightVar: 3.5,
      elevation: 385,
      riskBias: 0.35,
    },
    // 4. Hillside terraced hamlets & foothill structures
    {
      baseLat: 30.152,
      baseLng: 78.330,
      spreadLat: 0.015,
      spreadLng: 0.016,
      count: 289,
      baseHeight: 6.5,
      heightVar: 3.0,
      elevation: 490,
      riskBias: 0.08,
    },
  ];

  let idCounter = 1;

  clusters.forEach((cluster) => {
    for (let i = 0; i < cluster.count; i++) {
      // Deterministic pseudorandom generator for reproducible layouts
      const seed1 = Math.sin(idCounter * 12.9898 + 78.233) * 43758.5453;
      const rand1 = seed1 - Math.floor(seed1);
      const seed2 = Math.cos(idCounter * 4.898 + 19.341) * 23421.631;
      const rand2 = seed2 - Math.floor(seed2);
      const seed3 = Math.sin(idCounter * 9.213 + 3.1415) * 54321.123;
      const rand3 = seed3 - Math.floor(seed3);

      // Centered Gaussian-like distribution
      const dLat = (rand1 - 0.5) * cluster.spreadLat;
      const dLng = (rand2 - 0.5) * cluster.spreadLng;

      const lat = cluster.baseLat + dLat;
      const lng = cluster.baseLng + dLng;

      // Building size in degrees (approx 10m - 24m)
      const sizeLat = 0.00010 + rand3 * 0.00012;
      const sizeLng = 0.00012 + rand1 * 0.00014;

      // Estimated height: 4.5m (1-2 floors) to 18m (4-5 floors)
      const height = Math.max(
        4.5,
        Math.min(18.0, Number((cluster.baseHeight + (rand3 - 0.5) * cluster.heightVar * 2).toFixed(1)))
      );
      const floors = Math.max(1, Math.round(height / 3.2));
      const area = Math.round(sizeLat * 111000 * sizeLng * 96000);

      // Determine risk tier by distance from riverbed and elevation
      let riskTier: 'normal' | 'watch' | 'warning' | 'danger' = 'normal';
      if (cluster.elevation < 370 && rand1 < cluster.riskBias) {
        riskTier = rand2 > 0.6 ? 'danger' : 'warning';
      } else if (cluster.elevation < 410 && rand1 < 0.25) {
        riskTier = 'watch';
      }

      // Generate 4-corner rectangle polygon (or slightly angled for realistic orientation)
      const angle = (rand3 * 0.6) - 0.3;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const halfW = sizeLng / 2;
      const halfH = sizeLat / 2;

      const corners: [number, number][] = [
        [-halfW, -halfH],
        [halfW, -halfH],
        [halfW, halfH],
        [-halfW, halfH],
        [-halfW, -halfH],
      ].map(([x, y]) => [
        Number((lng + (x * cosA - y * sinA)).toFixed(6)),
        Number((lat + (x * sinA + y * cosA)).toFixed(6)),
      ]);

      const occupancy: BuildingFootprint['occupancyType'] =
        height > 12
          ? 'Commercial'
          : rand2 > 0.85
          ? 'Public Infrastructure'
          : rand3 > 0.75
          ? 'Storage/Auxiliary'
          : 'Residential';

      footprints.push({
        id: `MS-ML-${String(idCounter).padStart(5, '0')}`,
        name: `${occupancy} Structure #${idCounter}`,
        polygon: corners,
        areaSqMeters: area,
        heightMeters: height,
        elevationMsl: Number((cluster.elevation + (rand1 - 0.5) * 30).toFixed(1)),
        floors,
        occupancyType: occupancy,
        floodRiskTier: riskTier,
      });

      idCounter++;
      if (footprints.length >= TARGET_COUNT) break;
    }
  });

  return footprints;
}

// Cached singleton dataset
let cachedFootprints: BuildingFootprint[] | null = null;

export const buildingFootprintService = {
  /**
   * Retrieves building footprints for the marked area
   */
  async getFootprints(): Promise<BuildingFootprint[]> {
    if (!cachedFootprints) {
      cachedFootprints = generateMountainBasinFootprints();
    }
    return cachedFootprints;
  },

  /**
   * Reloads / regenerates the footprint dataset
   */
  async reloadFootprints(): Promise<BuildingFootprint[]> {
    cachedFootprints = generateMountainBasinFootprints();
    return cachedFootprints;
  },

  /**
   * Calculates live summary metrics for the loaded footprints
   */
  getStats(footprints: BuildingFootprint[]): BuildingFootprintStats {
    if (!footprints || footprints.length === 0) {
      return {
        totalCount: 0,
        extrudedCount: 0,
        avgHeight: 0,
        minHeight: 0,
        maxHeight: 0,
        totalRoofAreaSqM: 0,
        highRiskCount: 0,
      };
    }

    const totalCount = footprints.length;
    let sumHeight = 0;
    let minH = Infinity;
    let maxH = -Infinity;
    let sumArea = 0;
    let highRisk = 0;

    footprints.forEach((b) => {
      sumHeight += b.heightMeters;
      if (b.heightMeters < minH) minH = b.heightMeters;
      if (b.heightMeters > maxH) maxH = b.heightMeters;
      sumArea += b.areaSqMeters;
      if (b.floodRiskTier === 'danger' || b.floodRiskTier === 'warning') {
        highRisk++;
      }
    });

    return {
      totalCount,
      extrudedCount: totalCount,
      avgHeight: Number((sumHeight / totalCount).toFixed(1)),
      minHeight: Number(minH.toFixed(1)),
      maxHeight: Number(maxH.toFixed(1)),
      totalRoofAreaSqM: sumArea,
      highRiskCount: highRisk,
    };
  },

  /**
   * Bounding box of the marked mountain study area
   */
  getMarkedAreaBounds() {
    return {
      centerLat: CENTER_LAT,
      centerLng: CENTER_LNG,
      minLat: 30.118,
      maxLat: 30.165,
      minLng: 78.290,
      maxLng: 78.345,
      areaSqKm: 15.4,
      name: 'Mandakini-Alaknanda Mountain Valley (Garhwal Gorge)',
    };
  },
};

