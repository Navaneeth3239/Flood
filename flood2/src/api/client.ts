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
  return envVal === 'true' || envVal === undefined || envVal === '';
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// In-memory mutable store for mock mode so edits/creations persist during session
let mutableStations = [...mockStations];
let mutableAlerts = [...mockAlerts];
let mutableIncidents = [...mockIncidents];
let mutableReadings = [...mockReadings];

// Helper to simulate slight network latency for realistic UX
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = {
  // STATIONS
  async getStations(): Promise<Station[]> {
    if (isMockDataEnabled()) {
      await delay(100);
      return [...mutableStations];
    }
    const res = await fetch(`${API_BASE_URL}/stations`);
    if (!res.ok) throw new Error(`Failed to fetch stations: ${res.statusText}`);
    return res.json();
  },

  async getStation(id: string): Promise<Station> {
    if (isMockDataEnabled()) {
      await delay(80);
      const stn = mutableStations.find((s) => s.id === id);
      if (!stn) throw new Error('Station not found');
      return { ...stn };
    }
    const res = await fetch(`${API_BASE_URL}/stations/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch station: ${res.statusText}`);
    return res.json();
  },

  async createStation(station: Omit<Station, 'id'>): Promise<Station> {
    if (isMockDataEnabled()) {
      await delay(150);
      const newStation: Station = {
        ...station,
        id: `STN-${Date.now().toString(36).toUpperCase()}`,
      };
      mutableStations.unshift(newStation);
      return newStation;
    }
    const res = await fetch(`${API_BASE_URL}/stations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(station),
    });
    if (!res.ok) throw new Error('Failed to create station');
    return res.json();
  },

  async updateStation(id: string, updates: Partial<Station>): Promise<Station> {
    if (isMockDataEnabled()) {
      await delay(150);
      const index = mutableStations.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Station not found');
      mutableStations[index] = { ...mutableStations[index], ...updates };
      return { ...mutableStations[index] };
    }
    const res = await fetch(`${API_BASE_URL}/stations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update station');
    return res.json();
  },

  // READINGS
  async getReadings(params?: {
    stationId?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<Reading[]> {
    if (isMockDataEnabled()) {
      await delay(120);
      let list = [...mutableReadings];
      if (params?.stationId) {
        list = list.filter((r) => r.stationId === params.stationId);
      }
      if (params?.from) {
        const fromTime = new Date(params.from).getTime();
        list = list.filter((r) => new Date(r.timestamp).getTime() >= fromTime);
      }
      if (params?.to) {
        const toTime = new Date(params.to).getTime();
        list = list.filter((r) => new Date(r.timestamp).getTime() <= toTime);
      }
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (params?.limit) {
        list = list.slice(0, params.limit);
      }
      return list;
    }
    const query = new URLSearchParams();
    if (params?.stationId) query.set('stationId', params.stationId);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE_URL}/readings?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch readings');
    return res.json();
  },

  // ALERTS
  async getAlerts(params?: { status?: string; severity?: string }): Promise<Alert[]> {
    if (isMockDataEnabled()) {
      await delay(100);
      let list = [...mutableAlerts];
      if (params?.status && params.status !== 'all') {
        list = list.filter((a) => a.status === params.status);
      }
      if (params?.severity && params.severity !== 'all') {
        list = list.filter((a) => a.severity === params.severity);
      }
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.severity) query.set('severity', params.severity);

    const res = await fetch(`${API_BASE_URL}/alerts?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async updateAlert(
    id: string,
    action: { status: 'acknowledged' | 'resolved'; user?: string }
  ): Promise<Alert> {
    if (isMockDataEnabled()) {
      await delay(120);
      const index = mutableAlerts.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Alert not found');
      const nowIso = new Date().toISOString();
      if (action.status === 'acknowledged') {
        mutableAlerts[index] = {
          ...mutableAlerts[index],
          status: 'acknowledged',
          acknowledgedAt: nowIso,
          acknowledgedBy: action.user || 'Operations Officer',
        };
      } else if (action.status === 'resolved') {
        mutableAlerts[index] = {
          ...mutableAlerts[index],
          status: 'resolved',
          resolvedAt: nowIso,
          resolvedBy: action.user || 'Operations Officer',
        };
      }
      return { ...mutableAlerts[index] };
    }
    const res = await fetch(`${API_BASE_URL}/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    if (!res.ok) throw new Error('Failed to update alert');
    return res.json();
  },

  // PREDICTIONS
  async getPrediction(
    stationId: string,
    window: '3h' | '6h' | '12h' | '24h' | '48h'
  ): Promise<Prediction | null> {
    if (isMockDataEnabled()) {
      await delay(150);
      const stationPreds = mockPredictions[stationId];
      if (stationPreds && stationPreds[window]) {
        return { ...stationPreds[window] };
      }
      // Return null to allow testing the "model unavailable" state!
      return null;
    }
    const res = await fetch(`${API_BASE_URL}/predictions?stationId=${stationId}&window=${window}`);
    if (res.status === 404 || res.status === 503) return null;
    if (!res.ok) throw new Error('Failed to fetch prediction');
    return res.json();
  },

  // RISK ZONES (GeoJSON)
  async getRiskZones(): Promise<RiskZoneCollection> {
    if (isMockDataEnabled()) {
      await delay(120);
      return JSON.parse(JSON.stringify(mockRiskZones));
    }
    const res = await fetch(`${API_BASE_URL}/risk-zones`);
    if (!res.ok) throw new Error('Failed to fetch risk zones GeoJSON');
    return res.json();
  },

  // INCIDENTS
  async getIncidents(): Promise<Incident[]> {
    if (isMockDataEnabled()) {
      await delay(100);
      return [...mutableIncidents].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }
    const res = await fetch(`${API_BASE_URL}/incidents`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async createIncident(incident: Omit<Incident, 'id' | 'timestamp' | 'status' | 'source'>): Promise<Incident> {
    if (isMockDataEnabled()) {
      await delay(200);
      const newInc: Incident = {
        ...incident,
        id: `INC-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        status: 'unverified',
        source: 'mock',
      };
      mutableIncidents.unshift(newInc);
      return newInc;
    }
    const res = await fetch(`${API_BASE_URL}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });
    if (!res.ok) throw new Error('Failed to submit incident');
    return res.json();
  },

  // HISTORICAL REPORTS SUMMARY
  async getReportSummary(from?: string, to?: string): Promise<HistoricalReportSummary> {
    if (isMockDataEnabled()) {
      await delay(150);
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
          totalRainfall: Math.round(180 + Math.random() * 240),
          uptimePercent: stn.status === 'offline' ? 84.5 : stn.status === 'degraded' ? 93.8 : 99.7,
        })),
      };
    }
    const res = await fetch(`${API_BASE_URL}/reports/summary?from=${from || ''}&to=${to || ''}`);
    if (!res.ok) throw new Error('Failed to fetch reports summary');
    return res.json();
  },

  // SATELLITE
  async getSatelliteImages(): Promise<SatelliteImage[]> {
    if (isMockDataEnabled()) {
      await delay(100);
      return [...mockSatelliteImages];
    }
    const res = await fetch(`${API_BASE_URL}/satellite/images`);
    if (!res.ok) throw new Error('Failed to fetch satellite imagery');
    return res.json();
  },

  // TERRAIN
  async getTerrain(areaId: string): Promise<TerrainData | null> {
    if (isMockDataEnabled()) {
      await delay(150);
      return mockTerrainData[areaId] || mockTerrainData['basin-yamuna'] || null;
    }
    const res = await fetch(`${API_BASE_URL}/terrain/${areaId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch terrain data');
    return res.json();
  },

  // SYSTEM HEALTH
  async getSystemHealth(): Promise<SystemHealth> {
    if (isMockDataEnabled()) {
      await delay(100);
      return { ...mockSystemHealth };
    }
    const res = await fetch(`${API_BASE_URL}/system/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  // EMERGENCY DATA (Contacts and Instructions)
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    if (isMockDataEnabled()) {
      await delay(80);
      return [...mockEmergencyContacts];
    }
    const res = await fetch(`${API_BASE_URL}/emergency/contacts`);
    if (!res.ok) throw new Error('Failed to fetch emergency contacts');
    return res.json();
  },

  async getSafetyInstructions(): Promise<SafetyInstruction[]> {
    if (isMockDataEnabled()) {
      await delay(80);
      return [...mockSafetyInstructions];
    }
    const res = await fetch(`${API_BASE_URL}/emergency/instructions`);
    if (!res.ok) throw new Error('Failed to fetch safety instructions');
    return res.json();
  },

  // STREAMING ASSISTANT
  async chatWithAssistant(
    query: string,
    language: 'en' | 'ta' | 'hi',
    onChunk: (chunk: string) => void
  ): Promise<{ sources: { title: string; url?: string; excerpt: string }[] }> {
    if (isMockDataEnabled()) {
      // Find matching mock response by keyword
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
        // Fallback with no invented data, obeying RAG honesty rules
        if (language === 'ta') {
          textToStream = 'மன்னிக்கவும், உங்கள் கேள்விக்கு பொருத்தமான நீரியல் ஆவணங்கள் அல்லது வழிகாட்டுதல்கள் எதுவும் கிடைக்கவில்லை. வெள்ள முன்னெச்சரிக்கை தொடர்பான பொதுவான தகவல்களுக்கு அதிகாரப்பூர்வ வழிகாட்டுதல்களைப் பார்க்கவும்.';
        } else if (language === 'hi') {
          textToStream = 'क्षमा करें, आपके प्रश्न से मेल खाने वाले सत्यापित संदर्भ दस्तावेज़ उपलब्ध नहीं हैं। आधिकारिक बाढ़ नियंत्रण बुलेटिन का संदर्भ लें।';
        } else {
          textToStream = 'No verified documentation or sensor telemetry matches your query. In accordance with safety protocol, this assistant does not fabricate unverified hydrologic metrics or evacuation orders. Please consult the Emergency Response tab for official helplines.';
        }
      }

      // Simulate realistic token stream chunking
      const words = textToStream.split(' ');
      for (let i = 0; i < words.length; i++) {
        await delay(35);
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      }

      return { sources };
    }

    // Real API streaming endpoint
    const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language }),
    });

    if (!res.ok) throw new Error('Failed to communicate with assistant');

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let sources: any[] = [];

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        // If server sends SSE or chunks
        try {
          const lines = text.split('\n').filter((l) => l.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) onChunk(data.chunk);
              if (data.sources) sources = data.sources;
            } else {
              onChunk(text);
            }
          }
        } catch {
          onChunk(text);
        }
      }
    }

    return { sources };
  },
};
