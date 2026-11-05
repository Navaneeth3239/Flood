/**
 * 3D Terrain Database Cache Service
 *
 * Implements a persistent client-side IndexedDB database cache for 3D terrain
 * tiles, elevation data, and DEM meshes to prevent redundant/frequent API calls
 * to CesiumJS, Cesium ion, and ArcGIS elevation servers.
 *
 * Automatically clears the database cache when the browser window or session closes.
 */

const DB_NAME = 'SCMS_3D_Terrain_DB';
const DB_VERSION = 1;
const STORE_NAME = 'terrain_tiles';

export interface CachedTerrainItem {
  url: string;
  data: ArrayBuffer;
  contentType: string;
  timestamp: number;
  size: number;
}

class TerrainCacheDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private interceptorInstalled = false;
  private hitCount = 0;
  private missCount = 0;

  constructor() {
    this.initSession();
  }

  /**
   * Opens / upgrades the IndexedDB database.
   */
  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment.'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('[Terrain Cache DB] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Initializes session tracking and registers window close listeners
   * to automatically clear the cache when the website is closed.
   */
  private initSession() {
    if (typeof window === 'undefined') return;

    // Check if this is a newly opened browser tab/session.
    // sessionStorage is automatically cleared when the tab/window is closed by the browser.
    const isSessionActive = sessionStorage.getItem('scms_terrain_session_active');
    if (!isSessionActive) {
      // Browser was just opened after being closed -> clear past cached terrain immediately
      this.clear().then(() => {
        console.log('[Terrain Cache DB] Fresh session initialized. Past terrain cache cleared.');
      });
      sessionStorage.setItem('scms_terrain_session_active', Date.now().toString());
    }

    // When the tab/window is closed or unloaded, clear the database cache
    const handleClose = () => {
      this.clearSync();
      sessionStorage.removeItem('scms_terrain_session_active');
    };

    window.addEventListener('beforeunload', handleClose);
    window.addEventListener('pagehide', handleClose);
  }

  /**
   * Synchronous / Beacon clear attempt for window close events
   */
  private clearSync() {
    try {
      // Clear IndexedDB asynchronously
      this.clear();
      // Notify backend DB to clear server-side terrain cache table as well
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${backendUrl}/terrain/cache?action=clear`);
      }
    } catch {
      // non-blocking
    }
  }

  /**
   * Determines if a URL represents a 3D terrain elevation request.
   */
  public isTerrainRequest(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    return (
      lower.includes('terrain3d') ||
      lower.includes('elevation3d') ||
      lower.includes('worldelevation3d') ||
      lower.includes('.terrain') ||
      lower.includes('assets.cesium.com') ||
      lower.includes('cesium-world-terrain') ||
      (lower.includes('/terrain') && (lower.includes('tile') || lower.includes('.json') || lower.includes('.tif')))
    );
  }

  /**
   * Retrieves a cached 3D terrain tile from IndexedDB.
   */
  public async getTile(url: string): Promise<CachedTerrainItem | null> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(url);

        request.onsuccess = () => {
          if (request.result) {
            this.hitCount++;
            resolve(request.result as CachedTerrainItem);
          } else {
            this.missCount++;
            resolve(null);
          }
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    } catch {
      return null;
    }
  }

  /**
   * Stores a 3D terrain tile into IndexedDB.
   */
  public async setTile(url: string, data: ArrayBuffer, contentType: string): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const item: CachedTerrainItem = {
          url,
          data,
          contentType: contentType || 'application/octet-stream',
          timestamp: Date.now(),
          size: data.byteLength || 0,
        };

        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[Terrain Cache DB] Could not store tile in cache:', err);
    }
  }

  /**
   * Clears all cached 3D terrain tiles from the database.
   */
  public async clear(): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          this.hitCount = 0;
          this.missCount = 0;
          resolve();
        };

        request.onerror = () => resolve();
      });
    } catch {
      // non-blocking fallback
    }
  }

  /**
   * Returns cache metrics (count, total size in bytes, hits, misses).
   */
  public async getStats(): Promise<{ count: number; totalBytes: number; hits: number; misses: number }> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const items: CachedTerrainItem[] = request.result || [];
          const totalBytes = items.reduce((acc, it) => acc + (it.size || 0), 0);
          resolve({
            count: items.length,
            totalBytes,
            hits: this.hitCount,
            misses: this.missCount,
          });
        };

        request.onerror = () => {
          resolve({ count: 0, totalBytes: 0, hits: this.hitCount, misses: this.missCount });
        };
      });
    } catch {
      return { count: 0, totalBytes: 0, hits: this.hitCount, misses: this.missCount };
    }
  }

  /**
   * Installs the global fetch interceptor.
   * Intercepts 3D terrain requests and serves them directly from IndexedDB,
   * completely avoiding redundant API calls to CesiumJS and elevation servers.
   */
  public installInterceptor(): void {
    if (this.interceptorInstalled || typeof window === 'undefined') return;
    this.interceptorInstalled = true;

    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      // Only intercept terrain requests
      if (!this.isTerrainRequest(url)) {
        return originalFetch(input, init);
      }

      try {
        // 1. Check local IndexedDB cache first
        const cached = await this.getTile(url);
        if (cached && cached.data) {
          // Serve directly from the database cache: ZERO API call!
          return new Response(cached.data, {
            status: 200,
            statusText: 'OK (From 3D Terrain Database Cache)',
            headers: {
              'Content-Type': cached.contentType || 'application/octet-stream',
              'X-Terrain-Cache': 'HIT',
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
      } catch (err) {
        console.warn('[Terrain Cache] Cache lookup error, falling back to network:', err);
      }

      // 2. Cache miss: Fetch from network once
      try {
        const response = await originalFetch(input, init);

        if (response.ok) {
          // Clone response and store in IndexedDB in the background
          const clone = response.clone();
          const contentType = clone.headers.get('Content-Type') || 'application/octet-stream';

          clone
            .arrayBuffer()
            .then((buffer) => {
              if (buffer && buffer.byteLength > 0) {
                this.setTile(url, buffer, contentType);
              }
            })
            .catch(() => {});
        }

        return response;
      } catch (networkError) {
        // If network fails (e.g. offline), try to return cached tile if available
        const cached = await this.getTile(url);
        if (cached && cached.data) {
          return new Response(cached.data, {
            status: 200,
            statusText: 'OK (Offline Cache Fallback)',
            headers: { 'Content-Type': cached.contentType },
          });
        }
        throw networkError;
      }
    };

    console.log('[Terrain Cache Service] Global 3D Terrain IndexedDB Cache Interceptor active.');
  }
}

export const terrainCacheService = new TerrainCacheDatabase();

