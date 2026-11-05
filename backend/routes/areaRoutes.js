import express from 'express';
import { getSavedAreas, saveSelectedArea, deleteArea } from '../controllers/areaController.js';

const router = express.Router();

router.get('/areas', getSavedAreas);
router.post('/areas', saveSelectedArea);
router.delete('/areas/:id', deleteArea);

export default router;

