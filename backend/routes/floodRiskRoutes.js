import express from 'express';
import {
  getFloodRiskAssessment,
  getFloodRiskByLocation,
} from '../controllers/floodRiskController.js';

const router = express.Router();

router.get('/flood-risk', getFloodRiskAssessment);
router.get('/flood-risk/:locationId', getFloodRiskByLocation);

export default router;

