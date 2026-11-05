import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import { initDatabase, connectMongo } from './config/db.js';
import { seedInitialData } from './config/seed.js';
import { setWsBroadcaster } from './controllers/sensorController.js';

import authRoutes from './routes/authRoutes.js';
import sensorRoutes from './routes/sensorRoutes.js';
import terrainRoutes from './routes/terrainRoutes.js';
import soilRoutes from './routes/soilRoutes.js';
import floodRiskRoutes from './routes/floodRiskRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import auxiliaryRoutes from './routes/auxiliaryRoutes.js';
import mqttRoutes from './routes/mqttRoutes.js';
import areaRoutes from './routes/areaRoutes.js';
import { startMqttBroker } from './services/mqttBroker.js';
import { initMqttClient, setMqttWsBroadcaster, toggleMqttSimulator } from './services/mqttService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database schema and initial seed data
initDatabase();
seedInitialData();
connectMongo();

// Enable CORS and JSON parsing
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static raster overlays and uploaded GeoTIFFs
app.use('/uploads', express.static(uploadsDir));

// WebSocket Broadcaster for real-time telemetry, risk changes, and alerts
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'WS_CONNECTED', message: 'Connected to SCMS 3D Digital Twin WebSocket Feed' }));

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('[WS-ERROR]', err);
    clients.delete(ws);
  });
});

function broadcastWs(data) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
setWsBroadcaster(broadcastWs);
setMqttWsBroadcaster(broadcastWs);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api', sensorRoutes);
app.use('/api', terrainRoutes);
app.use('/api', soilRoutes);
app.use('/api', floodRiskRoutes);
app.use('/api', alertRoutes);
app.use('/api', auxiliaryRoutes);
app.use('/api', mqttRoutes);
app.use('/api', areaRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Flood Prediction & 3D GIS Digital Twin Backend',
    activeWsClients: clients.size,
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API-ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

const PORT = parseInt(process.env.PORT, 10) || 8000;
const HOST = process.env.HOST || '127.0.0.1';

server.listen(PORT, HOST, async () => {
  console.log(`[SCMS-BACKEND] Server listening on http://${HOST}:${PORT}`);
  console.log(`[SCMS-BACKEND] WebSocket service ready on ws://${HOST}:${PORT}/ws`);

  // Start Embedded MQTT Broker and Client
  const mqttPort = parseInt(process.env.MQTT_PORT, 10) || 1883;
  await startMqttBroker(mqttPort);
  const { getBrokerStats } = await import('./services/mqttBroker.js');
  const activeBrokerPort = getBrokerStats().port || mqttPort;
  await initMqttClient(activeBrokerPort);
  // Auto-start background IoT simulation feed
  toggleMqttSimulator(true);
});


