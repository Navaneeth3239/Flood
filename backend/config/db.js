import { DatabaseSync } from 'node:sqlite';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = process.env.DATABASE_URL
  ? path.resolve(process.env.DATABASE_URL)
  : path.join(dataDir, 'flood_prediction.db');

export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode
db.exec('PRAGMA foreign_keys = ON;');

export async function connectMongo() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log('[MONGO-DB] Connected to MongoDB Atlas cluster');
    } catch (err) {
      console.warn('[MONGO-DB] MongoDB connection notice (using SQLite fallback):', err.message);
    }
  }
}

export const userMongooseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  age: { type: Number },
  dob: { type: String },
  phone: { type: String },
  address: { type: String },
  role: { type: String, default: 'citizen' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const MongoUser = mongoose.models.User || mongoose.model('User', userMongooseSchema);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS selected_areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      min_lat REAL NOT NULL,
      max_lat REAL NOT NULL,
      min_lng REAL NOT NULL,
      max_lng REAL NOT NULL,
      center_lat REAL NOT NULL,
      center_lng REAL NOT NULL,
      area_sq_km REAL NOT NULL,
      coordinates_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      age INTEGER,
      dob TEXT,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'citizen',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otps (
      phone TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sensors (
      sensor_id TEXT PRIMARY KEY,
      location_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      elevation REAL NOT NULL,
      soil_type TEXT NOT NULL DEFAULT 'Clay',
      river_basin TEXT,
      status TEXT DEFAULT 'active',
      threshold_normal_max REAL DEFAULT 6.5,
      threshold_watch_max REAL DEFAULT 8.0,
      threshold_warning_max REAL DEFAULT 9.5,
      threshold_danger_max REAL DEFAULT 11.0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sensor_readings (
      id TEXT PRIMARY KEY,
      sensor_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      location_name TEXT NOT NULL,
      elevation REAL NOT NULL,
      soil_type TEXT NOT NULL,
      soil_moisture REAL NOT NULL,
      water_level REAL NOT NULL,
      rainfall REAL NOT NULL,
      temperature REAL,
      humidity REAL,
      timestamp TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      flood_risk_level TEXT NOT NULL DEFAULT 'GREEN',
      flood_risk_color TEXT NOT NULL DEFAULT '#10B981',
      FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS terrain_layers (
      id TEXT PRIMARY KEY,
      layer_type TEXT NOT NULL, -- 'DEM', 'SRTM30', 'VEM', 'TIM'
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      west REAL NOT NULL,
      south REAL NOT NULL,
      east REAL NOT NULL,
      north REAL NOT NULL,
      resolution TEXT,
      min_elevation REAL,
      max_elevation REAL,
      crs TEXT,
      metadata TEXT,
      active INTEGER DEFAULT 1,
      opacity REAL DEFAULT 0.8,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS soil_types (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      infiltration_rate_mm_h REAL NOT NULL,
      water_holding_capacity_pct REAL NOT NULL,
      runoff_coefficient REAL NOT NULL,
      flood_risk_factor TEXT NOT NULL,
      description TEXT NOT NULL,
      properties TEXT
    );

    CREATE TABLE IF NOT EXISTS soil_layers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      soil_type_code TEXT NOT NULL,
      geojson TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      opacity REAL DEFAULT 0.65,
      created_at TEXT NOT NULL,
      FOREIGN KEY (soil_type_code) REFERENCES soil_types(code)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      sensor_id TEXT,
      location_name TEXT,
      severity TEXT NOT NULL, -- 'normal', 'moderate', 'high', 'critical'
      risk_level TEXT NOT NULL, -- 'GREEN', 'YELLOW', 'ORANGE', 'RED'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      acknowledged_at TEXT,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'flood',
      severity TEXT DEFAULT 'medium',
      description TEXT,
      latitude REAL,
      longitude REAL,
      address TEXT,
      landmark TEXT,
      photos TEXT,
      contact TEXT,
      anonymous INTEGER DEFAULT 0,
      status TEXT DEFAULT 'unverified',
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      token TEXT PRIMARY KEY,
      client_id TEXT,
      platform TEXT,
      language TEXT,
      registered_at TEXT NOT NULL
    );
  `);

  // Migrate users table columns if opened on an existing database
  try {
    const userCols = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
    if (!userCols.includes('email')) db.exec("ALTER TABLE users ADD COLUMN email TEXT;");
    if (!userCols.includes('password_hash')) db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT;");
    if (!userCols.includes('age')) db.exec("ALTER TABLE users ADD COLUMN age INTEGER;");
    if (!userCols.includes('dob')) db.exec("ALTER TABLE users ADD COLUMN dob TEXT;");
    if (!userCols.includes('address')) db.exec("ALTER TABLE users ADD COLUMN address TEXT;");
    if (!userCols.includes('name')) db.exec("ALTER TABLE users ADD COLUMN name TEXT;");
    if (!userCols.includes('phone')) db.exec("ALTER TABLE users ADD COLUMN phone TEXT;");
  } catch (err) {
    console.warn('[DB] User table migration notice:', err.message);
  }
}

