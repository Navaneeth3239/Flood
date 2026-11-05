import crypto from 'node:crypto';
import { db } from '../config/db.js';

// GET /api/alerts
export function getAlerts(req, res) {
  try {
    const { status, limit = 50 } = req.query;
    let query = 'SELECT * FROM alerts';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(Number(limit));

    const alerts = db.prepare(query).all(...params);
    return res.status(200).json({ success: true, count: alerts.length, alerts });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/alerts
export function createAlert(req, res) {
  try {
    const {
      sensor_id,
      location_name,
      severity = 'moderate',
      risk_level = 'YELLOW',
      title,
      message,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'title and message are required.' });
    }

    const alertId = `alt-${crypto.randomUUID()}`;
    const stmt = db.prepare(`
      INSERT INTO alerts (
        id, sensor_id, location_name, severity, risk_level, title, message, timestamp, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'active')
    `);

    stmt.run(
      alertId,
      sensor_id || null,
      location_name || 'Monitoring Sector',
      severity,
      risk_level,
      title,
      message
    );

    const created = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
    return res.status(201).json({ success: true, alert: created });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// PATCH /api/alerts/:id (Acknowledge or Resolve Alert)
export function updateAlert(req, res) {
  try {
    const { id } = req.params;
    const { status, user = 'Operator' } = req.body;

    const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: `Alert ${id} not found.` });
    }

    if (status === 'acknowledged') {
      db.prepare("UPDATE alerts SET status = 'acknowledged', acknowledged_at = datetime('now') WHERE id = ?").run(id);
    } else if (status === 'resolved') {
      db.prepare("UPDATE alerts SET status = 'resolved', resolved_at = datetime('now') WHERE id = ?").run(id);
    }

    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

