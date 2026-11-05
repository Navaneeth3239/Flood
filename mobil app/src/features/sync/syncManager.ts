import { LocalReport, ProblemType, SeverityLevel, LocationCoords } from '@/types';
import {
  getLocalReports,
  saveLocalReport,
  updateLocalReport,
} from '@/storage';
import { apiClient } from '@/api';
import { generateUUID } from '@/utils/uuid';

class SyncManager {
  private isSyncing: boolean = false;
  private syncListeners: Set<() => void> = new Set();
  private maxRetries: number = 4;

  constructor() {
    this.initNetworkListener();
  }

  public subscribe(callback: () => void): () => void {
    this.syncListeners.add(callback);
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.syncListeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.warn('[SyncManager] Listener error:', e);
      }
    });
  }

  private initNetworkListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncManager] Browser is online; triggering sync.');
        this.syncPendingReports();
      });
    }
  }

  public async queueReport(params: {
    title: string;
    description: string;
    type: ProblemType;
    severity: SeverityLevel;
    location: LocationCoords;
    localPhotoUris: string[];
    contact?: string;
    anonymous: boolean;
    language: string;
  }): Promise<LocalReport> {
    const localId = generateUUID();
    const now = new Date().toISOString();

    const report: LocalReport = {
      localId,
      title: params.title,
      description: params.description,
      type: params.type,
      severity: params.severity,
      location: params.location,
      localPhotoUris: params.localPhotoUris,
      uploadedPhotoUrls: [],
      contact: params.contact,
      anonymous: params.anonymous,
      language: params.language,
      status: 'unverified',
      syncStatus: 'pending_upload',
      syncAttempts: 0,
      createdAt: now,
      timeline: [
        {
          status: 'unverified',
          timestamp: now,
          note: 'Recorded locally on device',
        },
      ],
    };

    saveLocalReport(report);
    this.notifyListeners();

    // Trigger immediate background sync attempt if network is available
    if (navigator.onLine) {
      this.syncPendingReports();
    }

    return report;
  }

  public async syncPendingReports(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[SyncManager] Device is offline; sync deferred.');
      return;
    }

    this.isSyncing = true;
    try {
      const reports = getLocalReports();
      const queue = reports.filter(
        (r) =>
          r.syncStatus === 'pending_upload' ||
          (r.syncStatus === 'failed' && r.syncAttempts < this.maxRetries)
      );

      for (const report of queue) {
        await this.syncSingleReport(report);
      }
    } catch (error) {
      console.warn('[SyncManager] Sync loop error:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  public async retryReport(localId: string): Promise<void> {
    const reports = getLocalReports();
    const report = reports.find((r) => r.localId === localId);
    if (!report) return;

    updateLocalReport(localId, { syncStatus: 'pending_upload', lastSyncError: undefined });
    this.notifyListeners();
    await this.syncPendingReports();
  }

  private async syncSingleReport(report: LocalReport): Promise<void> {
    try {
      updateLocalReport(report.localId, {
        syncStatus: 'uploading',
        syncAttempts: report.syncAttempts + 1,
      });
      this.notifyListeners();

      // Step A: Resumable Photo Uploads
      const uploadedUrls: string[] = [...report.uploadedPhotoUrls];
      for (let i = uploadedUrls.length; i < report.localPhotoUris.length; i++) {
        const localUri = report.localPhotoUris[i];
        try {
          const uploadRes = await apiClient.uploadPhoto(localUri);
          uploadedUrls.push(uploadRes.url);

          updateLocalReport(report.localId, {
            uploadedPhotoUrls: uploadedUrls,
          });
        } catch (photoErr: any) {
          throw new Error(`Photo upload failed: ${photoErr?.message || 'Network error'}`);
        }
      }

      // Step B: Submit incident payload
      const result = await apiClient.submitIncident({
        clientId: report.localId,
        title: report.title,
        type: report.type,
        severity: report.severity,
        description: report.description,
        location: report.location,
        photos: uploadedUrls,
        contact: report.anonymous ? undefined : report.contact,
        anonymous: report.anonymous,
        language: report.language,
        createdAt: report.createdAt,
      });

      // Step C: Mark synced on client
      const updatedTimeline = [
        ...(report.timeline || []),
        {
          status: 'unverified' as const,
          timestamp: new Date().toISOString(),
          note: 'Confirmed received by Emergency Response module',
        },
      ];

      updateLocalReport(report.localId, {
        serverId: result.id,
        syncStatus: 'synced',
        lastSyncError: undefined,
        timeline: updatedTimeline,
      });
    } catch (error: any) {
      console.warn(`[SyncManager] Report ${report.localId} sync failed:`, error?.message);
      updateLocalReport(report.localId, {
        syncStatus: 'failed',
        lastSyncError: error?.message || 'Failed to connect to server',
      });
    } finally {
      this.notifyListeners();
    }
  }
}

export const syncManager = new SyncManager();
