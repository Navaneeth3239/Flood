import { db } from '../config/db.js';

// GET /api/soil-types
export function getSoilTypes(req, res) {
  try {
    const soilTypes = db.prepare('SELECT * FROM soil_types ORDER BY name ASC').all();
    const formatted = soilTypes.map((st) => ({
      ...st,
      properties: st.properties ? JSON.parse(st.properties) : {},
    }));
    return res.status(200).json({ success: true, count: formatted.length, soilTypes: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/soil-types (allows configuring properties from actual data)
export function createOrUpdateSoilType(req, res) {
  try {
    const {
      code,
      name,
      color,
      infiltration_rate_mm_h,
      water_holding_capacity_pct,
      runoff_coefficient,
      flood_risk_factor,
      description,
      properties = {},
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'code and name are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO soil_types (
        code, name, color, infiltration_rate_mm_h, water_holding_capacity_pct,
        runoff_coefficient, flood_risk_factor, description, properties
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        name = excluded.name,
        color = excluded.color,
        infiltration_rate_mm_h = excluded.infiltration_rate_mm_h,
        water_holding_capacity_pct = excluded.water_holding_capacity_pct,
        runoff_coefficient = excluded.runoff_coefficient,
        flood_risk_factor = excluded.flood_risk_factor,
        description = excluded.description,
        properties = excluded.properties
    `);

    stmt.run(
      code,
      name,
      color || '#D97706',
      Number(infiltration_rate_mm_h || 1.5),
      Number(water_holding_capacity_pct || 48),
      Number(runoff_coefficient || 0.75),
      flood_risk_factor || 'High surface runoff when saturated; slow drainage.',
      description || 'Clay soil formation with dense fine particle structure.',
      JSON.stringify(properties)
    );

    const saved = db.prepare('SELECT * FROM soil_types WHERE code = ?').get(code);
    return res.status(200).json({
      success: true,
      soilType: {
        ...saved,
        properties: saved.properties ? JSON.parse(saved.properties) : {},
      },
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// GET /api/soil-layers
export function getSoilLayers(req, res) {
  try {
    const rows = db.prepare(`
      SELECT sl.*, st.name as soil_name, st.color as soil_color, 
             st.infiltration_rate_mm_h, st.runoff_coefficient, st.flood_risk_factor
      FROM soil_layers sl
      JOIN soil_types st ON sl.soil_type_code = st.code
      WHERE sl.active = 1
    `).all();

    const formatted = rows.map((r) => ({
      ...r,
      geojson: r.geojson ? JSON.parse(r.geojson) : null,
      active: Boolean(r.active),
    }));

    return res.status(200).json({ success: true, count: formatted.length, layers: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

