import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  CloudUpload,
  RefreshCw,
  ChevronRight,
  Clock,
  Filter,
} from 'lucide-react';
import { LocalReport } from '@/types';
import { getLocalReports } from '@/storage';
import { syncManager } from '@/features/sync/syncManager';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SeverityBadge } from '@/components/common/SeverityBadge';

type FilterType = 'all' | 'pending' | 'unverified' | 'under_review' | 'verified' | 'rejected';

interface MyReportsScreenProps {
  onSelectReport: (reportId: string) => void;
}

export const MyReportsScreen: React.FC<MyReportsScreenProps> = ({ onSelectReport }) => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<LocalReport[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadReports = () => {
    const local = getLocalReports();
    setReports(local);
  };

  useEffect(() => {
    loadReports();
    const unsub = syncManager.subscribe(() => {
      loadReports();
    });
    return () => unsub();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncManager.syncPendingReports();
    loadReports();
    setRefreshing(false);
  };

  const handleRetry = async (e: React.MouseEvent, localId: string) => {
    e.stopPropagation();
    await syncManager.retryReport(localId);
  };

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('myReports.filterAll') },
    { key: 'pending', label: t('myReports.filterPending') },
    { key: 'unverified', label: t('myReports.filterUnverified') },
    { key: 'under_review', label: t('myReports.filterReview') },
    { key: 'verified', label: t('myReports.filterVerified') },
    { key: 'rejected', label: t('myReports.filterRejected') },
  ];

  const filteredReports = reports.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') {
      return item.syncStatus === 'pending_upload' || item.syncStatus === 'failed';
    }
    return item.status === activeFilter;
  });

  return (
    <div className="p-4 sm:p-5 max-w-lg mx-auto pb-24 space-y-3">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {t('nav.myReports')}
        </h1>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="Refresh reports"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Explainer Box */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 text-xs text-sky-800 dark:text-sky-300">
        <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t('myReports.statusExplainer')}</p>
      </div>

      {/* Horizontal Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80">
          <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {t('myReports.emptyFilter')}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Reports you submit will appear here with live verification tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {filteredReports.map((report) => (
            <div
              key={report.localId}
              onClick={() => onSelectReport(report.localId)}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <SeverityBadge severity={report.severity} size="sm" />
                <StatusBadge status={report.status} size="sm" />
              </div>

              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">
                {report.title}
              </h2>
              <p className="text-xs text-slate-500 mb-3 line-clamp-1">
                {report.location.address || report.location.landmark || 'GPS Coordinates Recorded'}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span>
                  {new Date(report.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <div className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Sync State Badges */}
              {report.syncStatus === 'pending_upload' && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950 dark:text-amber-200">
                  <CloudUpload className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('myReports.syncState.pending_upload')}</span>
                </div>
              )}
              {report.syncStatus === 'uploading' && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-200 dark:bg-sky-950 dark:text-sky-200">
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                  <span>{t('myReports.syncState.uploading')}</span>
                </div>
              )}
              {report.syncStatus === 'failed' && (
                <div className="mt-2.5 flex items-center justify-between gap-2 p-2 rounded bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950 dark:text-rose-200 text-xs">
                  <span>{t('myReports.syncState.failed')}</span>
                  <button
                    onClick={(e) => handleRetry(e, report.localId)}
                    className="font-bold underline cursor-pointer text-rose-700"
                  >
                    Retry Now
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
