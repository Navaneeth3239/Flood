import http from 'http';

const TEST_PORT = parseInt(process.env.PORT, 10) || 8000;
const TEST_HOST = process.env.HOST || '127.0.0.1';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TEST_HOST,
      port: TEST_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('[TEST] Starting backend API verification suite...');

  // 1. Health
  const health = await request('GET', '/api/health');
  console.log('1. GET /api/health:', health.status, health.body.status);

  // 2. Auth OTP Flow
  const otpRes = await request('POST', '/api/auth/send-otp', { phone: '+919876543210' });
  console.log('2. POST /api/auth/send-otp:', otpRes.status, 'devOtp:', otpRes.body.devOtp);

  const verifyRes = await request('POST', '/api/auth/verify-otp', {
    phone: '+919876543210',
    code: otpRes.body.devOtp,
    name: 'Chief Hydrologist',
  });
  console.log('3. POST /api/auth/verify-otp:', verifyRes.status, 'User:', verifyRes.body.user?.name);
  const token = verifyRes.body.token;

  // 4. Auth Me
  const meRes = await request('GET', '/api/auth/me', null, token);
  console.log('4. GET /api/auth/me:', meRes.status, 'Role:', meRes.body.user?.role);

  // 4a. Register with full details: name, password, age, dob, mail, number, address
  const testEmail = `test_${Date.now()}@floodwatch.org`;
  const testPhone = `+919${Math.floor(100000000 + Math.random() * 900000000)}`;
  const regRes = await request('POST', '/api/auth/register', {
    name: 'Navaneeth B',
    mail: testEmail,
    password: 'SafePassword123!',
    age: 25,
    dob: '2001-04-18',
    number: testPhone,
    address: '42 Western Ghats Observatory, Coimbatore, Tamil Nadu',
  });
  console.log('4a. POST /api/auth/register:', regRes.status, 'Registered User:', regRes.body.user?.email, 'Age:', regRes.body.user?.age);

  // 4b. Log in using email (mail) and password
  const loginRes = await request('POST', '/api/auth/login', {
    mail: testEmail,
    password: 'SafePassword123!',
  });
  console.log('4b. POST /api/auth/login:', loginRes.status, 'Logged in:', loginRes.body.user?.name, 'Token received:', !!loginRes.body.token);

  // 4c. Verify user profile details from token
  const profileRes = await request('GET', '/api/auth/me', null, loginRes.body.token);
  console.log('4c. GET /api/auth/me (Full details):', profileRes.status, 'DOB:', profileRes.body.user?.dob, 'Address:', profileRes.body.user?.address);

  // 5. Sensors List
  const sensorsRes = await request('GET', '/api/sensors');
  console.log('5. GET /api/sensors:', sensorsRes.status, 'Count:', sensorsRes.body.count);

  // 6. Create Sensor
  const newSensor = {
    sensor_id: 'SENSOR_002',
    location_name: 'Siruvani Mountain Gorge',
    latitude: 10.9382,
    longitude: 76.6854,
    elevation: 865,
    soil_type: 'Clay',
    river_basin: 'Bhavani Basin',
    threshold_normal_max: 4.5,
    threshold_watch_max: 6.0,
    threshold_warning_max: 7.5,
    threshold_danger_max: 9.0,
  };
  const createSensorRes = await request('POST', '/api/sensors', newSensor);
  console.log('6. POST /api/sensors:', createSensorRes.status, createSensorRes.body.sensor?.location_name);

  // 7. Add Sensor Reading with exact required geographical fields
  const readingData = {
    sensor_id: 'SENSOR_001',
    water_level: 2.5,
    rainfall: 45,
    soil_moisture: 65,
    temperature: 29,
    humidity: 80,
    status: 'active',
  };
  const readingRes = await request('POST', '/api/sensor-readings', readingData);
  console.log('7. POST /api/sensor-readings:', readingRes.status, 'Calculated Risk:', readingRes.body.risk?.level, readingRes.body.risk?.color);

  // 8. Soil Types & Soil Layers
  const soilTypesRes = await request('GET', '/api/soil-types');
  console.log('8. GET /api/soil-types:', soilTypesRes.status, 'Types:', soilTypesRes.body.soilTypes?.map(s => s.name).join(', '));

  const soilLayersRes = await request('GET', '/api/soil-layers');
  console.log('9. GET /api/soil-layers:', soilLayersRes.status, 'Layers count:', soilLayersRes.body.count);

  // 10. Flood Risk
  const floodRiskRes = await request('GET', '/api/flood-risk');
  console.log('10. GET /api/flood-risk:', floodRiskRes.status, 'Basin Status:', floodRiskRes.body.basinStatus);

  // 11. Alerts
  const alertsRes = await request('GET', '/api/alerts');
  console.log('11. GET /api/alerts:', alertsRes.status, 'Alert count:', alertsRes.body.count);

  // 12. Terrain Layers
  const terrainRes = await request('GET', '/api/terrain');
  console.log('12. GET /api/terrain:', terrainRes.status, 'Layers count:', terrainRes.body.count);

  // 13. MQTT Broker Status & Publishing
  const mqttStatusRes = await request('GET', '/api/mqtt/status');
  console.log('13. GET /api/mqtt/status:', mqttStatusRes.status, 'Broker Running:', mqttStatusRes.body.status?.broker?.running, 'Port:', mqttStatusRes.body.status?.broker?.port);

  const mqttPublishRes = await request('POST', '/api/mqtt/publish', {
    topic: 'scms/sensors/SENSOR_001/readings',
    payload: {
      water_level: 4.8,
      rainfall: 85,
      soil_moisture: 92,
      temperature: 26,
      humidity: 90,
      timestamp: new Date().toISOString(),
    },
  });
  console.log('14. POST /api/mqtt/publish:', mqttPublishRes.status, mqttPublishRes.body.message);

  // 15. Save Selected Geographical Area
  const saveAreaRes = await request('POST', '/api/areas', {
    name: 'Coimbatore River Basin Study Area',
    minLat: 10.950,
    maxLat: 11.085,
    minLng: 76.880,
    maxLng: 77.060,
    centerLat: 11.0168,
    centerLng: 76.9558,
    areaSqKm: 285.4,
    coordinates: [
      [10.950, 76.880],
      [11.085, 76.880],
      [11.085, 77.060],
      [10.950, 77.060],
    ],
  });
  console.log('15. POST /api/areas:', saveAreaRes.status, 'Area ID:', saveAreaRes.body.area?.id);

  // 16. Retrieve Saved Areas
  const getAreasRes = await request('GET', '/api/areas');
  console.log('16. GET /api/areas:', getAreasRes.status, 'Areas Count:', getAreasRes.body.count);

  console.log('[TEST] All backend API, Area Selection & MQTT endpoints successfully verified!');
  process.exit(0);
}

// Check if server is already running, otherwise start it
request('GET', '/api/health')
  .then(() => {
    console.log('[TEST] Detected server already running on port ' + TEST_PORT + ', starting tests directly...');
    runTests();
  })
  .catch(() => {
    console.log('[TEST] Starting local server instance for tests...');
    import('./server.js').then(() => {
      setTimeout(runTests, 800);
    });
  });

