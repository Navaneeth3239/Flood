import express from 'express';
import { getAlerts, createAlert, updateAlert } from '../controllers/alertController.js';

const router = express.Router();

router.get('/alerts', getAlerts);
router.post('/alerts', createAlert);
router.patch('/alerts/:id', updateAlert);

export default router;

