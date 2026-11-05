import express from 'express';
import { uploadPhotoMiddleware } from '../middleware/uploadMiddleware.js';
import {
  getIncidents,
  createIncident,
  updateIncident,
  registerDevice,
  getReportSummary,
  getSystemHealth,
  getEmergencyContacts,
  getSafetyInstructions,
  getSatelliteImages,
  getRiskZonesGeoJson,
  chatWithAssistant,
} from '../controllers/auxiliaryController.js';

const router = express.Router();

router.post('/uploads/photo', uploadPhotoMiddleware.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No photo provided' });
  }
  const photoUrl = `/uploads/${req.file.filename}`;
  res.json({ url: photoUrl });
});

router.get('/incidents', getIncidents);
router.post('/incidents', createIncident);
router.patch('/incidents/:id', updateIncident);

router.post('/devices', registerDevice);
router.get('/reports/summary', getReportSummary);
router.get('/system/health', getSystemHealth);

router.get('/emergency/contacts', getEmergencyContacts);
router.get('/emergency/instructions', getSafetyInstructions);
router.get('/safety-info', (req, res) => {
  // Mobile app endpoint
  res.json({
    emergencyContacts: [
      { id: '1', department: 'NDRF Disaster Helpline', phone: '1078' },
      { id: '2', department: 'State Flood Control Room', phone: '1070' },
      { id: '3', department: 'Medical Emergency', phone: '108' },
    ],
    guidelines: [
      { id: '1', category: 'during', title: 'Avoid Flood Waters', description: 'Never cross flooded roads or bridges.' },
    ],
  });
});

router.get('/satellite/images', getSatelliteImages);
router.get('/risk-zones', getRiskZonesGeoJson);
router.post('/assistant/chat', chatWithAssistant);

export default router;
