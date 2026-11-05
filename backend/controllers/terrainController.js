import {
  processGeoTiffFile,
  getAllLayers,
  getLayerById,
  deleteLayer,
  toggleLayer,
} from '../services/terrainService.js';
import { db } from '../config/db.js';

export function getCachedTerrainTile(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, error: 'URL query parameter required.' });

    const row = db.prepare('SELECT content_type, data_base64 FROM terrain_cache WHERE url = ?').get(url);
    if (!row) {
      return res.status(404).json({ success: false, hit: false, message: 'Tile not cached.' });
    }

    const buffer = Buffer.from(row.data_base64, 'base64');
    res.setHeader('Content-Type', row.content_type || 'application/octet-stream');
    res.setHeader('X-Terrain-Cache', 'HIT');
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export function storeTerrainTile(req, res) {
  try {
    const { url, content_type, data_base64, size_bytes } = req.body;
    if (!url || !data_base64) {
      return res.status(400).json({ success: false, error: 'URL and data_base64 required.' });
    }

    const id = `tc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    db.prepare(`
      INSERT OR REPLACE INTO terrain_cache (id, url, content_type, data_base64, size_bytes, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(id, url, content_type || 'application/octet-stream', data_base64, size_bytes || data_base64.length);

    return res.status(201).json({ success: true, message: 'Terrain tile cached in database.', id });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export function clearTerrainCache(req, res) {
  try {
    const info = db.prepare('DELETE FROM terrain_cache').run();
    return res.status(200).json({
      success: true,
      message: '3D Terrain database cache cleared successfully.',
      deletedCount: info.changes,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function uploadTerrainLayer(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No elevation file uploaded. Please select a GeoTIFF (.tif, .tiff) file.',
      });
    }

    const { layer_type, name } = req.body;
    const allowedTypes = ['DEM', 'SRTM30', 'VEM', 'TIM'];

    if (!layer_type || !allowedTypes.includes(layer_type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid layer_type. Must be one of: ${allowedTypes.join(', ')}.`,
      });
    }

    const layer = await processGeoTiffFile(
      req.file.path,
      req.file.originalname,
      layer_type.toUpperCase(),
      name
    );

    return res.status(201).json({
      success: true,
      message: `${layer.layer_type} layer successfully processed and stored.`,
      layer,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: `GeoTIFF processing failed: ${err.message}`,
    });
  }
}

export function getTerrainLayers(req, res) {
  try {
    const layers = getAllLayers();
    return res.status(200).json({
      success: true,
      count: layers.length,
      layers,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export function getTerrainLayerById(req, res) {
  try {
    const { id } = req.params;
    const layer = getLayerById(id);
    if (!layer) {
      return res.status(404).json({ success: false, error: `Terrain layer ${id} not found.` });
    }
    return res.status(200).json({ success: true, layer });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export function deleteTerrainLayer(req, res) {
  try {
    const { id } = req.params;
    const deleted = deleteLayer(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: `Terrain layer ${id} not found.` });
    }
    return res.status(200).json({ success: true, message: `Layer ${id} deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export function updateTerrainLayerVisibility(req, res) {
  try {
    const { id } = req.params;
    const { active, opacity } = req.body;
    const updated = toggleLayer(id, active, opacity);
    if (!updated) {
      return res.status(404).json({ success: false, error: `Terrain layer ${id} not found.` });
    }
    return res.status(200).json({ success: true, layer: updated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

