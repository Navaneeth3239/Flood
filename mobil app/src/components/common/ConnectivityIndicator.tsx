import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, CloudUpload } from 'lucide-react';
import { getLocalReports } from '@/storage';

interface ConnectivityIndicatorProps {
  onPressPending?: () => void;
}

export const ConnectivityIndicator: React.FC<ConnectivityIndicatorProps> = ({ onPressPending }) => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const checkPendingReports = () => {
    try {
      const reports = getLocalReports();
      const pending = reports.filter(
        (r) => r.syncStatus === 'pending_upload' || r.syncStatus === 'failed' || r.syncStatus === 'uploading'
      );
      setPendingCount(pending.length);
    } catch (e) {
      console.warn('Failed to count pending reports:', e);
    }
  };

  useEffect(() => {
    checkPendingReports();
    const interval = setInterval(checkPendingReports, 3000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 text-white text-xs gap-2">
      {!isOnline && (
        <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          <WifiOff className="w-3.5 h-3.5" />
          <span>{t('common.offline')}</span>
        </div>
      )}

      {pendingCount > 0 && (
        <button
          onClick={onPressPending}
          className="flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-semibold hover:bg-amber-200 transition-colors ml-auto cursor-pointer"
          title={t('common.pendingUploads', { count: pendingCount })}
        >
          <CloudUpload className="w-3.5 h-3.5 text-amber-700" />
          <span>{t('common.pendingUploads', { count: pendingCount })}</span>
        </button>
      )}
    </div>
  );
};
