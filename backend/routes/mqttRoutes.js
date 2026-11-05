import express from 'express';
import {
  getMqttStatus,
  publishMqtt,
  toggleMqttSimulator,
} from '../services/mqttService.js';

const router = express.Router();

// GET /api/mqtt/status
router.get('/mqtt/status', (req, res) => {
  const status = getMqttStatus();
  res.json({
    success: true,
    status,
  });
});

// POST /api/mqtt/publish
router.post('/mqtt/publish', (req, res) => {
  const { topic, payload } = req.body;
  if (!topic || payload === undefined) {
    return res.status(400).json({ error: 'topic and payload are required' });
  }

  const success = publishMqtt(topic, payload);
  res.json({
    success,
    message: success ? `Message published to ${topic}` : 'MQTT client is disconnected',
  });
});

// POST /api/mqtt/simulator/toggle
router.post('/mqtt/simulator/toggle', (req, res) => {
  const { enable } = req.body || {};
  const active = toggleMqttSimulator(enable);
  res.json({
    success: true,
    simulatorActive: active,
    message: active ? 'MQTT IoT sensor telemetry stream started' : 'MQTT IoT simulation stopped',
  });
});

export default router;

