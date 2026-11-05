import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Alert, LocalReport } from '@/types';
import { apiClient } from '@/api';
import { getLocalReports, getCachedAlerts, setCachedAlerts } from '@/storage';
import { syncManager } from '@/features/sync/syncManager';
import { DisclaimerBanner } from '@/components/common/DisclaimerBanner';
import { DemoBadge } from '@/components/common/DemoBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SeverityBadge } from '@/components/common/SeverityBadge';

interface HomeScreenProps {
  onNavigate: (tab: string, params?: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentReports, setRecentReports] = useState<LocalReport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load user's recent local reports
      const local = getLocalReports();
      setRecentReports(local.slice(0, 3));

      // 2. Load alerts (try network, fallback to offline cache)
      try {
        const fetchedAlerts = await apiClient.getAlerts();
        setAlerts(fetchedAlerts);
        setCachedAlerts(fetchedAlerts);
        setOfflineNotice(null);
      } catch (err) {
        const cached = getCachedAlerts();
        if (cached) {
          setAlerts(cached.alerts);
          const time = new Date(cached.lastUpdated).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          setOfflineNotice(t('common.offlineCached', { time }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = syncManager.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleRefresh = async () => {
    await syncManager.syncPendingReports();
    await loadData();
  };

  return (
    <div className="p-4 sm:p-5 max-w-lg mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-sky-600 font-extrabold">
            {t('common.appName')}
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Community Safety
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <DemoBadge />
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mandatory Safety Notice */}
      <DisclaimerBanner />

      {/* Prominent Emergency Action Button */}
      <button
        onClick={() => onNavigate('report')}
        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl p-5 shadow-lg shadow-red-600/20 active:scale-[0.99] transition-all flex items-center justify-between text-left cursor-pointer border border-red-500"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <PlusCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black leading-tight">
              {t('home.reportButton')}
            </h2>
            <p className="text-xs text-red-100 mt-0.5 leading-snug">
              {t('home.reportButtonSub')}
            </p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-white/80 shrink-0" />
      </button>

      {/* Section: Nearby Official Alerts */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {t('home.activeAlertsTitle')}
          </h2>
          {offlineNotice && (
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              {offlineNotice}
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-center flex flex-col items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mb-1.5" />
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t('home.noAlerts')}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onNavigate('map')}
                className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-800/90 shadow-xs border-l-4 border-l-orange-500 cursor-pointer hover:border-orange-400 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <SeverityBadge severity={alert.severity} size="sm" />
                  {alert.distanceKm && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3" />
                      {alert.distanceKm} km
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                  {alert.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Your Recent Reports */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {t('home.recentReportsTitle')}
          </h2>
          {recentReports.length > 0 && (
            <button
              onClick={() => onNavigate('myReports')}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
            >
              {t('home.viewAllReports')}
            </button>
          )}
        </div>

        {recentReports.length === 0 ? (
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-center flex flex-col items-center justify-center">
            <Clock className="w-8 h-8 text-slate-400 mb-1.5" />
            <p className="text-xs sm:text-sm text-slate-500">
              {t('home.noRecentReports')}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentReports.map((report) => (
              <div
                key={report.localId}
                onClick={() => onNavigate('myReports')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {report.location.address || report.location.landmark || 'Coordinates Recorded'}
                    </p>
                  </div>
                  <StatusBadge status={report.status} size="sm" />
                </div>

                {report.syncStatus === 'pending_upload' && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    {t('myReports.syncState.pending_upload')}
                  </div>
                )}
                {report.syncStatus === 'failed' && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200">
                    {t('myReports.syncState.failed')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
