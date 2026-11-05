import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  XCircle,
  Radio,
  Filter,
} from 'lucide-react';

import { Station, Reading } from '@/types';
import { apiClient, isMockDataEnabled, webSocketService } from '@/api';
import { DemoBadge } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { StaleDataWarning, LastUpdatedBadge } from '@/components/common/StaleDataWarning';
import {
  formatWaterLevel,
  formatRainfall,
  formatSoilMoisture,
  formatTemperature,
  formatHumidity,
  getSeverityClasses,
} from '@/utils/formatters';
import { timeAgo } from '@/utils/date';

export const LiveMonitoringPage: React.FC = () => {
  const { t } = useTranslation();
  const isMock = isMockDataEnabled();

  const [stations, setStations] = useState<Station[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBasin, setSelectedBasin] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toISOString());

  const fetchData = async () => {
    try {
      setError(null);
      const [allStations, allReadings] = await Promise.all([
        apiClient.getStations(),
        apiClient.getReadings({ limit: 100 }),
      ]);
      setStations(allStations);
      setReadings(allReadings);
      setLastRefreshed(new Date().toISOString());
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve live sensor telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to live WebSocket reading events
    const unsubscribeWs = webSocketService.onMessage((msg) => {
      if (msg.type === 'reading') {
        const incoming = msg.payload as Reading;
        setReadings((prev) => [incoming, ...prev.filter((r) => r.id !== incoming.id)]);
        setLastRefreshed(new Date().toISOString());
      }
    });

    return unsubscribeWs;
  }, []);

  // Map of latest reading per station
  const latestReadingsMap = useMemo(() => {
    const map = new Map<string, Reading>();
    readings.forEach((r) => {
      const existing = map.get(r.stationId);
      if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
        map.set(r.stationId, r);
      }
    });
    return map;
  }, [readings]);

  // Extract basins for filter
  const basins = useMemo(() => {
    const set = new Set<string>();
    stations.forEach((s) => set.add(s.riverBasin));
    return Array.from(set);
  }, [stations]);

  // Filtered stations
  const filteredStations = useMemo(() => {
    return stations.filter((stn) => {
      const matchesSearch =
        stn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stn.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stn.riverBasin.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBasin = selectedBasin === 'all' || stn.riverBasin === selectedBasin;
      return matchesSearch && matchesBasin;
    });
  }, [stations, searchQuery, selectedBasin]);

  const renderSensorBadge = (source: 'sensor' | 'mock') => {
    if (source === 'sensor') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t('status.realSensor')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {t('status.mockData')}
      </span>
    );
  };

  const renderTrendIcon = (trend: string) => {
    if (trend === 'rising') {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-xs">
          <TrendingUp className="w-3.5 h-3.5" />
          {t('status.rising')}
        </span>
      );
    }
    if (trend === 'falling') {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
          <TrendingDown className="w-3.5 h-3.5" />
          {t('status.falling')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-slate-500 font-bold text-xs">
        <Minus className="w-3.5 h-3.5" />
        {t('status.steady')}
      </span>
    );
  };

  const renderHealthIndicator = (status: 'healthy' | 'degraded' | 'failed') => {
    if (status === 'healthy') {
      return (
        <span title="Healthy">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        </span>
      );
    }
    if (status === 'degraded') {
      return (
        <span title="Degraded">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
        </span>
      );
    }
    return (
      <span title="Sensor Fault / Offline">
        <XCircle className="w-3.5 h-3.5 text-red-500" />
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner label="Connecting to hydrometric station stream..." size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('live.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('live.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <StaleDataWarning lastUpdated={lastRefreshed} />
          <LastUpdatedBadge timestamp={lastRefreshed} />

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              aria-label={t('live.viewCards')}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{t('live.viewCards')}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              aria-label={t('live.viewTable')}
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('live.viewTable')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('live.filterStation')}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={selectedBasin}
            onChange={(e) => setSelectedBasin(e.target.value)}
            className="text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-xs"
            aria-label="Filter by River Basin"
          >
            <option value="all">{t('live.allBasins')}</option>
            {basins.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Rendering: Cards or Table */}
      {filteredStations.length === 0 ? (
        <EmptyState
          title="No Monitoring Stations Found"
          description="Try broadening your search query or basin filter selection."
          action={{
            label: 'Reset Filters',
            onClick: () => {
              setSearchQuery('');
              setSelectedBasin('all');
            },
          }}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStations.map((stn) => {
            const reading = latestReadingsMap.get(stn.id);
            let severity = 'normal';
            if (stn.status === 'offline') {
              severity = 'unknown';
            } else if (reading?.waterLevel && reading.waterLevel >= stn.thresholds.dangerMax) {
              severity = 'danger';
            } else if (reading?.waterLevel && reading.waterLevel >= stn.thresholds.warningMax) {
              severity = 'warning';
            } else if (reading?.waterLevel && reading.waterLevel >= stn.thresholds.watchMax) {
              severity = 'watch';
            }

            const sev = getSeverityClasses(severity as any);

            return (
              <div
                key={stn.id}
                className={`rounded-2xl border bg-white dark:bg-slate-800/90 p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${sev.border}`}
              >
                <div>
                  {/* Station Title & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1">
                          {stn.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {stn.riverBasin} &bull; Code: {stn.code}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sev.badge}`}
                      >
                        {severity}
                      </span>
                      {renderSensorBadge(reading?.source || (isMock ? 'mock' : 'sensor'))}
                    </div>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                        {t('live.waterLevel')}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {formatWaterLevel(reading?.waterLevel)}
                        </span>
                      </div>
                      <div className="mt-1">
                        {reading ? renderTrendIcon(reading.trend) : <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                        {t('live.rainfall')}
                      </span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white block">
                        {formatRainfall(reading?.rainfall)}
                      </span>
                      <span className="text-[10px] text-slate-400">Past 60 mins</span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                        {t('live.soilMoisture')}
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatSoilMoisture(reading?.soilMoisture)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                        {t('live.tempHumidity')}
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatTemperature(reading?.temperature)} / {formatHumidity(reading?.humidity)}
                      </span>
                    </div>
                  </div>

                  {/* Sensor Diagnostics Status */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">Hardware Subsystems:</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1" title="Hydro Radar Gauge">
                          WL {renderHealthIndicator(stn.sensorHealth.waterLevelSensor)}
                        </span>
                        <span className="flex items-center gap-1" title="Tipping Bucket Rain Gauge">
                          RG {renderHealthIndicator(stn.sensorHealth.rainGauge)}
                        </span>
                        <span className="flex items-center gap-1" title="TDR Soil Probe">
                          SM {renderHealthIndicator(stn.sensorHealth.soilMoistureSensor)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-slate-400" />
                    Bat: {stn.batteryLevel}% | {stn.signalRssi ? `${stn.signalRssi}dBm` : 'GSM'}
                  </span>
                  <span>{reading ? timeAgo(reading.timestamp) : timeAgo(stn.lastSeen)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Station & Basin</th>
                  <th className="px-4 py-3">{t('live.waterLevel')}</th>
                  <th className="px-4 py-3">{t('live.trend')}</th>
                  <th className="px-4 py-3">{t('live.rainfall')}</th>
                  <th className="px-4 py-3">{t('live.soilMoisture')}</th>
                  <th className="px-4 py-3">{t('live.tempHumidity')}</th>
                  <th className="px-4 py-3">Data Source</th>
                  <th className="px-4 py-3">Battery & Signal</th>
                  <th className="px-4 py-3">{t('live.lastUpdate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredStations.map((stn) => {
                  const reading = latestReadingsMap.get(stn.id);
                  let severity = 'normal';
                  if (stn.status === 'offline') {
                    severity = 'unknown';
                  } else if (reading?.waterLevel && reading.waterLevel >= stn.thresholds.dangerMax) {
                    severity = 'danger';
                  } else if (reading?.waterLevel && reading.waterLevel >= stn.thresholds.warningMax) {
                    severity = 'warning';
                  } else if (reading?.waterLevel && reading.waterLevel >= stn.thresholds.watchMax) {
                    severity = 'watch';
                  }

                  const sev = getSeverityClasses(severity as any);

                  return (
                    <tr
                      key={stn.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{stn.name}</div>
                        <div className="text-[11px] text-slate-400">{stn.riverBasin}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${sev.text}`}>
                          {formatWaterLevel(reading?.waterLevel)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {reading ? renderTrendIcon(reading.trend) : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {formatRainfall(reading?.rainfall)}
                      </td>
                      <td className="px-4 py-3">{formatSoilMoisture(reading?.soilMoisture)}</td>
                      <td className="px-4 py-3">
                        {formatTemperature(reading?.temperature)} / {formatHumidity(reading?.humidity)}
                      </td>
                      <td className="px-4 py-3">
                        {renderSensorBadge(reading?.source || (isMock ? 'mock' : 'sensor'))}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {stn.batteryLevel}%
                        </span>{' '}
                        <span className="text-[11px] text-slate-400">
                          ({stn.signalRssi ? `${stn.signalRssi} dBm` : 'GSM'})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {reading ? timeAgo(reading.timestamp) : timeAgo(stn.lastSeen)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
