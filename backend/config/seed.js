import { db } from './db.js';
import { evaluateFloodRisk } from '../services/floodPredictionService.js';

export function seedInitialData() {
  // 1. Seed Soil Types (Clay prioritized with configurable characteristics)
  const soilTypesCount = db.prepare('SELECT COUNT(*) as cnt FROM soil_types').get().cnt;
  if (soilTypesCount === 0) {
    console.log('[SEED] Seeding soil types (Clay, Sandy, Silty, Loamy, Peaty, Chalky)...');
    const insertSoil = db.prepare(`
      INSERT INTO soil_types (
        code, name, color, infiltration_rate_mm_h, water_holding_capacity_pct,
        runoff_coefficient, flood_risk_factor, description, properties
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSoil.run(
      'CLAY',
      'Clay Soil',
      '#D97706', // Amber-Orange
      1.5, // 1.5 mm/h low infiltration rate
      48.0, // High water holding capacity %
      0.78, // High surface runoff coefficient
      'High flood hazard: slow percolation causes fast surface accumulation during intense precipitation.',
      'Fine-textured mineral soil with high plasticity and expandable clay minerals. Susceptible to waterlogging.',
      JSON.stringify({
        plasticityIndex: 28,
        liquidLimit: 52,
        clayFractionPct: 55,
        permeabilityClass: 'Very Slow (< 2.5 mm/h)',
        usdaClassification: 'Heavy Clay (CH)',
      })
    );

    insertSoil.run(
      'SANDY',
      'Sandy Soil',
      '#FBBF24', // Light Yellow
      30.0,
      15.0,
      0.25,
      'Low flood hazard: high drainage and permeability absorb precipitation rapidly.',
      'Coarse-textured soil with high pore volume and fast percolation rate.',
      JSON.stringify({ permeabilityClass: 'Rapid (> 25 mm/h)', usdaClassification: 'Coarse Sand (SP)' })
    );

    insertSoil.run(
      'SILTY',
      'Silty Soil',
      '#A78BFA', // Purple
      8.0,
      35.0,
      0.55,
      'Moderate flood hazard: smooth texture prone to crusting and moderate runoff.',
      'Medium-textured mineral soil composed of silt grains.',
      JSON.stringify({ permeabilityClass: 'Moderate (5 - 15 mm/h)', usdaClassification: 'Silt (ML)' })
    );

    insertSoil.run(
      'LOAMY',
      'Loamy Soil',
      '#10B981', // Emerald
      12.5,
      32.0,
      0.45,
      'Moderate-Low flood hazard: balanced drainage and moisture retention.',
      'Optimal mix of sand, silt, and clay providing balanced agricultural drainage.',
      JSON.stringify({ permeabilityClass: 'Moderate to Rapid', usdaClassification: 'Loam' })
    );

    insertSoil.run(
      'PEATY',
      'Peaty Soil',
      '#78350F', // Dark Brown
      18.0,
      65.0,
      0.40,
      'High storage capacity when unsaturated, but prolonged rainfall leads to bogging.',
      'Organic-rich soil with high sponginess and moisture absorption.',
      JSON.stringify({ organicMatterPct: 60, usdaClassification: 'Histosol' })
    );

    insertSoil.run(
      'CHALKY',
      'Chalky Soil',
      '#94A3B8', // Slate Light
      22.0,
      20.0,
      0.30,
      'Low flood hazard: highly alkaline free-draining limestone/calcareous substrate.',
      'Shallow alkaline soil over limestone bedrock.',
      JSON.stringify({ calciumCarbonatePct: 40, usdaClassification: 'Rendzina' })
    );
  }

  // 2. Seed Geographical Soil Layer Polygon (e.g. Clay Monitoring Zone)
  const soilLayersCount = db.prepare('SELECT COUNT(*) as cnt FROM soil_layers').get().cnt;
  if (soilLayersCount === 0) {
    console.log('[SEED] Seeding geographical Clay soil layer...');
    const clayZoneGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            id: 'soil-zone-coimbatore-clay',
            name: 'Coimbatore Valley Heavy Clay Formation',
            soilType: 'Clay',
            color: '#D97706',
            infiltrationRate: '1.5 mm/h',
            waterHoldingCapacity: '48%',
            runoffCoefficient: '0.78',
            floodRiskRating: 'High Surface Ponding',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [76.880, 10.960],
                [77.080, 10.960],
                [77.120, 11.080],
                [76.920, 11.090],
                [76.880, 10.960],
              ],
            ],
          },
        },
      ],
    };

    db.prepare(`
      INSERT INTO soil_layers (id, name, soil_type_code, geojson, active, opacity, created_at)
      VALUES ('sl-clay-coimbatore', 'Coimbatore Mountain Valley Clay Zone', 'CLAY', ?, 1, 0.65, datetime('now'))
    `).run(JSON.stringify(clayZoneGeoJSON));
  }

  // 3. Seed Sensors with geographical coordinates
  const sensorsCount = db.prepare('SELECT COUNT(*) as cnt FROM sensors').get().cnt;
  if (sensorsCount === 0) {
    console.log('[SEED] Seeding initial IoT monitoring stations with coordinates...');
    const seedSensors = [
      {
        sensor_id: 'SENSOR_001',
        location_name: 'Coimbatore Monitoring Area',
        latitude: 11.0168,
        longitude: 76.9558,
        elevation: 411,
        soil_type: 'Clay',
        river_basin: 'Noyyal Basin',
        thresholds: { normalMax: 5.5, watchMax: 7.0, warningMax: 8.5, dangerMax: 10.0 },
      },
      {
        sensor_id: 'STN-KV-001',
        location_name: 'Kaveri Upper Basin - Biligundlu',
        latitude: 12.164,
        longitude: 77.568,
        elevation: 242,
        soil_type: 'Clay',
        river_basin: 'Kaveri Basin',
        thresholds: { normalMax: 6.5, watchMax: 8.0, warningMax: 9.5, dangerMax: 11.0 },
      },
      {
        sensor_id: 'STN-KV-002',
        location_name: 'Mettur Outflow Gorge',
        latitude: 11.795,
        longitude: 77.801,
        elevation: 215,
        soil_type: 'Loamy',
        river_basin: 'Kaveri Basin',
        thresholds: { normalMax: 7.0, watchMax: 8.5, warningMax: 10.0, dangerMax: 12.0 },
      },
      {
        sensor_id: 'STN-ADY-001',
        location_name: 'Saidapet Maraimalai Bridge',
        latitude: 13.021,
        longitude: 80.223,
        elevation: 8,
        soil_type: 'Clay',
        river_basin: 'Adyar Basin',
        thresholds: { normalMax: 4.0, watchMax: 5.5, warningMax: 7.0, dangerMax: 8.5 },
      },
      {
        sensor_id: 'STN-YM-001',
        location_name: 'Yamuna Old Railway Bridge',
        latitude: 28.665,
        longitude: 77.258,
        elevation: 205,
        soil_type: 'Silty',
        river_basin: 'Yamuna Basin',
        thresholds: { normalMax: 204.0, watchMax: 205.3, warningMax: 206.5, dangerMax: 207.0 },
      },
    ];

    const insertSensor = db.prepare(`
      INSERT INTO sensors (
        sensor_id, location_name, latitude, longitude, elevation, soil_type,
        river_basin, status, threshold_normal_max, threshold_watch_max,
        threshold_warning_max, threshold_danger_max, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    seedSensors.forEach((s) => {
      insertSensor.run(
        s.sensor_id,
        s.location_name,
        s.latitude,
        s.longitude,
        s.elevation,
        s.soil_type,
        s.river_basin,
        s.thresholds.normalMax,
        s.thresholds.watchMax,
        s.thresholds.warningMax,
        s.thresholds.dangerMax
      );
    });

    // 4. Seed initial sensor readings with geographical location fields
    console.log('[SEED] Seeding historical and latest sensor readings with coordinates...');
    const insertReading = db.prepare(`
      INSERT INTO sensor_readings (
        id, sensor_id, latitude, longitude, location_name, elevation, soil_type,
        soil_moisture, water_level, rainfall, temperature, humidity, timestamp,
        status, flood_risk_level, flood_risk_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `);

    const now = Date.now();
    seedSensors.forEach((s) => {
      for (let i = 12; i >= 0; i--) {
        const time = new Date(now - i * 3600000).toISOString();
        const baseLevel = (s.thresholds.normalMax + s.thresholds.watchMax) / 2;
        let wl = +(baseLevel + (s.sensor_id === 'STN-ADY-001' ? 1.6 : 0) + Math.sin(i / 2) * 0.4).toFixed(2);
        let rf = +(Math.max(5, (s.sensor_id === 'STN-ADY-001' ? 42 : 15) + Math.cos(i / 2) * 10)).toFixed(1);
        let sm = Math.min(100, Math.round(65 + Math.sin(i / 3) * 18));
        let temp = +(28.5 - Math.sin(i / 2) * 1.5).toFixed(1);
        let hum = Math.min(100, Math.round(75 + Math.cos(i / 2) * 12));

        const risk = evaluateFloodRisk({
          waterLevel: wl,
          rainfall: rf,
          soilMoisture: sm,
          soilType: s.soil_type,
          thresholds: s.thresholds,
        });

        insertReading.run(
          `rd-${s.sensor_id}-${i}`,
          s.sensor_id,
          s.latitude,
          s.longitude,
          s.location_name,
          s.elevation,
          s.soil_type,
          sm,
          wl,
          rf,
          temp,
          hum,
          time,
          risk.level,
          risk.color
        );
      }
    });

    // 5. Seed active alerts for higher risk stations
    db.prepare(`
      INSERT INTO alerts (
        id, sensor_id, location_name, severity, risk_level, title, message, timestamp, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 'active')
    `).run(
      'alt-seed-adyar-warning',
      'STN-ADY-001',
      'Saidapet Maraimalai Bridge',
      'high',
      'ORANGE',
      'High Flood Risk: Saidapet Maraimalai Bridge',
      'Water stage reached 7.1m exceeding warning threshold. Heavy precipitation (42 mm/h) on saturated Clay soil.'
    );
  }
}

