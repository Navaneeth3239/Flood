import { ConnectionState, WebSocketMessage, Reading } from '@/types';
import { isMockDataEnabled } from './client';
import { mockStations } from '@/mocks';

type MessageCallback = (msg: WebSocketMessage) => void;
type StateCallback = (state: ConnectionState) => void;

class FloodWebSocketService {
  private socket: WebSocket | null = null;
  private connectionState: ConnectionState = 'offline';
  private messageListeners: Set<MessageCallback> = new Set();
  private stateListeners: Set<StateCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectDelay = 16000;
  private reconnectTimeoutId: any = null;
  private mockIntervalId: any = null;
  private isManuallyPaused = false;

  constructor() {
    // Start connection automatically
    this.connect();
  }

  public getState(): ConnectionState {
    return this.connectionState;
  }

  private setState(newState: ConnectionState) {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.stateListeners.forEach((cb) => cb(newState));
    }
  }

  public onMessage(cb: MessageCallback): () => void {
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  public onStateChange(cb: StateCallback): () => void {
    this.stateListeners.add(cb);
    cb(this.connectionState); // Immediate current state trigger
    return () => this.stateListeners.delete(cb);
  }

  public connect() {
    if (this.isManuallyPaused) return;

    if (isMockDataEnabled()) {
      this.startMockStream();
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

    try {
      this.setState('reconnecting');
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState('live');
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WebSocketMessage;
          this.messageListeners.forEach((cb) => cb(parsed));
        } catch (e) {
          console.warn('Failed to parse WebSocket message payload', e);
        }
      };

      this.socket.onerror = () => {
        this.handleDisconnect();
      };

      this.socket.onclose = () => {
        this.handleDisconnect();
      };
    } catch {
      this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    this.socket = null;
    this.setState('reconnecting');

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;

    clearTimeout(this.reconnectTimeoutId);
    this.reconnectTimeoutId = setTimeout(() => {
      if (this.reconnectAttempts > 5) {
        this.setState('offline');
      }
      this.connect();
    }, delay);
  }

  private startMockStream() {
    this.setState('live');
    if (this.mockIntervalId) clearInterval(this.mockIntervalId);

    // Simulate incoming real-time telemetry every 5 seconds
    this.mockIntervalId = setInterval(() => {
      if (this.isManuallyPaused) return;

      const randomStation = mockStations[Math.floor(Math.random() * mockStations.length)];
      if (randomStation.status === 'offline') return;

      // Realistic small jitter in water level (e.g. ±0.03m)
      const jitter = (Math.random() - 0.48) * 0.08;
      const baseLevel = (randomStation.thresholds.normalMax + randomStation.thresholds.watchMax) / 2;
      const newWaterLevel = +(baseLevel + jitter).toFixed(2);
      const newRainfall = +(Math.random() * 25).toFixed(1);

      const reading: Reading = {
        id: `RD-WS-${Date.now()}`,
        stationId: randomStation.id,
        timestamp: new Date().toISOString(),
        waterLevel: newWaterLevel,
        rainfall: newRainfall,
        soilMoisture: Math.round(50 + Math.random() * 35),
        temperature: +(27 + Math.random() * 4).toFixed(1),
        humidity: Math.round(70 + Math.random() * 20),
        flowRate: Math.round(180 + Math.random() * 120),
        trend: jitter > 0.02 ? 'rising' : jitter < -0.02 ? 'falling' : 'steady',
        source: 'mock',
        dataQuality: 'good',
      };

      this.messageListeners.forEach((cb) =>
        cb({
          type: 'reading',
          payload: reading,
        })
      );
    }, 5000);
  }

  // Capability to toggle or simulate offline testing
  public toggleManualOffline(forceOffline?: boolean) {
    if (forceOffline !== undefined) {
      this.isManuallyPaused = forceOffline;
    } else {
      this.isManuallyPaused = !this.isManuallyPaused;
    }

    if (this.isManuallyPaused) {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      if (this.mockIntervalId) {
        clearInterval(this.mockIntervalId);
        this.mockIntervalId = null;
      }
      this.setState('offline');
    } else {
      this.connect();
    }
  }

  public disconnect() {
    this.toggleManualOffline(true);
  }

  public reconnect() {
    this.toggleManualOffline(false);
  }
}

export const webSocketService = new FloodWebSocketService();
