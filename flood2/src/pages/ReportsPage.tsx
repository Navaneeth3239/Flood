import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  Calendar,
  Filter,
  BarChart3,
  Waves,
  CloudRain,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { HistoricalReportSummary, Station, Reading } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { DemoBadge } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { exportToCsv } from '@/utils/exportCsv';
import { formatWaterLevel } from '@/utils/formatters';

export const ReportsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isMock = isMockDataEnabled();

  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [reportSummary, setReportSummary] = useState<HistoricalReportSummary | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const fromDate = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
      const toDate = new Date().toISOString();

      const [stns, summary, rds] = await Promise.all([
        apiClient.getStations(),
        apiClient.getReportSummary(fromDate, toDate),
        apiClient.getReadings({
          stationId: selectedStationId === 'all' ? undefined : selectedStationId,
          from: fromDate,
          to: toDate,
          limit: 150,
        }),
      ]);

      setStations(stns);
      setReportSummary(summary);
      setReadings(rds);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate historical hydrological report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedStationId]);

  const handleExportCsv = () => {
    if (!readings || readings.length === 0) {
      alert('No data points to export.');
      return;
    }

    const exportRows = readings.map((r) => {
      const stn = stations.find((s) => s.id === r.stationId);
      return {
        Reading_ID: r.id,
        Station_Name: stn?.name || r.stationId,
        River_Basin: stn?.riverBasin || 'N/A',
        Timestamp_ISO: r.timestamp,
        Water_Level_Meters: r.waterLevel ?? 'No data',
        Rainfall_mm_per_hr: r.rainfall ?? 'No data',
        Soil_Moisture_Pct: r.soilMoisture ?? 'No data',
        Temperature_C: r.temperature ?? 'No data',
        Flow_Rate_cumecs: r.flowRate ?? 'No data',
        Trend: r.trend,
        Data_Quality: r.dataQuality,
        Source: r.source,
      };
    });

    const headers = [
      { key: 'Reading_ID' as const, label: t('reports.csv.readingId') },
      { key: 'Station_Name' as const, label: t('reports.csv.stationName') },
      { key: 'River_Basin' as const, label: t('reports.csv.riverBasin') },
      { key: 'Timestamp_ISO' as const, label: t('reports.csv.timestamp') },
      { key: 'Water_Level_Meters' as const, label: t('reports.csv.waterLevel') },
      { key: 'Rainfall_mm_per_hr' as const, label: t('reports.csv.rainfall') },
      { key: 'Soil_Moisture_Pct' as const, label: t('reports.csv.soilMoisture') },
      { key: 'Temperature_C' as const, label: t('reports.csv.temperature') },
      { key: 'Flow_Rate_cumecs' as const, label: t('reports.csv.flowRate') },
      { key: 'Trend' as const, label: t('reports.csv.trend') },
      { key: 'Data_Quality' as const, label: t('reports.csv.dataQuality') },
      { key: 'Source' as const, label: t('reports.csv.source') },
    ];

    exportToCsv(
      exportRows,
      `FloodGuard_Report_${selectedStationId}_${dateRange}_${new Date().toISOString().slice(0, 10)}`,
      headers
    );
  };

  // Aggregated daily/sample chart points
  const aggregatedChartData = useMemo(() => {
    return readings
      .slice(0, 20)
      .reverse()
      .map((r, i) => {
        const d = new Date(r.timestamp);
        const dateLabel = `${d.toLocaleDateString(i18n.language === 'ml' ? 'ml-IN' : undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(i18n.language === 'ml' ? 'ml-IN' : undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        return {
          index: i + 1,
          date: dateLabel,
          waterLevel: r.waterLevel,
          rainfall: r.rainfall,
        };
      });
  }, [readings, i18n.language]);

  if (loading) {
    return <LoadingSpinner label="Compiling historical hydrological statistics..." size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchReportData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('reports.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('reports.subtitle')}
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          {t('reports.exportCsv')}
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {t('reports.dateRange')}:
          </span>
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === '7d' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === '30d' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === '90d' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {t('reports.selectStation')}:
          </span>
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All River Basins & Stations</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      {reportSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {t('reports.totalRainfall')}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                {reportSummary.totalRainfallMm} mm
              </span>
              <span className="text-[11px] text-slate-400">Cumulative Precipitation</span>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600">
              <CloudRain className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {t('reports.peakLevel')}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                {formatWaterLevel(reportSummary.peakWaterLevelMeters)}
              </span>
              <span className="text-[11px] text-slate-400">Recorded at Old Railway Bridge</span>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600">
              <Waves className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {t('reports.warningsCount')}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                {reportSummary.warningsIssued}
              </span>
              <span className="text-[11px] text-slate-400">High Inflow Alerts</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {t('reports.floodEvents')}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                {reportSummary.floodIncidentsCount}
              </span>
              <span className="text-[11px] text-slate-400">Verified Inundations</span>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Historical Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Historical Water Level Trajectory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Periodic readings captured across selected monitoring period
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregatedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
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
                <Line
                  type="monotone"
                  dataKey="waterLevel"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Water Level (m)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Historical Precipitation Volumes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Hourly rain intensity records (mm/h)
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregatedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
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
                <Bar dataKey="rainfall" fill="#38bdf8" radius={[3, 3, 0, 0]} name="Rainfall (mm/h)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Station Statistics Table */}
      {reportSummary && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Basin Station Performance Summary
            </h3>
            <span className="text-xs text-slate-500">{reportSummary.stationStats.length} Stations Audited</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Station Name</th>
                  <th className="px-4 py-3">Avg Water Level</th>
                  <th className="px-4 py-3">Max Water Level</th>
                  <th className="px-4 py-3">Accumulated Rain</th>
                  <th className="px-4 py-3">Telemetry Uptime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {reportSummary.stationStats.map((stn) => (
                  <tr key={stn.stationId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {stn.stationName}
                    </td>
                    <td className="px-4 py-3">{formatWaterLevel(stn.avgWaterLevel)}</td>
                    <td className="px-4 py-3 font-bold text-sky-600 dark:text-sky-400">
                      {formatWaterLevel(stn.maxWaterLevel)}
                    </td>
                    <td className="px-4 py-3">{stn.totalRainfall} mm</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          stn.uptimePercent > 95
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {stn.uptimePercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
