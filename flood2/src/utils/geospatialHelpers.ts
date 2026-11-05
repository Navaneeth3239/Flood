/**
 * Geospatial and CesiumJS Helper Utilities
 * Provides camera presets, color mappers, SVG pin generator, and raycast sampling.
 */
import * as Cesium from 'cesium';
import { SeverityLevel } from '@/types';

export interface LocationPreset {
  id: string;
  name: string;
  riverBasin: string;
  latitude: number;
  longitude: number;
  height: number;
  pitch: number; // in degrees, e.g. -35 for angled 3D terrain profile
  heading: number; // in degrees
  description: string;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'mountain-valley',
    name: 'Mountain Valley Study Area (Garhwal Gorge)',
    riverBasin: 'Alaknanda-Ganges Basin',
    latitude: 30.138,
    longitude: 78.312,
    height: 2850,
    pitch: -34,
    heading: 38,
    description: 'Rugged Himalayan mountain terrain with 1,849 ML building footprints, cyan gorge rivers, and mountain roads.',
  },
  {
    id: 'yamuna',
    name: 'Yamuna River Corridor (Delhi)',
    riverBasin: 'Yamuna Basin',
    latitude: 28.663,
    longitude: 77.248,
    height: 3200,
    pitch: -32,
    heading: 15,
    description: 'Old Railway Bridge & floodplains prone to monsoon flooding from Hathnikund barrage discharges.',
  },
  {
    id: 'adyar',
    name: 'Adyar River Basin (Saidapet, Chennai)',
    riverBasin: 'Adyar Basin',
    latitude: 13.018,
    longitude: 80.222,
    height: 2800,
    pitch: -28,
    heading: 80,
    description: 'Urban estuarine floodplain vulnerable to cyclonic rainfall and Chembarambakkam reservoir surplus.',
  },
  {
    id: 'chembarambakkam',
    name: 'Chembarambakkam Reservoir',
    riverBasin: 'Adyar Basin',
    latitude: 13.009,
    longitude: 80.057,
    height: 3500,
    pitch: -35,
    heading: 45,
    description: 'Major stormwater storage reservoir governing downstream Adyar River discharge.',
  },
  {
    id: 'kaveri',
    name: 'Biligundlu Gorge (Kaveri River)',
    riverBasin: 'Kaveri Basin',
    latitude: 12.164,
    longitude: 77.568,
    height: 4800,
    pitch: -38,
    heading: 140,
    description: 'Steep river gorge and inter-state hydrometric gauging terminal with rugged topography.',
  },
  {
    id: 'godavari',
    name: 'Dowleswaram Barrage (Godavari River)',
    riverBasin: 'Godavari Basin',
    latitude: 16.942,
    longitude: 81.776,
    height: 4200,
    pitch: -30,
    heading: 195,
    description: 'Expansive deltaic barrage network handling massive monsoon peak discharges.',
  },
];

/**
 * Maps system severity level to Cesium Color
 */
export function getSeverityCesiumColor(severity: SeverityLevel, alpha = 1.0): Cesium.Color {
  switch (severity) {
    case 'danger':
      return Cesium.Color.fromCssColorString('#EF4444').withAlpha(alpha);
    case 'warning':
      return Cesium.Color.fromCssColorString('#F97316').withAlpha(alpha);
    case 'watch':
      return Cesium.Color.fromCssColorString('#F59E0B').withAlpha(alpha);
    case 'normal':
      return Cesium.Color.fromCssColorString('#10B981').withAlpha(alpha);
    default:
      return Cesium.Color.fromCssColorString('#6B7280').withAlpha(alpha);
  }
}

/**
 * Generates an SVG Data URI for crisp, high-DPI station pins
 */
export function createStationPinDataUri(severity: SeverityLevel, isSelected = false): string {
  let hexColor = '#10B981';
  let strokeColor = '#065F46';

  if (severity === 'danger') {
    hexColor = '#EF4444';
    strokeColor = '#991B1B';
  } else if (severity === 'warning') {
    hexColor = '#F97316';
    strokeColor = '#9A3412';
  } else if (severity === 'watch') {
    hexColor = '#F59E0B';
    strokeColor = '#92400E';
  } else if (severity === 'unknown') {
    hexColor = '#6B7280';
    strokeColor = '#374151';
  }

  const selectionHalo = isSelected
    ? `<circle cx="24" cy="20" r="19" fill="none" stroke="#38BDF8" stroke-width="4" opacity="0.9" />`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.45"/>
      </filter>
    </defs>
    ${selectionHalo}
    <g filter="url(#shadow)">
      <path d="M24 2C14.059 2 6 10.059 6 20c0 13.5 18 32 18 32s18-18.5 18-32c0-9.941-8.059-18-18-18z" 
            fill="${hexColor}" 
            stroke="${strokeColor}" 
            stroke-width="2.5"/>
      <circle cx="24" cy="20" r="7" fill="#FFFFFF"/>
      <circle cx="24" cy="20" r="4" fill="${strokeColor}"/>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Smoothly flies the Cesium camera to target coordinates
 */
export function flyCameraToLocation(
  viewer: Cesium.Viewer,
  latitude: number,
  longitude: number,
  height = 3000,
  pitchDegrees = -32,
  headingDegrees = 0,
  durationSeconds = 1.8
): void {
  if (!viewer || viewer.isDestroyed()) return;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
    orientation: {
      heading: Cesium.Math.toRadians(headingDegrees),
      pitch: Cesium.Math.toRadians(pitchDegrees),
      roll: 0.0,
    },
    duration: durationSeconds,
  });
}

