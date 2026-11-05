import { db } from '../config/db.js';

// GET /api/areas
export function getSavedAreas(req, res) {
  try {
    const areas = db.prepare('SELECT * FROM selected_areas ORDER BY created_at DESC LIMIT 50').all();
    const formatted = areas.map((a) => ({
      id: a.id,
      name: a.name,
      minLat: a.min_lat,
      maxLat: a.max_lat,
      minLng: a.min_lng,
      maxLng: a.max_lng,
      centerLat: a.center_lat,
      centerLng: a.center_lng,
      areaSqKm: a.area_sq_km,
      coordinates: JSON.parse(a.coordinates_json || '[]'),
      createdAt: a.created_at,
    }));

    res.json({
      success: true,
      count: formatted.length,
      areas: formatted,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/areas
export function saveSelectedArea(req, res) {
  try {
    const {
      name,
      minLat,
      maxLat,
      minLng,
      maxLng,
      centerLat,
      centerLng,
      areaSqKm,
      coordinates,
    } = req.body;

    if (
      minLat === undefined ||
      maxLat === undefined ||
      minLng === undefined ||
      maxLng === undefined ||
      centerLat === undefined ||
      centerLng === undefined
    ) {
      return res.status(400).json({ error: 'Missing required boundary coordinates' });
    }

    const id = `AREA_${Date.now()}_${Math.round(Math.random() * 1000)}`;
    const areaName = name || `Study Area ${centerLat.toFixed(3)}, ${centerLng.toFixed(3)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO selected_areas (
        id, name, min_lat, max_lat, min_lng, max_lng,
        center_lat, center_lng, area_sq_km, coordinates_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      areaName,
      Number(minLat),
      Number(maxLat),
      Number(minLng),
      Number(maxLng),
      Number(centerLat),
      Number(centerLng),
      Number(areaSqKm) || 0,
      JSON.stringify(coordinates || []),
      now
    );

    res.status(201).json({
      success: true,
      area: {
        id,
        name: areaName,
        minLat: Number(minLat),
        maxLat: Number(maxLat),
        minLng: Number(minLng),
        maxLng: Number(maxLng),
        centerLat: Number(centerLat),
        centerLng: Number(centerLng),
        areaSqKm: Number(areaSqKm) || 0,
        coordinates: coordinates || [],
        createdAt: now,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE /api/areas/:id
export function deleteArea(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM selected_areas WHERE id = ?').run(id);
    res.json({ success: true, message: `Area ${id} deleted` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

