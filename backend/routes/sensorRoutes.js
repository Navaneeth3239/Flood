import express from 'express';
import {
  getSensors,
  createSensor,
  getSensorById,
  updateSensor,
  deleteSensor,
  addSensorReading,
  getSensorReadings,
  getReadingsBySensorId,
  getStationPrediction,
} from '../controllers/sensorController.js';

const router = express.Router();

// Sensors & Stations (Unified)
router.get('/sensors', getSensors);
router.post('/sensors', createSensor);
router.get('/sensors/:id', getSensorById);
router.put('/sensors/:id', updateSensor);
router.delete('/sensors/:id', deleteSensor);

router.get('/stations', getSensors);
router.post('/stations', createSensor);
router.get('/stations/:id', getSensorById);
router.put('/stations/:id', updateSensor);

// Sensor Readings
router.get('/sensor-readings', getSensorReadings);
router.post('/sensor-readings', addSensorReading);
router.get('/sensor-readings/:sensorId', getReadingsBySensorId);

router.get('/readings', getSensorReadings);
router.post('/readings', addSensorReading);

// Hydrological Predictions
router.get('/predictions', getStationPrediction);

export default router;
