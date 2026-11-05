import {
  processGeoTiffFile,
  getAllLayers,
  getLayerById,
  deleteLayer,
  toggleLayer,
} from '../services/terrainService.js';

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

