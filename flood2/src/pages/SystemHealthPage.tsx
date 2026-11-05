import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  HardDrive,
  BatteryCharging,
  WifiOff,
} from 'lucide-react';

import { SystemHealth } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { DemoBadge } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { timeAgo } from '@/utils/date';

export const SystemHealthPage: React.FC = () => {
  const { t } = useTranslation();
  const isMock = isMockDataEnabled();

  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const fetchHealth = async () => {
    try {
      setError(null);
      const data = await apiClient.getSystemHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to inspect system health metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    // Simulate buffer flushing and network synchronization
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      if (health) {
        setHealth({
          ...health,
          bufferedReadings: {
            pending: 0,
            synced: health.bufferedReadings.synced + health.bufferedReadings.pending,
            failed: 0,
          },
        });
      }
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1200);
  };

  if (loading) {
    return <LoadingSpinner label="Auditing telemetry gateways and buffer queues..." size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchHealth} />;
  }

  if (!health) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('health.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('health.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Diagnostics
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              {t('health.sensorFailures')}
            </span>
            <span className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 block">
              {health.sensorFailures}
            </span>
            <span className="text-[11px] text-slate-400">Failed transducer probes</span>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              {t('health.missingData')}
            </span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
              {health.missingDataGaps}
            </span>
            <span className="text-[11px] text-slate-400">Identified telemetry gaps</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              {t('health.commLoss')}
            </span>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {health.communicationLosses}
            </span>
            <span className="text-[11px] text-slate-400">Station dropouts (&gt;1 hr)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-500/10 text-slate-500">
            <WifiOff className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              {t('health.lowBattery')}
            </span>
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1 block">
              {health.lowBatteryCount}
            </span>
            <span className="text-[11px] text-slate-400">Stations below 20% power</span>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
            <BatteryCharging className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Offline Storage & Edge Buffering Status */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-500" />
              {t('health.bufferedReadings')}
            </h2>
            <p className="text-xs text-slate-500">
              Local persistent queue buffering telemetry packets when connectivity drops
            </p>
          </div>

          <button
            onClick={handleManualSync}
            disabled={syncing || health.bufferedReadings.pending === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Flushing Buffer...' : 'Force Buffer Sync'}
          </button>
        </div>

        {syncSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Buffer queue successfully dispatched to primary cloud database.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1">
              {t('health.pendingSync')}
            </span>
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {health.bufferedReadings.pending}
            </span>
            <p className="text-[11px] text-amber-600/80 mt-1">Packets stored locally</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="font-semibold text-emerald-800 dark:text-emerald-300 block mb-1">
              {t('health.synced')}
            </span>
            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {health.bufferedReadings.synced}
            </span>
            <p className="text-[11px] text-emerald-600/80 mt-1">Transmitted successfully</p>
          </div>

          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
            <span className="font-semibold text-red-800 dark:text-red-300 block mb-1">
              {t('health.failedSync')}
            </span>
            <span className="text-2xl font-bold text-red-700 dark:text-red-400">
              {health.bufferedReadings.failed}
            </span>
            <p className="text-[11px] text-red-600/80 mt-1">Malformed packet rejects</p>
          </div>
        </div>
      </div>

      {/* Subsystem Health Checklist */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Cpu className="w-4 h-4 text-sky-500" />
          {t('health.diagnostics')}
        </h2>

        <div className="space-y-3">
          {health.components.map((comp, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                {comp.status === 'healthy' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                )}
                {comp.status === 'warning' && (
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                )}
                {comp.status === 'error' && (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                )}

                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {comp.name}
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">{comp.message}</p>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 flex-shrink-0 self-end sm:self-center">
                Checked {timeAgo(comp.lastChecked)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
