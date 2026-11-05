import axios, { AxiosInstance } from 'axios';
import { Incident, Alert, SafetyInfo, DeviceRegistration } from '@/types';
import { isMockDataEnabled, mockIncidents, mockAlerts, mockSafetyInfo } from '@/mocks';
import { getOrCreateClientId } from '@/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const DEFAULT_TIMEOUT = 15000;
const UPLOAD_TIMEOUT = 35000;

export class ApiClient {
  private instance: AxiosInstance;
  private uploadInstance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.uploadInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: UPLOAD_TIMEOUT,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    this.instance.interceptors.request.use((config) => {
      const clientId = getOrCreateClientId();
      config.headers['X-Client-Id'] = clientId;
      return config;
    });
  }

  private async requestWithRetry<T>(fn: () => Promise<T>, retries: number = 2, delayMs: number = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && this.isRetryableError(error)) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.requestWithRetry(fn, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error.response) return true;
    const status = error.response.status;
    return status === 408 || status === 429 || (status >= 500 && status <= 599);
  }

  async submitIncident(report: {
    clientId: string;
    title: string;
    type: string;
    severity: string;
    description: string;
    location: {
      latitude: number;
      longitude: number;
      accuracyMeters?: number;
      address?: string;
      landmark?: string;
    };
    photos: string[];
    contact?: string;
    anonymous: boolean;
    language: string;
    createdAt: string;
  }): Promise<{ id: string; status: Incident['status']; message?: string }> {
    if (isMockDataEnabled()) {
      await new Promise((r) => setTimeout(r, 600));
      return {
        id: `INC-${Date.now().toString().slice(-6)}`,
        status: 'unverified',
        message: 'Report submitted successfully (Mock Mode)',
      };
    }

    return this.requestWithRetry(async () => {
      const response = await this.instance.post('/api/incidents', report);
      return response.data;
    });
  }

  async uploadPhoto(dataUrlOrFile: string | File): Promise<{ url: string }> {
    if (isMockDataEnabled()) {
      await new Promise((r) => setTimeout(r, 500));
      if (typeof dataUrlOrFile === 'string') return { url: dataUrlOrFile };
      return { url: URL.createObjectURL(dataUrlOrFile) };
    }

    const formData = new FormData();
    if (typeof dataUrlOrFile === 'string') {
      // Base64 or Blob URL
      const blob = await fetch(dataUrlOrFile).then((r) => r.blob());
      formData.append('photo', blob, `flood_photo_${Date.now()}.jpg`);
    } else {
      formData.append('photo', dataUrlOrFile);
    }

    return this.requestWithRetry(async () => {
      const response = await this.uploadInstance.post('/api/uploads/photo', formData);
      return response.data;
    }, 2, 1500);
  }

  async getIncidents(params?: {
    mine?: boolean;
    near?: { latitude: number; longitude: number };
    radiusKm?: number;
  }): Promise<Incident[]> {
    if (isMockDataEnabled()) {
      await new Promise((r) => setTimeout(r, 300));
      return mockIncidents;
    }

    return this.requestWithRetry(async () => {
      const queryParams: Record<string, string> = {};
      if (params?.mine) queryParams.mine = 'true';
      if (params?.near) {
        queryParams.near = `${params.near.latitude},${params.near.longitude}`;
        queryParams.radius = (params.radiusKm || 10).toString();
      }
      const response = await this.instance.get('/api/incidents', { params: queryParams });
      return response.data;
    });
  }

  async getIncidentById(id: string): Promise<Incident> {
    if (isMockDataEnabled()) {
      await new Promise((r) => setTimeout(r, 200));
      const found = mockIncidents.find((i) => i.id === id);
      if (found) return found;
      throw new Error(`Incident ${id} not found.`);
    }

    return this.requestWithRetry(async () => {
      const response = await this.instance.get(`/api/incidents/${id}`);
      return response.data;
    });
  }

  async updateIncident(
    id: string,
    updates: Partial<Pick<Incident, 'title' | 'description' | 'severity' | 'location'>>
  ): Promise<Incident> {
    if (isMockDataEnabled()) {
      await new Promise((r) => setTimeout(r, 400));
      const target = mockIncidents.find((i) => i.id === id);
      if (!target) throw new Error(`Incident ${id} not found`);
      return { ...target, ...updates };
    }

    return this.requestWithRetry(async () => {
      const response = await this.instance.patch(`/api/incidents/${id}`, updates);
      return response.data;
    });
  }

  async withdrawIncident(id: string): Promise<{ success: boolean; message: string }> {
    if (isMockDataEnabled()) {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, message: 'Report withdrawn successfully' };
    }

    return this.requestWithRetry(async () => {
      const response = await this.instance.patch(`/api/incidents/${id}`, {
        status: 'rejected',
        responderNotes: 'Withdrawn by reporter',
      });
      return response.data;
    });
  }

  async getAlerts(params?: { latitude?: number; longitude?: number; radiusKm?: number }): Promise<Alert[]> {
    if (isMockDataEnabled()) {
      await new Promise((r) => setTimeout(r, 300));
      return mockAlerts;
    }

    return this.requestWithRetry(async () => {
      const queryParams: Record<string, string> = {};
      if (params?.latitude && params?.longitude) {
        queryParams.near = `${params.latitude},${params.longitude}`;
        queryParams.radius = (params.radiusKm || 15).toString();
      }
      const response = await this.instance.get('/api/alerts', { params: queryParams });
      return response.data;
    });
  }

  async getSafetyInfo(language: string = 'en'): Promise<SafetyInfo> {
    if (isMockDataEnabled()) {
      await new Promise((r) => setTimeout(r, 200));
      return mockSafetyInfo;
    }

    return this.requestWithRetry(async () => {
      const response = await this.instance.get('/api/safety-info', { params: { language } });
      return response.data;
    });
  }

  async registerDevice(device: DeviceRegistration): Promise<{ registered: boolean }> {
    if (isMockDataEnabled()) {
      return { registered: true };
    }

    try {
      const response = await this.instance.post('/api/devices', device);
      return response.data;
    } catch (e) {
      return { registered: false };
    }
  }
}

export const apiClient = new ApiClient();
