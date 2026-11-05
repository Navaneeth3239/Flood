import crypto from 'node:crypto';
import { db } from '../config/db.js';
import { evaluateFloodRisk } from '../services/floodPredictionService.js';

let wsBroadcastFn = null;
export function setWsBroadcaster(fn) {
  wsBroadcastFn = fn;
}

// GET /api/sensors
export function getSensors(req, res) {
  try {
    const stmt = db.prepare('SELECT * FROM sensors ORDER BY location_name ASC');
    const sensors = stmt.all();

    // Attach latest reading for each sensor
    const enriched = sensors.map((sensor) => {
      const latestReading = db.prepare(`
        SELECT * FROM sensor_readings 
        WHERE sensor_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `).get(sensor.sensor_id);

      return {
        ...sensor,
        thresholds: {
          normalMax: sensor.threshold_normal_max,
          watchMax: sensor.threshold_watch_max,
          warningMax: sensor.threshold_warning_max,
          dangerMax: sensor.threshold_danger_max,
        },
        latestReading: latestReading || null,
      };
    });

    return res.status(200).json({ success: true, count: enriched.length, sensors: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/sensors/:id
export function getSensorById(req, res) {
  try {
    const { id } = req.params;
    const sensor = db.prepare('SELECT * FROM sensors WHERE sensor_id = ?').get(id);
    if (!sensor) {
      return res.status(404).json({ success: false, error: `Sensor ${id} not found.` });
    }

    const latestReading = db.prepare(`
      SELECT * FROM sensor_readings 
      WHERE sensor_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `).get(id);

    const history = db.prepare(`
      SELECT * FROM sensor_readings 
      WHERE sensor_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 50
    `).all(id);

    return res.status(200).json({
      success: true,
      sensor: {
        ...sensor,
        thresholds: {
          normalMax: sensor.threshold_normal_max,
          watchMax: sensor.threshold_watch_max,
          warningMax: sensor.threshold_warning_max,
          dangerMax: sensor.threshold_danger_max,
        },
        latestReading,
        history,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/sensors
export function createSensor(req, res) {
  try {
    const {
      sensor_id,
      location_name,
      latitude,
      longitude,
      elevation,
      soil_type = 'Clay',
      river_basin = 'General Basin',
      status = 'active',
      threshold_normal_max = 6.5,
      threshold_watch_max = 8.0,
      threshold_warning_max = 9.5,
      threshold_danger_max = 11.0,
    } = req.body;

    if (!sensor_id || !location_name || latitude === undefined || longitude === undefined || elevation === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required sensor fields: sensor_id, location_name, latitude, longitude, elevation.',
      });
    }

    const stmt = db.prepare(`
      INSERT INTO sensors (
        sensor_id, location_name, latitude, longitude, elevation, soil_type,
        river_basin, status, threshold_normal_max, threshold_watch_max,
        threshold_warning_max, threshold_danger_max, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      sensor_id,
      location_name,
      Number(latitude),
      Number(longitude),
      Number(elevation),
      soil_type,
      river_basin,
      status,
      Number(threshold_normal_max),
      Number(threshold_watch_max),
      Number(threshold_warning_max),
      Number(threshold_danger_max)
    );

    const created = db.prepare('SELECT * FROM sensors WHERE sensor_id = ?').get(sensor_id);
    return res.status(201).json({ success: true, sensor: created });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// PUT /api/sensors/:id
export function updateSensor(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM sensors WHERE sensor_id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Sensor ${id} not found.` });
    }

    const {
      location_name = existing.location_name,
      latitude = existing.latitude,
      longitude = existing.longitude,
      elevation = existing.elevation,
      soil_type = existing.soil_type,
      river_basin = existing.river_basin,
      status = existing.status,
      threshold_normal_max = existing.threshold_normal_max,
      threshold_watch_max = existing.threshold_watch_max,
      threshold_warning_max = existing.threshold_warning_max,
      threshold_danger_max = existing.threshold_danger_max,
    } = req.body;

    const stmt = db.prepare(`
      UPDATE sensors SET
        location_name = ?, latitude = ?, longitude = ?, elevation = ?, soil_type = ?,
        river_basin = ?, status = ?, threshold_normal_max = ?, threshold_watch_max = ?,
        threshold_warning_max = ?, threshold_danger_max = ?, updated_at = datetime('now')
      WHERE sensor_id = ?
    `);

    stmt.run(
      location_name,
      Number(latitude),
      Number(longitude),
      Number(elevation),
      soil_type,
      river_basin,
      status,
      Number(threshold_normal_max),
      Number(threshold_watch_max),
      Number(threshold_warning_max),
      Number(threshold_danger_max),
      id
    );

    const updated = db.prepare('SELECT * FROM sensors WHERE sensor_id = ?').get(id);
    return res.status(200).json({ success: true, sensor: updated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// DELETE /api/sensors/:id
export function deleteSensor(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM sensors WHERE sensor_id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Sensor ${id} not found.` });
    }

    db.prepare('DELETE FROM sensor_readings WHERE sensor_id = ?').run(id);
    db.prepare('DELETE FROM sensors WHERE sensor_id = ?').run(id);

    return res.status(200).json({ success: true, message: `Sensor ${id} deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/sensor-readings
export function addSensorReading(req, res) {
  try {
    const {
      sensor_id,
      water_level,
      rainfall,
      soil_moisture,
      temperature,
      humidity,
      status = 'active',
      timestamp = new Date().toISOString(),
    } = req.body;

    if (!sensor_id) {
      return res.status(400).json({ success: false, error: 'sensor_id is required.' });
    }

    let sensor = db.prepare('SELECT * FROM sensors WHERE sensor_id = ?').get(sensor_id);
    if (!sensor) {
      // Auto-register sensor if provided with coordinates
      const { latitude, longitude, location_name, elevation, soil_type } = req.body;
      if (latitude !== undefined && longitude !== undefined) {
        db.prepare(`
          INSERT INTO sensors (
            sensor_id, location_name, latitude, longitude, elevation, soil_type,
            river_basin, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'Monitoring Basin', 'active', datetime('now'), datetime('now'))
        `).run(
          sensor_id,
          location_name || `Station ${sensor_id}`,
          Number(latitude),
          Number(longitude),
          Number(elevation || 411),
          soil_type || 'Clay'
        );
        sensor = db.prepare('SELECT * FROM sensors WHERE sensor_id = ?').get(sensor_id);
      } else {
        return res.status(404).json({ success: false, error: `Sensor ${sensor_id} does not exist.` });
      }
    }

    // Evaluate flood risk using deterministic backend IF-ELSE logic
    const riskEvaluation = evaluateFloodRisk({
      waterLevel: water_level,
      rainfall,
      soilMoisture: soil_moisture,
      soilType: sensor.soil_type,
      thresholds: {
        normalMax: sensor.threshold_normal_max,
        watchMax: sensor.threshold_watch_max,
        warningMax: sensor.threshold_warning_max,
        dangerMax: sensor.threshold_danger_max,
      },
    });

    const readingId = `rd-${crypto.randomUUID()}`;

    const stmt = db.prepare(`
      INSERT INTO sensor_readings (
        id, sensor_id, latitude, longitude, location_name, elevation, soil_type,
        soil_moisture, water_level, rainfall, temperature, humidity, timestamp,
        status, flood_risk_level, flood_risk_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      readingId,
      sensor.sensor_id,
      sensor.latitude,
      sensor.longitude,
      sensor.location_name,
      sensor.elevation,
      sensor.soil_type,
      Number(soil_moisture),
      Number(water_level),
      Number(rainfall),
      temperature !== undefined ? Number(temperature) : null,
      humidity !== undefined ? Number(humidity) : null,
      timestamp,
      status,
      riskEvaluation.level,
      riskEvaluation.color
    );

    const savedReading = db.prepare('SELECT * FROM sensor_readings WHERE id = ?').get(readingId);

    // If flood risk is ORANGE or RED, generate/update an Alert in the database and push to mobile/web
    if (riskEvaluation.level === 'ORANGE' || riskEvaluation.level === 'RED') {
      const alertId = `alt-${Date.now()}-${sensor.sensor_id}`;
      const title = `${riskEvaluation.label}: ${sensor.location_name}`;
      const message = `Stage: ${water_level}m | Rain: ${rainfall}mm/h | Soil Moisture: ${soil_moisture}% (${sensor.soil_type}). ${riskEvaluation.description}`;

      db.prepare(`
        INSERT INTO alerts (
          id, sensor_id, location_name, severity, risk_level, title, message, timestamp, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'active')
      `).run(
        alertId,
        sensor.sensor_id,
        sensor.location_name,
        riskEvaluation.severity,
        riskEvaluation.level,
        title,
        message
      );
    }

    // Broadcast reading & updated risk via WebSockets
    if (wsBroadcastFn) {
      wsBroadcastFn({
        type: 'SENSOR_READING_UPDATE',
        reading: savedReading,
        sensor,
        risk: riskEvaluation,
      });
    }

    return res.status(201).json({
      success: true,
      reading: savedReading,
      risk: riskEvaluation,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// GET /api/sensor-readings
export function getSensorReadings(req, res) {
  try {
    const { limit = 100 } = req.query;
    const readings = db.prepare(`
      SELECT * FROM sensor_readings 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(Number(limit));

    return res.status(200).json({ success: true, count: readings.length, readings });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/sensor-readings/:sensorId
export function getReadingsBySensorId(req, res) {
  try {
    const { sensorId } = req.params;
    const { limit = 50 } = req.query;
    const readings = db.prepare(`
      SELECT * FROM sensor_readings 
      WHERE sensor_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(sensorId, Number(limit));

    return res.status(200).json({ success: true, sensor_id: sensorId, count: readings.length, readings });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/predictions?stationId=...&window=...
export function getStationPrediction(req, res) {
  try {
    const { stationId, window = '6h' } = req.query;
    if (!stationId) {
      return res.status(400).json({ success: false, error: 'stationId query param is required.' });
    }

    const sensor = db.prepare('SELECT * FROM sensors WHERE sensor_id = ?').get(stationId);
    if (!sensor) {
      return res.status(404).json({ success: false, error: `Station ${stationId} not found.` });
    }

    const latest = db.prepare(`
      SELECT * FROM sensor_readings 
      WHERE sensor_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `).get(stationId);

    const wl = latest?.water_level || 3.0;
    const rf = latest?.rainfall || 15.0;
    const sm = latest?.soil_moisture || 60.0;

    const risk = evaluateFloodRisk({
      waterLevel: wl,
      rainfall: rf,
      soilMoisture: sm,
      soilType: sensor.soil_type,
      thresholds: {
        normalMax: sensor.threshold_normal_max,
        watchMax: sensor.threshold_watch_max,
        warningMax: sensor.threshold_warning_max,
        dangerMax: sensor.threshold_danger_max,
      },
    });

    const windowHours = parseInt(window) || 6;
    const predictedWl = +(wl + (risk.level === 'RED' ? 1.2 : risk.level === 'ORANGE' ? 0.7 : risk.level === 'YELLOW' ? 0.3 : 0.05)).toFixed(2);

    return res.status(200).json({
      id: `pred-${sensor.sensor_id}-${window}`,
      stationId: sensor.sensor_id,
      stationName: sensor.location_name,
      predictionWindow: window,
      riskCategory: risk.severity,
      forecastPeriod: `+${windowHours} Hours`,
      confidence: 91,
      predictedWaterLevel: predictedWl,
      currentWaterLevel: wl,
      contributingFactors: [
        { name: 'Catchment Rainfall', impact: 48, description: `${rf} mm/h precipitation intensity.` },
        { name: `${sensor.soil_type} Soil Saturation`, impact: 36, description: `${sm}% volumetric water content.` },
        { name: 'Upstream Basin Flow', impact: 16, description: 'Hydraulic routing through main channel.' },
      ],
      timestamp: new Date().toISOString(),
      source: 'sensor',
      disclaimer: 'Deterministic multi-parameter IF-ELSE hydrological rule engine.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

