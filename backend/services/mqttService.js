import mqtt from 'mqtt';
import { db } from '../config/db.js';
import { evaluateFloodRisk } from './floodPredictionService.js';
import { getBrokerStats } from './mqttBroker.js';

let mqttClient = null;
let wsBroadcaster = null;
let simulatorTimer = null;
let simulatorActive = false;

export function setMqttWsBroadcaster(broadcaster) {
  wsBroadcaster = broadcaster;
}

export function initMqttClient(brokerPort = 1883) {
  return new Promise((resolve) => {
    const brokerUrl = `mqtt://127.0.0.1:${brokerPort}`;
    console.log(`[MQTT-CLIENT] Connecting to broker at ${brokerUrl}...`);

    mqttClient = mqtt.connect(brokerUrl, {
      clientId: `scms_backend_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 3000,
    });

    let resolved = false;

    mqttClient.on('connect', () => {
      console.log(`[MQTT-CLIENT] Connected successfully to MQTT Broker at ${brokerUrl}`);

      // Subscribe to standard SCMS IoT sensor topics
      mqttClient.subscribe('scms/sensors/+/readings', (err) => {
        if (!err) console.log('[MQTT-CLIENT] Subscribed to scms/sensors/+/readings');
      });
      mqttClient.subscribe('scms/sensors/+/telemetry', (err) => {
        if (!err) console.log('[MQTT-CLIENT] Subscribed to scms/sensors/+/telemetry');
      });
      mqttClient.subscribe('scms/alerts/#', (err) => {
        if (!err) console.log('[MQTT-CLIENT] Subscribed to scms/alerts/#');
      });

      if (!resolved) {
        resolved = true;
        resolve(true);
      }
    });

    mqttClient.on('message', async (topic, message) => {
      try {
        const payloadStr = message.toString();
        const data = JSON.parse(payloadStr);

        // Handle sensor reading topic: scms/sensors/<sensorId>/readings
        const match = topic.match(/^scms\/sensors\/([^/]+)\/(readings|telemetry)$/);
        if (match) {
          const sensorId = match[1];
          await handleIncomingMqttReading(sensorId, data);
        }
      } catch (err) {
        console.error('[MQTT-CLIENT] Error handling MQTT message on topic', topic, err.message);
      }
    });

    mqttClient.on('error', (err) => {
      console.error('[MQTT-CLIENT] MQTT Client error:', err.message);
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, 1500);
  });
}

async function handleIncomingMqttReading(sensorId, data) {
  // Query sensor metadata
  const sensor = db.prepare('SELECT * FROM sensors WHERE sensor_id = ?').get(sensorId);
  if (!sensor) return;

  const lat = data.latitude !== undefined ? Number(data.latitude) : sensor.latitude;
  const lon = data.longitude !== undefined ? Number(data.longitude) : sensor.longitude;
  const elev = data.elevation !== undefined ? Number(data.elevation) : sensor.elevation;
  const soilType = data.soil_type || sensor.soil_type || 'Clay';

  const waterLevel = Number(data.water_level) || 0;
  const rainfall = Number(data.rainfall) || 0;
  const soilMoisture = Number(data.soil_moisture) || 0;
  const temperature = Number(data.temperature) || 28;
  const humidity = Number(data.humidity) || 75;
  const timestamp = data.timestamp || new Date().toISOString();
  const status = data.status || 'active';

  // Evaluate deterministic IF-ELSE risk
  const risk = evaluateFloodRisk({
    water_level: waterLevel,
    rainfall,
    soil_moisture: soilMoisture,
    soil_type: soilType,
    elevation: elev,
    thresholds: {
      normal_max: sensor.threshold_normal_max,
      watch_max: sensor.threshold_watch_max,
      warning_max: sensor.threshold_warning_max,
      danger_max: sensor.threshold_danger_max,
    },
  });

  // Insert into SQLite
  const readingId = `rd-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const insertStmt = db.prepare(`
    INSERT INTO sensor_readings (
      id, sensor_id, latitude, longitude, location_name, elevation,
      soil_type, soil_moisture, water_level, rainfall, temperature,
      humidity, timestamp, status, flood_risk_level, flood_risk_color
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    readingId,
    sensorId,
    lat,
    lon,
    sensor.location_name,
    elev,
    soilType,
    soilMoisture,
    waterLevel,
    rainfall,
    temperature,
    humidity,
    timestamp,
    status,
    risk.level,
    risk.color
  );

  // Publish updated risk back via MQTT
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(
      `scms/sensors/${sensorId}/risk`,
      JSON.stringify({
        sensorId,
        riskLevel: risk.level,
        riskColor: risk.color,
        score: risk.score,
        factors: risk.factors,
        timestamp,
      })
    );
  }

  // Real-time WebSocket broadcast to 3D Cesium Twin & Mobile app
  if (wsBroadcaster) {
    wsBroadcaster({
      type: 'MQTT_SENSOR_UPDATE',
      sensorId,
      reading: {
        sensor_id: sensorId,
        latitude: lat,
        longitude: lon,
        elevation: elev,
        soil_type: soilType,
        water_level: waterLevel,
        rainfall,
        soil_moisture: soilMoisture,
        temperature,
        humidity,
        timestamp,
      },
      risk,
    });
  }
}

export function publishMqtt(topic, payload) {
  if (mqttClient && mqttClient.connected) {
    const dataStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    mqttClient.publish(topic, dataStr);
    return true;
  }
  return false;
}

export function toggleMqttSimulator(enable) {
  if (enable === undefined) {
    simulatorActive = !simulatorActive;
  } else {
    simulatorActive = !!enable;
  }

  if (simulatorActive && !simulatorTimer) {
    console.log('[MQTT-SIMULATOR] Starting live IoT telemetry simulation...');
    const sensorIds = ['SENSOR_001', 'SENSOR_002', 'SENSOR_003', 'SENSOR_004', 'SENSOR_005', 'SENSOR_006'];
    let idx = 0;

    simulatorTimer = setInterval(() => {
      const sId = sensorIds[idx % sensorIds.length];
      idx++;

      // Generate realistic natural fluctuations
      const baseWater = 2.2 + (Math.sin(Date.now() / 15000 + idx) * 1.8);
      const baseRain = 20 + Math.floor(Math.sin(Date.now() / 20000 + idx) * 35);
      const baseMoisture = 55 + Math.floor(Math.sin(Date.now() / 18000 + idx) * 30);

      const payload = {
        sensor_id: sId,
        water_level: parseFloat(Math.max(0.5, baseWater).toFixed(2)),
        rainfall: Math.max(0, baseRain),
        soil_moisture: Math.min(98, Math.max(25, baseMoisture)),
        temperature: Math.round(27 + Math.sin(idx) * 3),
        humidity: Math.round(75 + Math.sin(idx) * 12),
        timestamp: new Date().toISOString(),
        status: 'active',
      };

      publishMqtt(`scms/sensors/${sId}/readings`, payload);
    }, 3500);
  } else if (!simulatorActive && simulatorTimer) {
    console.log('[MQTT-SIMULATOR] Stopping live IoT telemetry simulation.');
    clearInterval(simulatorTimer);
    simulatorTimer = null;
  }

  return simulatorActive;
}

export function getMqttStatus() {
  const brokerStats = getBrokerStats();
  return {
    broker: brokerStats,
    clientConnected: !!mqttClient && mqttClient.connected,
    subscribedTopics: ['scms/sensors/+/readings', 'scms/sensors/+/telemetry', 'scms/alerts/#'],
    simulatorActive,
  };
}
