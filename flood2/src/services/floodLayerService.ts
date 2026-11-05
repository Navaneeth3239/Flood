/**
 * Geospatial GIS Layer Service
 * Provides GeoJSON vector features for river networks, Sentinel-1 SAR observed
 * flood inundation masks, and emergency infrastructure.
 */

export interface SatelliteLayerMetadata {
  id: string;
  name: string;
  satellite: string;
  instrument: string;
  acquisitionDate: string;
  resolution: string;
  mode: string;
  polarization: string;
  description: string;
}

export const SENTINEL1_METADATA: SatelliteLayerMetadata = {
  id: 'sentinel1-yamuna-sar',
  name: 'Sentinel-1 Level-1 GRD Observed Flood Inundation Extent',
  satellite: 'Copernicus Sentinel-1C / 1A',
  instrument: 'C-band Synthetic Aperture Radar (SAR)',
  acquisitionDate: '2026-10-31 06:14 UTC',
  resolution: '10m spatial resolution',
  mode: 'Interferometric Wide (IW)',
  polarization: 'VV + VH backscatter thresholded (Otsu binarization)',
  description: 'Water-surface backscatter depression mapping showing active open water inundation in floodplain channels.',
};

/**
 * River network centerlines for Yamuna and Adyar basins
 */
export const RIVER_NETWORKS_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Yamuna River Main Channel (Delhi Corridor)',
        river: 'Yamuna',
        basin: 'Ganga-Yamuna Basin',
        strokeColor: '#0284C7',
        strokeWidth: 4,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [77.215, 28.750],
          [77.228, 28.718],
          [77.234, 28.692],
          [77.245, 28.674],
          [77.248, 28.663], // Old Railway Bridge Station
          [77.251, 28.650],
          [77.258, 28.625], // ITO Barrage
          [77.269, 28.590],
          [77.305, 28.540], // Okhla Barrage
          [77.320, 28.500],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Adyar River Channel (Chennai)',
        river: 'Adyar',
        basin: 'Adyar Basin',
        strokeColor: '#0284C7',
        strokeWidth: 4,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [80.057, 13.009], // Chembarambakkam outflow
          [80.098, 13.011],
          [80.135, 13.016],
          [80.170, 13.012], // Manapakkam
          [80.198, 13.014], // Jafferkhanpet
          [80.222, 13.018], // Saidapet Maraimalai Bridge
          [80.245, 13.015], // Kotturpuram
          [80.267, 13.013], // Adyar Estuary mouth
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Kaveri River Gorge (Biligundlu Reach)',
        river: 'Kaveri',
        basin: 'Kaveri Basin',
        strokeColor: '#0284C7',
        strokeWidth: 3.5,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [77.530, 12.190],
          [77.550, 12.175],
          [77.568, 12.164], // Biligundlu
          [77.590, 12.140],
          [77.620, 12.110],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Godavari River (Dowleswaram Delta Reach)',
        river: 'Godavari',
        basin: 'Godavari Basin',
        strokeColor: '#0284C7',
        strokeWidth: 4,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [81.740, 16.980],
          [81.760, 16.960],
          [81.776, 16.942], // Dowleswaram Barrage
          [81.800, 16.910],
          [81.830, 16.870],
        ],
      },
    },
  ],
};

/**
 * Observed Flood Inundation extent from Sentinel-1 SAR
 */
export const OBSERVED_FLOOD_EXTENT_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'sar-yamuna-khadar',
        name: 'Yamuna Khadar Lowland Inundation (Observed SAR)',
        sensor: 'Sentinel-1 SAR C-band',
        acquisitionTime: '2026-10-31 06:14 UTC',
        confidence: 0.94,
        areaSqKm: 8.4,
        fillColor: '#0284C7',
        strokeColor: '#0369A1',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [77.238, 28.685],
            [77.255, 28.680],
            [77.262, 28.665],
            [77.265, 28.648],
            [77.258, 28.630],
            [77.245, 28.642],
            [77.240, 28.662],
            [77.238, 28.685],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'sar-adyar-saidapet',
        name: 'Adyar River Embankment Spill Zone (Saidapet-Kotturpuram)',
        sensor: 'Sentinel-1 SAR C-band',
        acquisitionTime: '2026-10-30 18:22 UTC',
        confidence: 0.91,
        areaSqKm: 4.2,
        fillColor: '#0284C7',
        strokeColor: '#0369A1',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [80.210, 13.023],
            [80.235, 13.024],
            [80.252, 13.019],
            [80.248, 13.008],
            [80.225, 13.010],
            [80.212, 13.014],
            [80.210, 13.023],
          ],
        ],
      },
    },
  ],
};

/**
 * Historical benchmark high-water flood marks
 */
export const HISTORICAL_FLOOD_BENCHMARKS_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'July 2023 Historic Peak Inundation (208.66m Yamuna)',
        eventDate: 'July 13, 2023',
        description: 'All-time historical maximum flood mark recorded at Old Railway Bridge.',
        strokeColor: '#9333EA',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [77.232, 28.695],
            [77.265, 28.688],
            [77.275, 28.650],
            [77.265, 28.615],
            [77.240, 28.630],
            [77.232, 28.665],
            [77.232, 28.695],
          ],
        ],
      },
    },
  ],
};

/**
 * Emergency evacuation shelters and designated flood relief centers
 */
export const EMERGENCY_INFRASTRUCTURE = [
  {
    id: 'shelter-delhi-1',
    name: 'Mori Gate Community Relief Center',
    type: 'Emergency Shelter',
    capacity: 1200,
    latitude: 28.667,
    longitude: 77.228,
    elevationMeters: 214.5,
    distanceFromRiverKm: 1.8,
    status: 'Operational',
  },
  {
    id: 'shelter-delhi-2',
    name: 'Geeta Colony Sports Complex Relief Camp',
    type: 'Evacuation Camp',
    capacity: 2500,
    latitude: 28.654,
    longitude: 77.272,
    elevationMeters: 211.2,
    distanceFromRiverKm: 1.2,
    status: 'Active (Staged)',
  },
  {
    id: 'shelter-chennai-1',
    name: 'Saidapet Higher Secondary Relief Center',
    type: 'Emergency Shelter',
    capacity: 950,
    latitude: 13.024,
    longitude: 80.220,
    elevationMeters: 14.2,
    distanceFromRiverKm: 0.7,
    status: 'Operational',
  },
  {
    id: 'hospital-delhi-1',
    name: 'LNJP District Trauma Hospital',
    type: 'Critical Hospital',
    capacity: 2000,
    latitude: 28.637,
    longitude: 77.241,
    elevationMeters: 218.0,
    distanceFromRiverKm: 2.1,
    status: 'Clear / Flood-Safe',
  },
];

