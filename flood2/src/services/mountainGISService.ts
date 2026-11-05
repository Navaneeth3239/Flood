/**
 * Mountain GIS Service
 * Provides GeoJSON features for cyan river networks (18 features), roads and paths (142 features),
 * the marked geographic study area boundary polygon, and TIN terrain elevation contours.
 */

// Bounding box: [78.290, 30.118] to [78.345, 30.165]

/**
 * 1. Marked Geographic Area Boundary in GIS (15.4 sq km polygon)
 */
export const MARKED_STUDY_AREA_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'marked-mountain-basin',
        name: 'Marked Mountain Valley Hydrologic Study Area',
        areaSqKm: 15.4,
        catchmentBasin: 'Alaknanda-Ganges Mountain Gorge',
        strokeColor: '#00F0FF',
        strokeWidth: 3,
        fillColor: '#06B6D4',
        fillOpacity: 0.12,
        dashArray: '6, 6',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [78.290, 30.120],
            [78.315, 30.118],
            [78.342, 30.130],
            [78.345, 30.155],
            [78.330, 30.165],
            [78.305, 30.162],
            [78.292, 30.145],
            [78.290, 30.120],
          ],
        ],
      },
    },
  ],
};

/**
 * 2. Cyan River & Waterway Network (18 features: Main gorge channel, tributaries, torrents)
 */
export const MOUNTAIN_WATERWAYS_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // Main River Gorge Channel (prominent bright cyan)
    {
      type: 'Feature',
      properties: {
        id: 'waterway-main-01',
        name: 'Main Mountain River Gorge Channel',
        type: 'Perennial River',
        width: 6,
        color: '#00F0FF',
        glowColor: '#06B6D4',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.292, 30.118],
          [78.298, 30.124],
          [78.304, 30.130],
          [78.308, 30.135],
          [78.311, 30.140],
          [78.314, 30.145],
          [78.318, 30.150],
          [78.324, 30.156],
          [78.332, 30.162],
          [78.340, 30.165],
        ],
      },
    },
    // Left Bank Mountain Tributary 1
    {
      type: 'Feature',
      properties: {
        id: 'waterway-trib-01',
        name: 'Chandrabhaga Mountain Tributary',
        type: 'Tributary',
        width: 3.5,
        color: '#22D3EE',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.335, 30.142],
          [78.325, 30.139],
          [78.315, 30.137],
          [78.308, 30.135],
        ],
      },
    },
    // Right Bank Mountain Ravine Torrent
    {
      type: 'Feature',
      properties: {
        id: 'waterway-trib-02',
        name: 'Brahmapuri Ravine Stream',
        type: 'Mountain Torrent',
        width: 3.0,
        color: '#22D3EE',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.295, 30.152],
          [78.302, 30.148],
          [78.308, 30.144],
          [78.314, 30.145],
        ],
      },
    },
    // High-altitude glacial stream 1
    {
      type: 'Feature',
      properties: {
        id: 'waterway-trib-03',
        name: 'Neelkanth Gorge Torrent',
        type: 'Glacial Brook',
        width: 2.5,
        color: '#38BDF8',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [78.344, 30.158],
          [78.335, 30.154],
          [78.324, 30.156],
        ],
      },
    },
    // Additional drainage waterways to total 18 features
    ...Array.from({ length: 14 }).map((_, idx) => {
      const step = idx / 14;
      const startLng = 78.295 + step * 0.045;
      const startLat = 30.120 + ((idx % 2 === 0 ? 1 : -1) * (0.015 + (idx % 3) * 0.005));
      const midLng = startLng + 0.004;
      const midLat = (startLat + 30.138) / 2;
      const endLng = startLng + 0.008;
      const endLat = 30.138 + (idx % 4) * 0.002;

      return {
        type: 'Feature' as const,
        properties: {
          id: `waterway-drainage-${idx + 4}`,
          name: `Mountain Valley Drainage Branch #${idx + 1}`,
          type: 'Drainage Channel',
          width: 2.0,
          color: '#06B6D4',
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [Number(startLng.toFixed(5)), Number(startLat.toFixed(5))],
            [Number(midLng.toFixed(5)), Number(midLat.toFixed(5))],
            [Number(endLng.toFixed(5)), Number(endLat.toFixed(5))],
          ],
        },
      };
    }),
  ],
};

/**
 * 3. Roads and Mountain Paths (142 features)
 * Differentiates arterial valley highways, mountain switchback roads, and footpaths.
 */
