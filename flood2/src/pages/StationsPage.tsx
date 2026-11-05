import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit2,
  Battery,
  Sliders,
  History,
  Save,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { Station, Reading } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { DemoBadge } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StaleDataWarning } from '@/components/common/StaleDataWarning';
import { formatTime, timeAgo } from '@/utils/date';

export const StationsPage: React.FC = () => {
  const { t } = useTranslation();
  const isMock = isMockDataEnabled();

  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    riverBasin: string;
    latitude: number | string;
    longitude: number | string;
    elevation: number | string;
    normalMax: number | string;
    watchMax: number | string;
    warningMax: number | string;
    dangerMax: number | string;
  }>({
    name: '',
    code: '',
    riverBasin: '',
    latitude: 0,
    longitude: 0,
    elevation: 0,
    normalMax: 5.0,
    watchMax: 7.0,
    warningMax: 9.0,
    dangerMax: 11.0,
  });

  const fetchData = async () => {
    try {
      setError(null);
      const data = await apiClient.getStations();
      setStations(data);
      if (data.length > 0) {
        setSelectedStation(data[0]);
        loadStationHistory(data[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load monitoring station registry.');
    } finally {
      setLoading(false);
    }
  };

  const loadStationHistory = async (stationId: string) => {
    try {
      const history = await apiClient.getReadings({ stationId, limit: 30 });
      setReadings(history);
    } catch (err) {
      console.error('Failed to load station readings history', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectStation = (stn: Station) => {
    setSelectedStation(stn);
    setIsEditing(false);
    setIsCreating(false);
    loadStationHistory(stn.id);
  };

  const startCreate = () => {
    setFormData({
      name: '',
      code: `STN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      riverBasin: 'Kaveri Basin',
      latitude: 12.0,
      longitude: 78.0,
      elevation: 100,
      normalMax: 5.0,
      watchMax: 7.0,
      warningMax: 8.5,
      dangerMax: 10.0,
    });
    setFormError(null);
    setIsCreating(true);
    setIsEditing(false);
  };

  const startEdit = (stn: Station) => {
    setFormData({
      name: stn.name,
      code: stn.code,
      riverBasin: stn.riverBasin,
      latitude: stn.latitude,
      longitude: stn.longitude,
      elevation: stn.elevation,
      normalMax: stn.thresholds.normalMax,
      watchMax: stn.thresholds.watchMax,
      warningMax: stn.thresholds.warningMax,
      dangerMax: stn.thresholds.dangerMax,
    });
    setFormError(null);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError('Station Name is required.');
      return;
    }
    if (!formData.riverBasin.trim()) {
      setFormError('River Basin is required.');
      return;
    }
    const lat = parseFloat(String(formData.latitude));
    const lon = parseFloat(String(formData.longitude));
    const elev = parseFloat(String(formData.elevation)) || 0;
    const normalMax = parseFloat(String(formData.normalMax));
    const watchMax = parseFloat(String(formData.watchMax));
    const warningMax = parseFloat(String(formData.warningMax));
    const dangerMax = parseFloat(String(formData.dangerMax));

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude must be between -90 and +90 degrees.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setFormError('Longitude must be between -180 and +180 degrees.');
      return;
    }
    if (isNaN(normalMax) || isNaN(watchMax) || isNaN(warningMax) || isNaN(dangerMax)) {
      setFormError('All threshold values must be valid numbers.');
      return;
    }
    if (
      normalMax >= watchMax ||
      watchMax >= warningMax ||
      warningMax >= dangerMax
    ) {
      setFormError('Threshold values must strictly ascend: Normal < Watch < Warning < Danger.');
      return;
    }

    try {
      if (isCreating) {
        const newStation = await apiClient.createStation({
          name: formData.name.trim(),
          code: formData.code.trim(),
          riverBasin: formData.riverBasin.trim(),
          latitude: lat,
          longitude: lon,
          elevation: elev,
          status: 'online',
          batteryLevel: 98,
          signalRssi: -75,
          signalSnr: 9.0,
          lastSeen: new Date().toISOString(),
          firmwareVersion: 'v2.4.1-rc',
          sensorHealth: {
            waterLevelSensor: 'healthy',
            rainGauge: 'healthy',
            soilMoistureSensor: 'healthy',
            weatherSensor: 'healthy',
          },
          thresholds: {
            normalMax,
            watchMax,
            warningMax,
            dangerMax,
          },
        });
        setStations([newStation, ...stations]);
        setSelectedStation(newStation);
        setIsCreating(false);
      } else if (isEditing && selectedStation) {
        const updated = await apiClient.updateStation(selectedStation.id, {
          name: formData.name.trim(),
          riverBasin: formData.riverBasin.trim(),
          latitude: lat,
          longitude: lon,
          elevation: elev,
          thresholds: {
            normalMax,
            watchMax,
            warningMax,
            dangerMax,
          },
        });
        setStations(stations.map((s) => (s.id === updated.id ? updated : s)));
        setSelectedStation(updated);
        setIsEditing(false);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save station registry entry.');
    }
  };

  const chartHistoryData = useMemo(() => {
    return readings
      .slice()
      .reverse()
      .map((r) => ({
        time: formatTime(r.timestamp),
        waterLevel: r.waterLevel,
        rainfall: r.rainfall,
      }));
  }, [readings]);

  if (loading) {
    return <LoadingSpinner label="Loading telemetry station registry..." size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('stations.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('stations.subtitle')}
          </p>
        </div>

        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          {t('stations.addStation')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Station Registry List */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2 max-h-[780px] overflow-y-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Registered Hydrometric Stations ({stations.length})
          </h2>

          {stations.map((stn) => {
            const isSelected = selectedStation?.id === stn.id;

            return (
              <div
                key={stn.id}
                onClick={() => handleSelectStation(stn)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 ring-1 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate text-sm">
                      {stn.name}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                      {stn.riverBasin} &bull; {stn.code}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      stn.status === 'online'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : stn.status === 'degraded'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {stn.status}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Elev: {stn.elevation}m</span>
                  <span>Bat: {stn.batteryLevel}%</span>
                  <span>{timeAgo(stn.lastSeen)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 2 Columns: Station Detail / Edit / Create View */}
        <div className="lg:col-span-2 space-y-6">
          {isCreating || isEditing ? (
            /* Add / Edit Station Form */
            <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isCreating ? t('stations.addStation') : t('stations.editStation')}
                </h2>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('stations.stationName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Kaveri Upper Weir - Station 4"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('stations.riverBasin')} *
                    </label>
                    <input
                      type="text"
                      value={formData.riverBasin}
                      onChange={(e) => setFormData({ ...formData, riverBasin: e.target.value })}
                      placeholder="e.g. Kaveri Basin"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Latitude (-90 to +90) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Longitude (-180 to +180) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Elevation above MSL (meters)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.elevation}
                      onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hardware Station Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      disabled={isEditing}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-slate-500"
                    />
                  </div>
                </div>

                {/* Threshold Configuration */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Water Level Trigger Thresholds (Meters)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                        Normal Max (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.normalMax}
                        onChange={(e) => setFormData({ ...formData, normalMax: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
                        Watch Max (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.watchMax}
                        onChange={(e) => setFormData({ ...formData, watchMax: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-orange-600 dark:text-orange-400 mb-1">
                        Warning Max (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.warningMax}
                        onChange={(e) => setFormData({ ...formData, warningMax: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-red-600 dark:text-red-400 mb-1">
                        Danger Max (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.dangerMax}
                        onChange={(e) => setFormData({ ...formData, dangerMax: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    {t('stations.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    {t('stations.save')}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedStation ? (
            /* Selected Station Detail View */
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedStation.name}
                      </h2>
                      {isMock && <DemoBadge size="sm" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Code: <span className="font-mono">{selectedStation.code}</span> &bull; Basin:{' '}
                      <span className="font-semibold">{selectedStation.riverBasin}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => startEdit(selectedStation)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-center"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t('stations.editStation')}
                  </button>
                </div>

                {/* Hardware & Diagnostic Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Geo Coordinates</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedStation.latitude.toFixed(4)}, {selectedStation.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Elevation (MSL)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedStation.elevation} m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Battery & Power</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-emerald-500" />
                      {selectedStation.batteryLevel}% (Solar Charge)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Firmware / Link</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedStation.firmwareVersion} ({selectedStation.signalRssi ?? '-72'} dBm)
                    </span>
                  </div>
                </div>

                {/* Sensor Health Indicator Grid */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Telemetry Hardware Subsystems Health
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.entries(selectedStation.sensorHealth).map(([sensorKey, status]) => (
                      <div
                        key={sensorKey}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                          {sensorKey.replace(/Sensor|Gauge/, '')}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            status === 'healthy'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : status === 'degraded'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Station Telemetry Readings History Chart */}
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-sky-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t('stations.history')} (Last 24 Hours)
                    </h3>
                  </div>
                  <StaleDataWarning lastUpdated={selectedStation.lastSeen} />
                </div>

                <div className="h-60 w-full">
                  {chartHistoryData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No historical readings available for this station.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="stnHistoryGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '8px',
                            color: '#f8fafc',
                            fontSize: '11px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="waterLevel"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          fill="url(#stnHistoryGrad)"
                          name="Water Level (m)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Select a hydrometric station from the left registry to inspect telemetry and configure alert thresholds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
