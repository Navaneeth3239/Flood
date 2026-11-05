import { db } from '../config/db.js';
import { evaluateFloodRisk } from '../services/floodPredictionService.js';

// GET /api/flood-risk
export function getFloodRiskAssessment(req, res) {
  try {
    const sensors = db.prepare("SELECT * FROM sensors WHERE status = 'active'").all();

    const stationAssessments = sensors.map((sensor) => {
      const latest = db.prepare(`
        SELECT * FROM sensor_readings 
        WHERE sensor_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `).get(sensor.sensor_id);

      const risk = evaluateFloodRisk({
        waterLevel: latest?.water_level || 3.0,
        rainfall: latest?.rainfall || 10.0,
        soilMoisture: latest?.soil_moisture || 55.0,
        soilType: sensor.soil_type,
        thresholds: {
          normalMax: sensor.threshold_normal_max,
          watchMax: sensor.threshold_watch_max,
          warningMax: sensor.threshold_warning_max,
          dangerMax: sensor.threshold_danger_max,
        },
      });

      return {
        sensorId: sensor.sensor_id,
        locationName: sensor.location_name,
        latitude: sensor.latitude,
        longitude: sensor.longitude,
        elevation: sensor.elevation,
        soilType: sensor.soil_type,
        waterLevel: latest?.water_level || null,
        rainfall: latest?.rainfall || null,
        soilMoisture: latest?.soil_moisture || null,
        riskLevel: risk.level,
        riskColor: risk.color,
        severity: risk.severity,
        label: risk.label,
        description: risk.description,
        score: risk.score,
        factors: risk.factors,
        timestamp: latest?.timestamp || new Date().toISOString(),
      };
    });

    // Overall basin risk determination (highest active severity)
    let highestRisk = 'GREEN';
    if (stationAssessments.some((s) => s.riskLevel === 'RED')) highestRisk = 'RED';
    else if (stationAssessments.some((s) => s.riskLevel === 'ORANGE')) highestRisk = 'ORANGE';
    else if (stationAssessments.some((s) => s.riskLevel === 'YELLOW')) highestRisk = 'YELLOW';

    return res.status(200).json({
      success: true,
      basinStatus: highestRisk,
      totalMonitoredStations: stationAssessments.length,
      methodology: 'Deterministic Multi-Parameter IF-ELSE Hydrological Rule Engine',
      stations: stationAssessments,
    });
  } catch (err) {
    console.error('[FLOOD-RISK-ERROR]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/flood-risk/:locationId
export function getFloodRiskByLocation(req, res) {
  try {
    const { locationId } = req.params;
    const sensor = db.prepare('SELECT * FROM sensors WHERE sensor_id = ?').get(locationId);

    if (!sensor) {
      return res.status(404).json({ success: false, error: `Location ${locationId} not found.` });
    }

    const latest = db.prepare(`
      SELECT * FROM sensor_readings 
      WHERE sensor_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `).get(locationId);

    const risk = evaluateFloodRisk({
      waterLevel: latest?.water_level || 3.0,
      rainfall: latest?.rainfall || 10.0,
      soilMoisture: latest?.soil_moisture || 55.0,
      soilType: sensor.soil_type,
      thresholds: {
        normalMax: sensor.threshold_normal_max,
        watchMax: sensor.threshold_watch_max,
        warningMax: sensor.threshold_warning_max,
        dangerMax: sensor.threshold_danger_max,
      },
    });

    return res.status(200).json({
      success: true,
      sensorId: sensor.sensor_id,
      locationName: sensor.location_name,
      coordinates: { latitude: sensor.latitude, longitude: sensor.longitude },
      elevation: sensor.elevation,
      soilType: sensor.soil_type,
      risk,
      latestReading: latest,
    });
  } catch (err) {
    console.error('[FLOOD-RISK-ERROR]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
