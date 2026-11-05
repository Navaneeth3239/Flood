import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, MapPin, X } from 'lucide-react';
import { Incident, Alert } from '@/types';
import { apiClient } from '@/api';
import { LeafletMap } from '@/components/map/LeafletMap';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { CustomButton } from '@/components/common/CustomButton';

type SeverityFilter = 'all' | 'danger' | 'warning' | 'watch';

export const NearbyMapScreen: React.FC = () => {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeFilter, setActiveFilter] = useState<SeverityFilter>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<Incident | Alert | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedIncidents, fetchedAlerts] = await Promise.all([
        apiClient.getIncidents(),
        apiClient.getAlerts(),
      ]);
      setIncidents(fetchedIncidents);
      setAlerts(fetchedAlerts);
    } catch (e) {
      console.warn('Error loading map data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredIncidents = incidents.filter((inc) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'danger') return inc.severity === 'urgent';
    if (activeFilter === 'warning') return inc.severity === 'high';
    if (activeFilter === 'watch') return inc.severity === 'medium' || inc.severity === 'low';
    return true;
  });

  const filteredAlerts = alerts.filter((alt) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'danger') return alt.severity === 'danger' || alt.severity === 'critical';
    if (activeFilter === 'warning') return alt.severity === 'warning';
    if (activeFilter === 'watch') return alt.severity === 'watch' || alt.severity === 'normal';
    return true;
  });

  const isIncident = (item: any): item is Incident => 'type' in item && 'status' in item;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-lg mx-auto relative">
      {/* Top Filter Chips Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 z-10">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'danger', 'warning', 'watch'] as SeverityFilter[]).map((f) => {
            const isSelected = activeFilter === f;
            const labels = {
              all: t('mapScreen.filterAll'),
              danger: t('mapScreen.filterDanger'),
              warning: t('mapScreen.filterWarning'),
              watch: t('mapScreen.filterWatch'),
            };

            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        <button
          onClick={loadData}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full relative">
        <LeafletMap
          initialLat={13.015}
          initialLng={80.215}
          zoom={13}
          editablePin={false}
          incidents={filteredIncidents}
          alerts={filteredAlerts}
          onMarkerPress={(item) => setSelectedItem(item)}
          height="100%"
          className="h-full rounded-none border-none"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-[11px] font-semibold space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span className="text-slate-700 dark:text-slate-300">Urgent / Danger</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-700 dark:text-slate-300">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-slate-700 dark:text-slate-300">Watch / Advisory</span>
          </div>
        </div>
      </div>

      {/* Selected Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-end justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-md w-full space-y-3 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SeverityBadge
                  severity={isIncident(selectedItem) ? selectedItem.severity : selectedItem.severity}
                  size="sm"
                />
                {isIncident(selectedItem) && <StatusBadge status={selectedItem.status} size="sm" />}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedItem.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isIncident(selectedItem) ? selectedItem.description : selectedItem.message}
            </p>

            {selectedItem.location && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  {(selectedItem.location as any).address || (selectedItem.location as any).areaName || 'Location'}
                </span>
              </div>
            )}

            <CustomButton
              title={t('common.close')}
              onClick={() => setSelectedItem(null)}
              variant="secondary"
              className="w-full mt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
};
