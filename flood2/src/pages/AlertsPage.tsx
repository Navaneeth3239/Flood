import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Filter,
  Settings,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

import { Alert, SeverityLevel } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { DemoBadge } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { getSeverityClasses } from '@/utils/formatters';
import { timeAgo, formatDate } from '@/utils/date';

export const AlertsPage: React.FC = () => {
  const { t } = useTranslation();
  const isMock = isMockDataEnabled();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Notification Preferences Panel
  const [preferences, setPreferences] = useState({
    smsEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    minSeverity: 'warning' as SeverityLevel,
  });
  const [prefSavedMessage, setPrefSavedMessage] = useState(false);

  const fetchAlerts = async () => {
    try {
      setError(null);
      const data = await apiClient.getAlerts({
        status: statusFilter,
        severity: severityFilter,
      });
      setAlerts(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve flood warning alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleAcknowledge = async (id: string) => {
    try {
      const updated = await apiClient.updateAlert(id, {
        status: 'acknowledged',
        user: 'Duty Officer (Flood Operations)',
      });
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const updated = await apiClient.updateAlert(id, {
        status: 'resolved',
        user: 'Chief Hydrogeologist',
      });
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error('Failed to resolve alert', err);
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSavedMessage(true);
    setTimeout(() => setPrefSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('alerts.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('alerts.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Alerts List & Filter Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {t('alerts.filterSeverity')}:
              </span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">{t('alerts.all')}</option>
                <option value="danger">{t('status.danger')}</option>
                <option value="warning">{t('status.warning')}</option>
                <option value="watch">{t('status.watch')}</option>
                <option value="normal">{t('status.normal')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {t('alerts.filterStatus')}:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">{t('alerts.all')}</option>
                <option value="active">{t('status.active')}</option>
                <option value="acknowledged">{t('status.acknowledged')}</option>
                <option value="resolved">{t('status.resolved')}</option>
              </select>
            </div>
          </div>

          {/* Alerts Feed */}
          {loading ? (
            <LoadingSpinner label="Retrieving threshold alerts and bulletins..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchAlerts} />
          ) : alerts.length === 0 ? (
            <EmptyState
              title="No Alerts Found"
              description="There are currently no active or historical alerts matching your filter criteria."
              action={{
                label: 'Clear Filters',
                onClick: () => {
                  setSeverityFilter('all');
                  setStatusFilter('all');
                },
              }}
            />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, idx) => {
                const alertId = String(alert.id || (alert as any)._id || `alert-item-${idx}`);
                const sev = getSeverityClasses(alert.severity);

                return (
                  <div
                    key={alertId}
                    className={`rounded-2xl border p-4 shadow-xs transition-all ${sev.bg} ${sev.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl ${sev.badge} flex-shrink-0 mt-0.5`}>
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {alert.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${sev.badge}`}
                            >
                              {alert.severity}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                alert.status === 'active'
                                  ? 'bg-red-500 text-white'
                                  : alert.status === 'acknowledged'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {alert.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
                            {alert.message}
                          </p>

                          <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {alert.stationName}
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(alert.timestamp)} ({timeAgo(alert.timestamp)})
                            </span>
                            {alert.acknowledgedBy && (
                              <>
                                <span>&bull;</span>
                                <span>Ack by: {alert.acknowledgedBy}</span>
                              </>
                            )}
                            {alert.resolvedBy && (
                              <>
                                <span>&bull;</span>
                                <span>Resolved by: {alert.resolvedBy}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            {t('alerts.acknowledge')}
                          </button>
                        )}
                        {alert.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            {t('alerts.resolve')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Notification & Dispatch Preferences */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 h-fit">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('alerts.preferencesTitle')}
            </h2>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
            <div className="space-y-3">
              <span className="font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider text-[11px]">
                Dispatch Channels
              </span>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {t('alerts.channelSms')}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.smsEnabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, smsEnabled: e.target.checked })
                  }
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {t('alerts.channelEmail')}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.emailEnabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, emailEnabled: e.target.checked })
                  }
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {t('alerts.channelPush')}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.pushEnabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, pushEnabled: e.target.checked })
                  }
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                {t('alerts.minSeverity')}
              </label>
              <select
                value={preferences.minSeverity}
                onChange={(e) =>
                  setPreferences({ ...preferences, minSeverity: e.target.value as SeverityLevel })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="watch">Watch & above</option>
                <option value="warning">Warning & above</option>
                <option value="danger">Danger only (Critical Evacuation)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Update Preferences
            </button>

            {prefSavedMessage && (
              <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                Preferences successfully saved!
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
