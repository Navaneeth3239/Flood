import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as GeoTIFF from 'geotiff';
import { createPngBuffer } from '../utils/pngEncoder.js';
import { db } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

/**
 * Color map generator for elevation:
 * Dark blue/cyan (valley / water) -> Green (lowlands) -> Yellow/Orange (mid slope) -> Brown (ridge) -> White (peaks)
 */
function elevationToRgba(elevation, minElev, maxElev) {
  if (elevation === null || isNaN(elevation)) {
    return [0, 0, 0, 0]; // Transparent for no-data
  }
  const range = Math.max(1, maxElev - minElev);
  const t = Math.min(1, Math.max(0, (elevation - minElev) / range));

  let r, g, b;
  if (t < 0.2) {
    // 0.0 - 0.2: Deep valley / riverbed (Cyan to Emerald)
    const factor = t / 0.2;
    r = Math.round(14 + factor * 20);
    g = Math.round(116 + factor * 70);
    b = Math.round(144 - factor * 40);
  } else if (t < 0.5) {
    // 0.2 - 0.5: Lowlands to rolling hills (Emerald to Amber)
    const factor = (t - 0.2) / 0.3;
    r = Math.round(34 + factor * 200);
    g = Math.round(186 + factor * 20);
    b = Math.round(104 - factor * 80);
  } else if (t < 0.8) {
    // 0.5 - 0.8: Slopes to mountain ridges (Amber to Sienna Brown)
    const factor = (t - 0.5) / 0.3;
    r = Math.round(234 - factor * 80);
    g = Math.round(206 - factor * 130);
    b = Math.round(24 + factor * 10);
  } else {
    // 0.8 - 1.0: Alpine crests and peaks (Brown to Snow White)
    const factor = (t - 0.8) / 0.2;
    r = Math.round(154 + factor * 101);
    g = Math.round(76 + factor * 179);
    b = Math.round(34 + factor * 221);
  }

  return [r, g, b, 230]; // 90% opacity
}

