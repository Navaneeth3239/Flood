import express from 'express';
import {
  getSoilTypes,
  createOrUpdateSoilType,
  getSoilLayers,
} from '../controllers/soilController.js';

const router = express.Router();

router.get('/soil-types', getSoilTypes);
router.post('/soil-types', createOrUpdateSoilType);
router.get('/soil-layers', getSoilLayers);

export default router;