function generateMountainRoadsAndPaths(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  // 1. National Highway Arterial (running parallel along riverbank)
  features.push({
    type: 'Feature',
    properties: {
      id: 'road-arterial-01',
      name: 'Rishikesh-Badrinath Mountain Highway (NH-58)',
      type: 'Major Arterial Highway',
      strokeColor: '#FBBF24', // Warm gold
      strokeWidth: 4.5,
      isMajor: true,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [78.294, 30.119],
        [78.300, 30.125],
        [78.306, 30.131],
        [78.310, 30.136],
        [78.313, 30.141],
        [78.316, 30.146],
        [78.320, 30.151],
        [78.326, 30.157],
        [78.334, 30.163],
      ],
    },
  });

  // 2. Secondary valley road (East bank)
  features.push({
    type: 'Feature',
    properties: {
      id: 'road-secondary-02',
      name: 'Swarg Ashram Valley Connector Road',
      type: 'Secondary Road',
      strokeColor: '#F8FAFC',
      strokeWidth: 3.0,
      isMajor: true,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [78.312, 30.133],
        [78.318, 30.138],
        [78.323, 30.144],
        [78.328, 30.149],
        [78.336, 30.155],
      ],
    },
  });

  // 3. Ram Jhula & Lakshman Jhula Suspension Bridges across gorge
  features.push({
    type: 'Feature',
    properties: {
      id: 'road-bridge-01',
      name: 'Ram Jhula Pedestrian Suspension Bridge',
      type: 'Bridge',
      strokeColor: '#38BDF8',
      strokeWidth: 3.5,
      isMajor: true,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [78.310, 30.134],
        [78.313, 30.136],
      ],
    },
  });
  features.push({
    type: 'Feature',
    properties: {
      id: 'road-bridge-02',
      name: 'Lakshman Jhula Suspension Bridge',
      type: 'Bridge',
      strokeColor: '#38BDF8',
      strokeWidth: 3.5,
      isMajor: true,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [78.316, 30.147],
        [78.320, 30.149],
      ],
    },
  });

  // 4. Procedurally generate remaining mountain paths, switchbacks, and village streets to reach 142 total
  const remainingCount = 142 - features.length;
  for (let i = 0; i < remainingCount; i++) {
    const seed = Math.sin(i * 37.123) * 10000;
    const r1 = seed - Math.floor(seed);
    const seed2 = Math.cos(i * 19.456) * 10000;
    const r2 = seed2 - Math.floor(seed2);

    const isSwitchback = i % 3 === 0;
    const isTrail = i % 2 === 0;

    const baseLng = 78.295 + r1 * 0.045;
    const baseLat = 30.122 + r2 * 0.040;

    // Switchback zig-zag coordinate line
    const coords: [number, number][] = [];
    coords.push([Number(baseLng.toFixed(5)), Number(baseLat.toFixed(5))]);

    if (isSwitchback) {
      coords.push([Number((baseLng + 0.003).toFixed(5)), Number((baseLat + 0.0015).toFixed(5))]);
      coords.push([Number((baseLng - 0.001).toFixed(5)), Number((baseLat + 0.003).toFixed(5))]);
      coords.push([Number((baseLng + 0.0025).toFixed(5)), Number((baseLat + 0.0045).toFixed(5))]);
    } else {
      coords.push([Number((baseLng + 0.002).toFixed(5)), Number((baseLat + 0.002).toFixed(5))]);
      coords.push([Number((baseLng + 0.004).toFixed(5)), Number((baseLat + 0.0035).toFixed(5))]);
    }

    features.push({
      type: 'Feature',
      properties: {
        id: `road-path-${i + 5}`,
        name: isTrail ? `Hillside Footpath #${i + 1}` : `Village Access Lane #${i + 1}`,
        type: isTrail ? 'Mountain Trail' : 'Settlement Lane',
        strokeColor: isTrail ? '#94A3B8' : '#CBD5E1',
        strokeWidth: isTrail ? 1.5 : 2.0,
        isMajor: false,
      },
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

export const MOUNTAIN_ROADS_GEOJSON = generateMountainRoadsAndPaths();

/**
 * 4. TIN Terrain Elevation Contour Lines (Hypsometric color-graded elevation bands)
 */
export const TIN_TERRAIN_CONTOURS: {
  elevation: number;
  label: string;
  color: string;
}[] = [
  { elevation: 350, label: '350m (River Valley Floor)', color: '#06B6D4' },
  { elevation: 450, label: '450m (Lower Terrace)', color: '#10B981' },
  { elevation: 600, label: '600m (Mid-Slope Ridge)', color: '#F59E0B' },
  { elevation: 800, label: '800m (Steep Mountain Ridge)', color: '#F97316' },
  { elevation: 1100, label: '1100m (High Crags)', color: '#EF4444' },
  { elevation: 1500, label: '1500m (Alpine Peak)', color: '#A855F7' },
];

/**
 * 5. SRTM30 Analysis Metadata
 */
export const SRTM30_METADATA = {
  name: 'SRTM 30m Global Digital Elevation Model (V3.0)',
  resolution: '1 arc-second (~30 meters)',
  source: 'NASA JPL / USGS Earth Resources Observation and Science',
  verticalDatum: 'EGM96 Geoid MSL',
  minElevationMsl: 348,
  maxElevationMsl: 1680,
  averageSlopeDegrees: 34.6,
  criticalRunoffVelocityMs: 4.8,
};