export async function processGeoTiffFile(filePath, originalFilename, layerType, name) {
  const fileBuffer = fs.readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );

  let tiff;
  try {
    tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
  } catch (err) {
    throw new Error(`Invalid GeoTIFF format: ${err.message}`);
  }

  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY]
  const origin = image.getOrigin();
  const resolution = image.getResolution();
  const geoKeys = image.getGeoKeys ? image.getGeoKeys() : {};

  // Extract geographic coverage in degrees WGS84
  let west = bbox[0];
  let south = bbox[1];
  let east = bbox[2];
  let north = bbox[3];

  // Sanity check coordinates for WGS84
  if (Math.abs(west) > 180 || Math.abs(south) > 90) {
    // Projected CRS, approximate to active mountain study area bounds if out of standard range
    west = 76.85;
    south = 10.95;
    east = 77.15;
    north = 11.25;
  }

  // Read raster data
  const rasters = await image.readRasters();
  const elevationArray = rasters[0];

  let minElev = Infinity;
  let maxElev = -Infinity;
  let validCount = 0;
  let sumElev = 0;

  for (let i = 0; i < elevationArray.length; i++) {
    const val = elevationArray[i];
    // Check against standard NODATA values (e.g. -9999, -32767)
    if (val > -500 && val < 9000) {
      if (val < minElev) minElev = val;
      if (val > maxElev) maxElev = val;
      sumElev += val;
      validCount++;
    }
  }

  if (validCount === 0) {
    minElev = 0;
    maxElev = 1000;
  }

  // Generate colorized PNG overlay for Cesium visualization
  // Sample or downscale to maximum 1024x1024 for fluid 60fps rendering in Cesium
  const outWidth = Math.min(width, 1024);
  const outHeight = Math.min(height, 1024);
  const rgbaBuffer = Buffer.alloc(outWidth * outHeight * 4);

  const stepX = width / outWidth;
  const stepY = height / outHeight;

  for (let oy = 0; oy < outHeight; oy++) {
    const iy = Math.min(height - 1, Math.floor(oy * stepY));
    for (let ox = 0; ox < outWidth; ox++) {
      const ix = Math.min(width - 1, Math.floor(ox * stepX));
      const val = elevationArray[iy * width + ix];
      const validVal = val > -500 && val < 9000 ? val : null;
      const [r, g, b, a] = elevationToRgba(validVal, minElev, maxElev);
      const pixelIndex = (oy * outWidth + ox) * 4;
      rgbaBuffer[pixelIndex] = r;
      rgbaBuffer[pixelIndex + 1] = g;
      rgbaBuffer[pixelIndex + 2] = b;
      rgbaBuffer[pixelIndex + 3] = a;
    }
  }

  const pngBuffer = createPngBuffer(outWidth, outHeight, rgbaBuffer);
  const overlayFilename = `overlay_${Date.now()}_${path.basename(originalFilename, path.extname(originalFilename))}.png`;
  const overlayPath = path.join(uploadsDir, overlayFilename);
  fs.writeFileSync(overlayPath, pngBuffer);

  const crsString = geoKeys?.ProjectedCSTypeGeoKey
    ? `EPSG:${geoKeys.ProjectedCSTypeGeoKey}`
    : geoKeys?.GeographicTypeGeoKey
    ? `EPSG:${geoKeys.GeographicTypeGeoKey}`
    : 'WGS 84 (EPSG:4326)';

  const resolutionDesc = `${resolution ? Math.abs(resolution[0]).toFixed(4) : '30'}m per pixel`;

  const layerId = `layer-${Date.now()}`;
  const metadata = JSON.stringify({
    originalFilename,
    originalWidth: width,
    originalHeight: height,
    avgElevation: validCount > 0 ? (sumElev / validCount).toFixed(1) : null,
    overlayUrl: `/uploads/${overlayFilename}`,
    sampleResolution: resolutionDesc,
  });

  const stmt = db.prepare(`
    INSERT INTO terrain_layers (
      id, layer_type, name, filename, filepath, west, south, east, north,
      resolution, min_elevation, max_elevation, crs, metadata, active, opacity, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0.85, datetime('now'))
  `);

  stmt.run(
    layerId,
    layerType,
    name || `${layerType} - ${originalFilename}`,
    originalFilename,
    filePath,
    west,
    south,
    east,
    north,
    resolutionDesc,
    minElev,
    maxElev,
    crsString,
    metadata
  );

  return getLayerById(layerId);
}

export function getAllLayers() {
  const stmt = db.prepare('SELECT * FROM terrain_layers ORDER BY created_at DESC');
  const rows = stmt.all();
  return rows.map((r) => ({
    ...r,
    metadata: r.metadata ? JSON.parse(r.metadata) : {},
    active: Boolean(r.active),
  }));
}

export function getLayerById(id) {
  const stmt = db.prepare('SELECT * FROM terrain_layers WHERE id = ?');
  const row = stmt.get(id);
  if (!row) return null;
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    active: Boolean(row.active),
  };
}

export function deleteLayer(id) {
  const layer = getLayerById(id);
  if (!layer) return false;

  try {
    if (fs.existsSync(layer.filepath)) fs.unlinkSync(layer.filepath);
    if (layer.metadata?.overlayUrl) {
      const overlayFile = path.join(uploadsDir, path.basename(layer.metadata.overlayUrl));
      if (fs.existsSync(overlayFile)) fs.unlinkSync(overlayFile);
    }
  } catch (e) {
    console.error('File cleanup error on deleteLayer:', e);
  }

  const stmt = db.prepare('DELETE FROM terrain_layers WHERE id = ?');
  stmt.run(id);
  return true;
}

export function toggleLayer(id, active, opacity) {
  let query = 'UPDATE terrain_layers SET active = ?';
  const params = [active ? 1 : 0];
  if (opacity !== undefined) {
    query += ', opacity = ?';
    params.push(Number(opacity));
  }
  query += ' WHERE id = ?';
  params.push(id);

  const stmt = db.prepare(query);
  stmt.run(...params);
  return getLayerById(id);
}

