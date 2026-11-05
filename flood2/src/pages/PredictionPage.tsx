import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Percent,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

import { Station, Prediction } from '@/types';
import { apiClient, isMockDataEnabled } from '@/api';
import { DemoBadge } from '@/components/common/DemoBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { getSeverityClasses, formatWaterLevel } from '@/utils/formatters';

export const PredictionPage: React.FC = () => {
  const { t } = useTranslation();
  const isMock = isMockDataEnabled();

  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('STN-YM-001');
  const [windowSize, setWindowSize] = useState<'3h' | '6h' | '12h' | '24h' | '48h'>('6h');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStations = async () => {
      try {
        const stns = await apiClient.getStations();
        setStations(stns);
        if (stns.length > 0 && !stns.some((s) => s.id === selectedStationId)) {
          setSelectedStationId(stns[0].id);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load station list');
      }
    };
    loadStations();
  }, []);

  const fetchPrediction = async () => {
    if (!selectedStationId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getPrediction(selectedStationId, windowSize);
      setPrediction(result);
    } catch (err: any) {
      setError(err?.message || 'Prediction inference service error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [selectedStationId, windowSize]);

  const selectedStation = stations.find((s) => s.id === selectedStationId);

  const factorColors = ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('prediction.title')}
            </h1>
            {isMock && <DemoBadge size="md" />}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('prediction.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchPrediction}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('prediction.runPrediction')}
        </button>
      </div>

      {/* Mandatory Prominent Prediction Support Disclaimer Note */}
      <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5 shadow-xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="font-medium">
          <strong>Notice:</strong> {t('app.predictionDisclaimer')}. Model outputs are generated to assist hydrologic engineers and response teams with situational awareness; never make critical evacuation decisions without corroborating official National/State Disaster Management directives.
        </span>
      </div>

      {/* Selector Controls Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('prediction.selectStation')}:
          </label>
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-sky-500 shadow-xs"
          >
            {stations.map((stn) => (
              <option key={stn.id} value={stn.id}>
                {stn.name} ({stn.riverBasin})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {t('prediction.timeWindow')}:
          </label>
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
            {(['3h', '6h', '12h', '24h', '48h'] as const).map((win) => (
              <button
                key={win}
                onClick={() => setWindowSize(win)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  windowSize === win
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {win.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prediction Output Section */}
      {loading ? (
        <LoadingSpinner label="Running hydrological machine learning inference..." size="lg" />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchPrediction} />
      ) : !prediction ? (
        /* Empty / Model Unavailable State */
        <EmptyState
          title={t('prediction.modelUnavailable')}
          description="The AI prediction microservice is currently unable to compute a forecast for this station or window. Fallback to physical threshold rules."
          action={{
            label: 'Try Alternate Station / Window',
            onClick: () => {
              setSelectedStationId('STN-YM-001');
              setWindowSize('6h');
            },
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Key Forecast Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Risk Category Card */}
            {(() => {
              const sev = getSeverityClasses(prediction.riskCategory);
              return (
                <div
                  className={`p-5 rounded-2xl border ${sev.bg} ${sev.border} shadow-xs flex flex-col justify-between`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t('prediction.predictedRisk')}
                  </span>
                  <div className="my-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-lg font-black uppercase tracking-wider ${sev.badge}`}
                    >
                      {prediction.riskCategory}
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80">{prediction.forecastPeriod}</span>
                </div>
              );
            })()}

            {/* Estimated Peak Water Level */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('prediction.predictedWaterLevel')}
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {formatWaterLevel(prediction.predictedWaterLevel)}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  (Current: {formatWaterLevel(prediction.currentWaterLevel)})
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Delta:{' '}
                <span
                  className={
                    prediction.predictedWaterLevel > prediction.currentWaterLevel
                      ? 'text-red-500 font-bold'
                      : 'text-emerald-500 font-bold'
                  }
                >
                  {prediction.predictedWaterLevel >= prediction.currentWaterLevel ? '+' : ''}
                  {(prediction.predictedWaterLevel - prediction.currentWaterLevel).toFixed(2)} m
                </span>
              </span>
            </div>

            {/* Optional Model Confidence - HONESTY RULE: Only show if provided by API */}
            {prediction.confidence !== undefined ? (
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('prediction.modelConfidence')}
                </span>
                <div className="my-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-400">
                    {prediction.confidence}%
                  </span>
                  <Percent className="w-4 h-4 text-sky-500" />
                </div>
                <span className="text-[11px] text-slate-500">
                  Ensemble validation score based on historical flood events
                </span>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Model Confidence
                </span>
                <div className="my-2">
                  <span className="text-xs italic text-slate-400">
                    Not calibrated for this horizon
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Per data-honesty protocol, confidence is hidden when unmeasured
                </span>
              </div>
            )}

            {/* Station Elevation Reference */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Warning Thresholds
              </span>
              <div className="my-2 text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-amber-500">Watch:</span>
                  <span>{selectedStation?.thresholds.watchMax}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-500">Warning:</span>
                  <span>{selectedStation?.thresholds.warningMax}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500">Danger:</span>
                  <span>{selectedStation?.thresholds.dangerMax}m</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-500">MSL Gauge Zero</span>
            </div>
          </div>

          {/* Primary Contributing Factors Bar Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('prediction.contributingFactors')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Weighted SHAP impact attribution on predicted river discharge
                </p>
              </div>
              {isMock && <DemoBadge size="sm" />}
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prediction.contributingFactors}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                  <XAxis type="number" unit="%" stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    width={180}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Relative Impact']}
                  />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                    {prediction.contributingFactors.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={factorColors[index % factorColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Contributing Factor Explanations */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {prediction.contributingFactors.map((f, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
                    {f.name} ({f.impact}%)
                  </span>
                  <p className="text-slate-500 dark:text-slate-400">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
