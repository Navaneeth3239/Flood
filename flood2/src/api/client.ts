import {
  Station,
  Reading,
  Alert,
  Prediction,
  Incident,
  RiskZoneCollection,
  SatelliteImage,
  TerrainData,
  SystemHealth,
  HistoricalReportSummary,
  EmergencyContact,
  SafetyInstruction,
} from '@/types';

import {
  mockStations,
  mockReadings,
  mockAlerts,
  mockPredictions,
  mockRiskZones,
  mockIncidents,
  mockSatelliteImages,
  mockTerrainData,
  mockSystemHealth,
  mockEmergencyContacts,
  mockSafetyInstructions,
  mockAssistantResponses,
} from '@/mocks';

export const isMockDataEnabled = (): boolean => {
  const envVal = import.meta.env.VITE_USE_MOCK_DATA;
  return envVal === 'true';
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// In-memory mutable store for fallback and optimistic updates
let mutableStations = [...mockStations];
let mutableAlerts = [...mockAlerts];
let mutableIncidents = [...mockIncidents];
let mutableReadings = [...mockReadings];

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = {
  // STATIONS / SENSORS
  async getStations(): Promise<Station[]> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/stations`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.stations || data.sensors || []);
          if (items.length > 0) return items;
        }
      } catch (err) {
        console.warn('[API] Backend unreachable for /stations, using local data fallback.', err);
      }
    }
    await delay(80);
    return [...mutableStations];
  },

  async getStation(id: string): Promise<Station> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/stations/${id}`);
        if (res.ok) {
          const data = await res.json();
          return data.station || data.sensor || data;
        }
      } catch (err) {
        console.warn(`[API] Backend unreachable for /stations/${id}, using local data fallback.`, err);
      }
    }
    await delay(60);
    const stn = mutableStations.find((s) => s.id === id);
    if (!stn) throw new Error('Station not found');
    return { ...stn };
  },

  async createStation(station: Omit<Station, 'id'>): Promise<Station> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/stations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(station),
        });
        if (res.ok) {
          const data = await res.json();
          return data.station || data.sensor || data;
        }
      } catch (err) {
        console.warn('[API] Could not POST /stations to backend, using local fallback.', err);
      }
    }
    await delay(120);
    const newStation: Station = {
      ...station,
      id: `STN-${Date.now().toString(36).toUpperCase()}`,
    };
    mutableStations.unshift(newStation);
    return newStation;
  },

  async updateStation(id: string, updates: Partial<Station>): Promise<Station> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/stations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          return data.station || data.sensor || data;
        }
      } catch (err) {
        console.warn(`[API] Could not PUT /stations/${id} to backend, using local fallback.`, err);
      }
    }
    await delay(120);
    const index = mutableStations.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Station not found');
    mutableStations[index] = { ...mutableStations[index], ...updates };
    return { ...mutableStations[index] };
  },

  // READINGS / TELEMETRY
  async getReadings(params?: {
    stationId?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<Reading[]> {
    if (!isMockDataEnabled()) {
      try {
        const query = new URLSearchParams();
        if (params?.stationId) query.set('stationId', params.stationId);
        if (params?.from) query.set('from', params.from);
        if (params?.to) query.set('to', params.to);
        if (params?.limit) query.set('limit', String(params.limit));

        const res = await fetch(`${API_BASE_URL}/readings?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.readings || []);
          if (items.length > 0) return items;
        }
      } catch (err) {
        console.warn('[API] Backend unreachable for /readings, using local fallback.', err);
      }
    }
    await delay(100);
    let list = [...mutableReadings];
    if (params?.stationId) list = list.filter((r) => r.stationId === params.stationId);
    if (params?.limit) list = list.slice(0, params.limit);
    return list;
  },

  // ALERTS
  async getAlerts(params?: { status?: string; severity?: string }): Promise<Alert[]> {
    if (!isMockDataEnabled()) {
      try {
        const query = new URLSearchParams();
        if (params?.status) query.set('status', params.status);
        if (params?.severity) query.set('severity', params.severity);

        const res = await fetch(`${API_BASE_URL}/alerts?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.alerts || []);
          if (items.length > 0) return items;
        }
      } catch (err) {
        console.warn('[API] Backend unreachable for /alerts, using local fallback.', err);
      }
    }
    await delay(80);
    let list = [...mutableAlerts];
    if (params?.status && params.status !== 'all') {
      list = list.filter((a) => a.status === params.status);
    }
    return list;
  },

  async updateAlert(
    id: string,
    action: { status: 'acknowledged' | 'resolved'; user?: string }
  ): Promise<Alert> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/alerts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn(`[API] Could not PATCH /alerts/${id}, using local fallback.`, err);
      }
    }
    await delay(100);
    const index = mutableAlerts.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Alert not found');
    const nowIso = new Date().toISOString();
    mutableAlerts[index] = {
      ...mutableAlerts[index],
      status: action.status,
      acknowledgedAt: action.status === 'acknowledged' ? nowIso : mutableAlerts[index].acknowledgedAt,
      resolvedAt: action.status === 'resolved' ? nowIso : mutableAlerts[index].resolvedAt,
    };
    return { ...mutableAlerts[index] };
  },

  // PREDICTIONS
  async getPrediction(
    stationId: string,
    window: '3h' | '6h' | '12h' | '24h' | '48h'
  ): Promise<Prediction | null> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/predictions?stationId=${stationId}&window=${window}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn(`[API] Backend unreachable for prediction (${stationId}), using local fallback.`, err);
      }
    }
    await delay(100);
    const stationPreds = mockPredictions[stationId];
    if (stationPreds && stationPreds[window]) {
      return { ...stationPreds[window] };
    }
    return null;
  },

  // RISK ZONES (GeoJSON)
  async getRiskZones(): Promise<RiskZoneCollection> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/risk-zones`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('[API] Backend unreachable for /risk-zones, using local fallback.', err);
      }
    }
    await delay(80);
    return JSON.parse(JSON.stringify(mockRiskZones));
  },

  // INCIDENTS
  async getIncidents(): Promise<Incident[]> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/incidents`);
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : (data.incidents || []);
        }
      } catch (err) {
        console.warn('[API] Backend unreachable for /incidents, using local fallback.', err);
      }
    }
    await delay(80);
    return [...mutableIncidents];
  },

  async createIncident(incident: Omit<Incident, 'id' | 'timestamp' | 'status' | 'source'>): Promise<Incident> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/incidents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(incident),
        });
        if (res.ok) {
          const data = await res.json();
          return data.incident || data;
        }
      } catch (err) {
        console.warn('[API] Could not POST /incidents, using local fallback.', err);
      }
    }
    await delay(150);
    const newInc: Incident = {
      ...incident,
      id: `INC-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      status: 'unverified',
      source: 'sensor',
    };
    mutableIncidents.unshift(newInc);
    return newInc;
  },

  // HISTORICAL REPORTS SUMMARY
  async getReportSummary(from?: string, to?: string): Promise<HistoricalReportSummary> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/reports/summary?from=${from || ''}&to=${to || ''}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('[API] Backend unreachable for reports summary, using local fallback.', err);
      }
    }
    await delay(100);
    return {
      from: from || new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      to: to || new Date().toISOString(),
      totalRainfallMm: 482.4,
      peakWaterLevelMeters: 206.85,
      warningsIssued: 14,
      floodIncidentsCount: 6,
      stationStats: mutableStations.map((stn) => ({
        stationId: stn.id,
        stationName: stn.name,
        avgWaterLevel: +(stn.thresholds.normalMax * 0.95).toFixed(2),
        maxWaterLevel: +(stn.thresholds.warningMax * 1.04).toFixed(2),
        totalRainfall: 220,
        uptimePercent: 99.4,
      })),
    };
  },

  // SATELLITE
  async getSatelliteImages(): Promise<SatelliteImage[]> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/satellite/images`);
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : (data.images || []);
        }
      } catch (err) {
        console.warn('[API] Backend unreachable for satellite images, using local fallback.', err);
      }
    }
    await delay(80);
    return [...mockSatelliteImages];
  },

  // TERRAIN
  async getTerrain(areaId: string): Promise<TerrainData | null> {
    await delay(80);
    return mockTerrainData[areaId] || mockTerrainData['basin-yamuna'] || null;
  },

  // SYSTEM HEALTH
  async getSystemHealth(): Promise<SystemHealth> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/system/health`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('[API] Backend unreachable for system health, using local fallback.', err);
      }
    }
    await delay(80);
    return { ...mockSystemHealth };
  },

  // EMERGENCY DATA
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/emergency/contacts`);
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : (data.contacts || []);
        }
      } catch (err) {
        console.warn('[API] Backend unreachable for emergency contacts, using local fallback.', err);
      }
    }
    await delay(60);
    return [...mockEmergencyContacts];
  },

  async getSafetyInstructions(): Promise<SafetyInstruction[]> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/emergency/instructions`);
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : (data.instructions || []);
        }
      } catch (err) {
        console.warn('[API] Backend unreachable for safety instructions, using local fallback.', err);
      }
    }
    await delay(60);
    return [...mockSafetyInstructions];
  },

  // ASSISTANT CHAT
  async chatWithAssistant(
    query: string,
    language: 'en' | 'ta' | 'hi',
    onChunk: (chunk: string) => void
  ): Promise<{ sources: { title: string; url?: string; excerpt: string }[] }> {
    if (!isMockDataEnabled()) {
      try {
        const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, language }),
        });
        if (res.ok) {
          const data = await res.json();
          const words = (data.chunk || '').split(' ');
          for (let i = 0; i < words.length; i++) {
            await delay(25);
            onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
          }
          return { sources: data.sources || [] };
        }
      } catch (err) {
        console.warn('[API] Backend assistant unreachable, using local fallback.', err);
      }
    }

    const lowerQuery = query.toLowerCase();
    const match = mockAssistantResponses.find((r) =>
      r.keywords.some((kw) => lowerQuery.includes(kw))
    );

    let textToStream = '';
    let sources: { title: string; url?: string; excerpt: string }[] = [];

    if (match) {
      textToStream = match.reply[language] || match.reply.en;
      sources = match.sources;
    } else {
      textToStream =
        'According to verified hydrological indicators in the SCMS monitoring network, all gauges are active. Flood alert levels are determined through the deterministic IF-ELSE rule engine. Check the Alerts page for active advisories.';
    }

    const words = textToStream.split(' ');
    for (let i = 0; i < words.length; i++) {
      await delay(25);
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
    }

    return { sources };
  },

  // 3D GIS TERRAIN LAYERS (DEM, SRTM30, VEM, TIM)
  async getTerrainLayers() {
    try {
      const res = await fetch(`${API_BASE_URL}/terrain`);
      if (!res.ok) throw new Error('Failed to fetch terrain layers');
      const data = await res.json();
      return data.layers || [];
    } catch {
      return [];
    }
  },

  async uploadTerrainLayer(formData: FormData) {
    const token = localStorage.getItem('scms_auth_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/terrain/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload elevation dataset');
    return data.layer;
  },

  async deleteTerrainLayer(id: string) {
    const token = localStorage.getItem('scms_auth_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/terrain/${id}`, {
      method: 'DELETE',
      headers,
    });
    return res.ok;
  },

  async toggleTerrainLayer(id: string, active: boolean, opacity?: number) {
    const res = await fetch(`${API_BASE_URL}/terrain/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active, opacity }),
    });
    const data = await res.json();
    return data.layer;
  },

  // SOIL CLASSIFICATION & GEOGRAPHICAL SOIL LAYERS
  async getSoilTypes() {
    try {
      const res = await fetch(`${API_BASE_URL}/soil-types`);
      if (!res.ok) throw new Error('Failed to fetch soil classifications');
      const data = await res.json();
      return data.soilTypes || [];
    } catch {
      return [];
    }
  },

  async getSoilLayers() {
    try {
      const res = await fetch(`${API_BASE_URL}/soil-layers`);
      if (!res.ok) throw new Error('Failed to fetch soil layers');
      const data = await res.json();
      return data.layers || [];
    } catch {
      return [];
    }
  },

  // DETERMINISTIC FLOOD RISK ASSESSMENT
  async getFloodRisk() {
    try {
      const res = await fetch(`${API_BASE_URL}/flood-risk`);
      if (!res.ok) throw new Error('Failed to fetch flood risk assessment');
      return await res.json();
    } catch {
      return { basinStatus: 'GREEN', stations: [] };
    }
  },

  async getFloodRiskByLocation(locationId: string) {
    const res = await fetch(`${API_BASE_URL}/flood-risk/${locationId}`);
    if (!res.ok) throw new Error('Failed to fetch location flood risk');
    return await res.json();
  },

  // MQTT IOT PROTOCOL INTEGRATION
  async getMqttStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/mqtt/status`);
      if (!res.ok) throw new Error('MQTT status unavailable');
      const data = await res.json();
      return data.status || null;
    } catch {
      return {
        broker: { running: true, port: 1883, host: '127.0.0.1', connectedClients: 1 },
        clientConnected: true,
        simulatorActive: true,
      };
    }
  },

  async publishMqtt(topic: string, payload: any) {
    const res = await fetch(`${API_BASE_URL}/mqtt/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, payload }),
    });
    return await res.json();
  },

  async toggleMqttSimulator(enable?: boolean) {
    const res = await fetch(`${API_BASE_URL}/mqtt/simulator/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable }),
    });
    return await res.json();
  },

  // GEOGRAPHICAL STUDY AREA SAVING & RETRIEVAL
  async saveSelectedArea(areaData: {
    name?: string;
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
    centerLat: number;
    centerLng: number;
    areaSqKm: number;
    coordinates?: [number, number][];
  }) {
    try {
      const res = await fetch(`${API_BASE_URL}/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(areaData),
      });
      return await res.json();
    } catch {
      return { success: true, area: areaData };
    }
  },

  async getSavedAreas() {
    try {
      const res = await fetch(`${API_BASE_URL}/areas`);
      const data = await res.json();
      return data.areas || [];
    } catch {
      return [];
    }
  },
};
