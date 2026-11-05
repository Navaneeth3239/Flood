import { SatelliteImage } from '@/types';

export const mockSatelliteImages: SatelliteImage[] = [
  {
    id: 'SAT-2026-DEL-01',
    title: 'Yamuna River Corridor - Delhi Urban Sprawl Inundation',
    date: '2026-10-28',
    source: 'Copernicus Sentinel-2 Multispectral & Synthetic Aperture Radar (SAR)',
    resolution: '10m / pixel (Bands B8 NIR & B4 Red NDVI Inundation Composite)',
    cloudCoverPercent: 12.4,
    // High quality satellite imagery comparison
    beforeUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    afterUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
    description: 'Pre-flood baseline captured during dry conditions contrasted with post-monsoon spillover along eastern Delhi low-lying riverbeds.',
    limitationsNotice: 'Optical bands partially obscured by localized cirrus clouds (12.4%). Shadow casting from dense urban structures along west bank may attenuate near-infrared surface water reflectance calibration.',
    bounds: [
      [28.55, 77.15],
      [28.75, 77.35],
    ],
  },
  {
    id: 'SAT-2026-ADY-02',
    title: 'Adyar Estuary & Chembarambakkam Catchment Flood Extent',
    date: '2026-10-25',
    source: 'ISRO RISAT-1A (Radar C-band SAR Flood Delineation)',
    resolution: '3m / pixel High-Resolution SpotLight Mode',
    cloudCoverPercent: 2.1,
    beforeUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    afterUrl: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?auto=format&fit=crop&w=1200&q=80',
    description: 'Synthetic Aperture Radar (SAR) backscatter analysis showing clear water boundaries along the Adyar river course and buffer marshes.',
    limitationsNotice: 'Radar specular reflection off smooth standing water provides high contrast, though dense mangrove canopy in tidal creek segments may shield under-canopy inundation.',
    bounds: [
      [12.95, 80.0],
      [13.1, 80.28],
    ],
  },
];
