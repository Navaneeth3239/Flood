import express from 'express';
import {
  uploadTerrainLayer,
  getTerrainLayers,
  getTerrainLayerById,
  deleteTerrainLayer,
  updateTerrainLayerVisibility,
  getCachedTerrainTile,
  storeTerrainTile,
  clearTerrainCache,
} from '../controllers/terrainController.js';
import { uploadGeoTiff } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/terrain/cache', getCachedTerrainTile);
router.post('/terrain/cache', storeTerrainTile);
router.delete('/terrain/cache', clearTerrainCache);

router.post('/terrain/upload', uploadGeoTiff.single('file'), uploadTerrainLayer);
router.get('/terrain', getTerrainLayers);
router.get('/terrain/:id', getTerrainLayerById);
router.delete('/terrain/:id', deleteTerrainLayer);
router.patch('/terrain/:id/toggle', updateTerrainLayerVisibility);

export default router;

