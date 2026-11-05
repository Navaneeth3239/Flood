import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Radio,
  AlertTriangle,
  Waves,
  CloudRain,
  MapPin,
  BatteryCharging,
  ArrowRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

import { Station, Reading, Alert } from '@/types';
import { apiClient, isMockDataEnabled, webSocketService } from '@/api';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DemoBadge } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StaleDataWarning, LastUpdatedBadge } from '@/components/common/StaleDataWarning';
import { formatWaterLevel, formatRainfall, getSeverityClasses } from '@/utils/formatters';
import { formatTime, timeAgo } from '@/utils/date';
import { createColorIcon, severityMarkerColors, setupLeafletIcons } from '@/utils/leafletIcons';

setupLeafletIcons();

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const isMock = isMockDataEnabled();

  const [stations, setStations] = useState<Station[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string>('STN-YM-001');
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toISOString());

  const fetchData = async () => {
    try {
      setError(null);
      const [fetchedStations, fetchedReadings, fetchedAlerts] = await Promise.all([
        apiClient.getStations(),
        apiClient.getReadings({ limit: 120 }),
        apiClient.getAlerts({ status: 'active' }),
      ]);
      setStations(fetchedStations);
      setReadings(fetchedReadings);
      setAlerts(fetchedAlerts);
      setLastRefreshed(new Date().toISOString());
      if (fetchedStations.length > 0 && !fetchedStations.some((s) => s.id === selectedStationId)) {
        setSelectedStationId(fetchedStations[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard hydrometric telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to real-time WebSocket updates
    const unsubscribeWs = webSocketService.onMessage((msg) => {
      if (msg.type === 'reading') {
        const newReading = msg.payload as Reading;
        setReadings((prev) => [newReading, ...prev.slice(0, 150)]);
        setLastRefreshed(new Date().toISOString());
      } else if (msg.type === 'alert') {
        const newAlert = msg.payload as Alert;
        setAlerts((prev) => [newAlert, ...prev]);
      }
    });

    const pollInterval = setInterval(fetchData, 30000);
    return () => {
      unsubscribeWs();
      clearInterval(pollInterval);
    };
  }, []);

  // Compute key KPIs
  const totalStations = stations.length;
  const onlineStations = stations.filter((s) => s.status === 'online').length;
  const activeWarningsCount = alerts.filter(
    (a) => a.severity === 'warning' || a.severity === 'danger'
  ).length;

  const currentStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) || stations[0],
    [stations, selectedStationId]
  );

  // Latest readings map by station
  const latestReadingsMap = useMemo(() => {
    const map = new Map<string, Reading>();
    readings.forEach((r) => {
      if (!map.has(r.stationId)) {
        map.set(r.stationId, r);
      }
    });
    return map;
  }, [readings]);

  // High risk stations count
  const highRiskStationsCount = useMemo(() => {
    return stations.filter((stn) => {
      const stnId = stn.id || (stn as any).sensor_id;
      const latest = latestReadingsMap.get(stnId) || latestReadingsMap.get(stn.id);
      if (!latest || latest.waterLevel === null || isNaN(latest.waterLevel)) return false;
      const warningThresh = stn.thresholds?.warningMax ?? 9.5;
      return latest.waterLevel >= warningThresh;
    }).length;
  }, [stations, latestReadingsMap]);

  // Average rainfall across active stations
  const avgRainfall = useMemo(() => {
    const validReadings = Array.from(latestReadingsMap.values()).filter(
      (r) => r.rainfall !== null && !isNaN(r.rainfall)
    );
    if (validReadings.length === 0) return null;
    const sum = validReadings.reduce((acc, curr) => acc + (curr.rainfall || 0), 0);
    return +(sum / validReadings.length).toFixed(1);
  }, [latestReadingsMap]);

  // Highest recorded water level among all active readings
  const highestWaterLevelInfo = useMemo(() => {
    let peak = -Infinity;
    let stationName = '';
    stations.forEach((stn) => {
      const stnId = stn.id || (stn as any).sensor_id;
      const r = latestReadingsMap.get(stnId) || latestReadingsMap.get(stn.id);
      if (r && r.waterLevel !== null && !isNaN(r.waterLevel) && r.waterLevel > peak) {
        peak = r.waterLevel;
        const rawName = stn.name || (stn as any).location_name || 'Station';
        stationName = rawName.split('-')[0].trim();
      }
    });
    return peak === -Infinity ? null : { value: peak, station: stationName };
  }, [stations, latestReadingsMap]);

  // Selected station time-series data for chart
  const selectedStationSeries = useMemo(() => {
    if (!selectedStationId) return [];
    return readings
      .filter((r) => r.stationId === selectedStationId && r.waterLevel !== null)
      .slice(0, 24)
      .reverse()
      .map((r) => ({
        time: formatTime(r.timestamp),
        timestamp: r.timestamp,
        waterLevel: r.waterLevel,
        rainfall: r.rainfall,
        flowRate: r.flowRate,
      }));
  }, [readings, selectedStationId]);

  if (loading) {
    return <LoadingSpinner label="Initializing hydrologic monitoring streams..." size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with persistent DEMO BADGE & Stale warning */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('dashboard.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Aggregated basin telemetry, AI flood thresholds, and emergency warnings
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <StaleDataWarning lastUpdated={lastRefreshed} />
          <LastUpdatedBadge timestamp={lastRefreshed} />
        </div>
      </div>

      {/* KPI Cards Grid - arranged in two rows of 3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title={t('dashboard.kpiTotalStations')}
          value={totalStations}
          subtitle={`${onlineStations}/${totalStations} online`}
          icon={Radio}
          severity={onlineStations === totalStations ? 'normal' : 'watch'}
        />
        <KpiCard
          title={t('dashboard.kpiOnlineStatus')}
          value={`${Math.round((onlineStations / (totalStations || 1)) * 100)}%`}
          subtitle={`${totalStations - onlineStations} offline / degraded`}
          icon={Activity}
          severity={onlineStations >= totalStations - 1 ? 'normal' : 'danger'}
        />
        <KpiCard
          title={t('dashboard.kpiActiveWarnings')}
          value={activeWarningsCount}
          subtitle="Critical threshold alerts"
          icon={AlertTriangle}
          severity={activeWarningsCount > 0 ? 'danger' : 'normal'}
        />
        <KpiCard
          title={t('dashboard.kpiHighRisk')}
          value={highRiskStationsCount}
          subtitle="Above warning mark"
          icon={MapPin}
          severity={highRiskStationsCount > 0 ? 'warning' : 'normal'}
        />
        <KpiCard
          title={t('dashboard.kpiAvgRainfall')}
          value={avgRainfall !== null ? avgRainfall : 'No data'}
          unit="mm/h"
          subtitle="Catchment basin mean"
          icon={CloudRain}
          severity={avgRainfall && avgRainfall > 30 ? 'warning' : 'normal'}
        />
        <KpiCard
          title={t('dashboard.kpiPeakWaterLevel')}
          value={highestWaterLevelInfo ? highestWaterLevelInfo.value.toFixed(1) : 'No data'}
          unit="m"
          subtitle={highestWaterLevelInfo ? highestWaterLevelInfo.station : 'Active stations'}
          icon={Waves}
          severity={highestWaterLevelInfo && highestWaterLevelInfo.value > 200 ? 'danger' : 'normal'}
        />
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Hydrograph Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('dashboard.waterLevelTitle')}
                </h2>
                {isMock && <DemoBadge size="sm" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Water elevation relative to Normal, Watch, Warning, and Danger thresholds
              </p>
            </div>

            {/* Station Selector Dropdown */}
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              aria-label="Select monitoring station for hydrograph"
            >
              {stations.map((s, idx) => {
                const sId = String(s.id || (s as any).sensor_id || `station-opt-${idx}`);
                const sName = s.name || (s as any).location_name || sId;
                const sBasin = s.riverBasin || (s as any).river_basin || 'General Basin';
                return (
                  <option key={sId} value={sId}>
                    {sName} ({sBasin})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Hydrograph Area Chart */}
          <div className="h-64 sm:h-72 w-full mt-2">
            {selectedStationSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No telemetry readings recorded for this station.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedStationSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="waterLevelGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    domain={[
                      (dataMin: number) => Math.max(0, +(dataMin * 0.9).toFixed(1)),
                      (dataMax: number) => +(dataMax * 1.1).toFixed(1),
                    ]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} m`, 'Water Level']}
                  />
                  {currentStation && (
                    <>
                      <ReferenceLine
                        y={currentStation.thresholds.dangerMax}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{
                          value: `Danger (${currentStation.thresholds.dangerMax}m)`,
                          fill: '#ef4444',
                          fontSize: 10,
                          position: 'insideTopRight',
                        }}
                      />
                      <ReferenceLine
                        y={currentStation.thresholds.warningMax}
                        stroke="#f97316"
                        strokeDasharray="3 3"
                        label={{
                          value: `Warning (${currentStation.thresholds.warningMax}m)`,
                          fill: '#f97316',
                          fontSize: 10,
                          position: 'insideTopRight',
                        }}
                      />
                    </>
                  )}
                  <Area
                    type="monotone"
                    dataKey="waterLevel"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#waterLevelGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Precipitation bar chart subordinate */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                {t('dashboard.rainfallTitle')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Hourly Precipitation (mm/h)
              </span>
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedStationSeries} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`${val} mm/h`, 'Rainfall']}
                  />
                  <Bar dataKey="rainfall" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Col: Mini Map & Station Telemetry */}
        <div className="space-y-6 flex flex-col">
          {/* Mini Risk Map Card */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('dashboard.riskMapPreview')}
                  </h3>
                  {isMock && <DemoBadge size="sm" />}
                </div>
                <span className="text-[11px] text-slate-500">Live hydrometric station distribution</span>
              </div>
              <Link
                to="/map"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                {t('dashboard.expandMap')} &rarr;
              </Link>
            </div>

            {/* Mini Map Container */}
            <div className="h-56 sm:h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-10">
              <MapContainer
                center={[18.5, 78.5]}
                zoom={4}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {stations.map((stn, idx) => {
                  const stnId = String(stn.id || (stn as any).sensor_id || `dashboard-marker-${idx}`);
                  const latest = latestReadingsMap.get(stnId) || latestReadingsMap.get(stn.id);
                  let sevColor = severityMarkerColors.normal;
                  const dangerThresh = stn.thresholds?.dangerMax ?? 11.0;
                  const warningThresh = stn.thresholds?.warningMax ?? 9.5;
                  const watchThresh = stn.thresholds?.watchMax ?? 8.0;

                  if (stn.status === 'offline') {
                    sevColor = severityMarkerColors.unknown;
                  } else if (latest?.waterLevel != null && latest.waterLevel >= dangerThresh) {
                    sevColor = severityMarkerColors.danger;
                  } else if (latest?.waterLevel != null && latest.waterLevel >= warningThresh) {
                    sevColor = severityMarkerColors.warning;
                  } else if (latest?.waterLevel != null && latest.waterLevel >= watchThresh) {
                    sevColor = severityMarkerColors.watch;
                  }

                  return (
                    <Marker
                      key={stnId}
                      position={[stn.latitude, stn.longitude]}
                      icon={createColorIcon(sevColor)}
                    >
                      <Popup>
                        <div className="text-xs p-1">
                          <p className="font-bold text-slate-900">{stn.name}</p>
                          <p className="text-slate-600">{stn.riverBasin}</p>
                          <p className="mt-1 font-semibold text-sky-700">
                            Water: {formatWaterLevel(latest?.waterLevel)}
                          </p>
                          <p className="text-slate-500">
                            Rain: {formatRainfall(latest?.rainfall)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            {/* Map Legend */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Watch
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Warning
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Danger
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Alerts Feed & Telemetry Battery Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('dashboard.recentAlerts')}
                </h3>
                {isMock && <DemoBadge size="sm" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Emergency bulletins triggered by water level threshold violations
              </p>
            </div>
            <Link
              to="/alerts"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              {t('dashboard.viewAllAlerts')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <span>No critical threshold alerts currently active across monitoring basins.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert, idx) => {
                const alertId = String(alert.id || (alert as any)._id || `alert-${idx}`);
                const sev = getSeverityClasses(alert.severity);
                return (
                  <div
                    key={alertId}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${sev.bg} ${sev.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${sev.badge} flex-shrink-0 mt-0.5`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {alert.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sev.badge}`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-2">
                          {alert.message}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{alert.stationName}</span>
                          <span>&bull;</span>
                          <span>{timeAgo(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/alerts"
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0 self-end sm:self-center"
                    >
                      Inspect &rarr;
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Battery & Telemetry Health Summary Card */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('dashboard.connectivitySummary')}
                </h3>
                <span className="text-[11px] text-slate-500">Hardware & power status</span>
              </div>
              <BatteryCharging className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="space-y-3">
              {stations.slice(0, 4).map((stn, idx) => {
                const stnId = String(stn.id || (stn as any).sensor_id || `health-stn-${idx}`);
                const isLowBattery = (stn.batteryLevel ?? 100) < 20;
                return (
                  <div
                    key={stnId}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {stn.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        LoRa: {stn.signalRssi ? `${stn.signalRssi} dBm` : 'Cellular 4G'} | SNR: {stn.signalSnr ?? 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isLowBattery
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {stn.batteryLevel}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">View diagnostic tree:</span>
            <Link
              to="/health"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              System Health &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
