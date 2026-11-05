import React, { useState } from 'react';
import {
  X,
  Activity,
  CloudRain,
  Battery,
  Wifi,
  Navigation,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Station, Reading } from '@/types';
import { formatWaterLevel, formatRainfall } from '@/utils/formatters';
import { timeAgo } from '@/utils/date';
import { getStationAIPrediction } from '@/services/predictionService';

interface StationDetailsPanelProps {
  station: Station | null;
  reading?: Reading;
  onClose: () => void;
  onFlyTo: (lat: number, lng: number) => void;
}

export const StationDetailsPanel: React.FC<StationDetailsPanelProps> = ({
  station,
  reading,
  onClose,
  onFlyTo,
}) => {
  const [selectedHorizonIndex, setSelectedHorizonIndex] = useState(0);

  if (!station) return null;

  const aiInsight = getStationAIPrediction(station.id);
  const selectedHorizon = aiInsight?.horizons[selectedHorizonIndex];

  // Severity determination
  let currentSeverity = 'normal';
  if (station.status === 'offline') {
    currentSeverity = 'unknown';
  } else if (reading?.waterLevel && reading.waterLevel >= station.thresholds.dangerMax) {
    currentSeverity = 'danger';
  } else if (reading?.waterLevel && reading.waterLevel >= station.thresholds.warningMax) {
    currentSeverity = 'warning';
  } else if (reading?.waterLevel && reading.waterLevel >= station.thresholds.watchMax) {
    currentSeverity = 'watch';
  }

  const severityBadgeClass =
    currentSeverity === 'danger'
      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-300 dark:border-red-800'
      : currentSeverity === 'warning'
      ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border-orange-300 dark:border-orange-800'
      : currentSeverity === 'watch'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-800'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';

  return (
    <div className="absolute top-4 left-4 z-30 w-84 sm:w-96 max-h-[calc(100vh-220px)] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4 animate-in slide-in-from-left-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${severityBadgeClass}`}
            >
              {currentSeverity}
            </span>
            <span className="font-mono text-[10px] text-slate-400 uppercase">{station.code}</span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
            {station.name}
          </h3>
          <p className="text-[11px] text-slate-500 truncate">{station.riverBasin}</p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close station details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Fly to & Coordinates Bar */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-[11px]">
        <div className="font-mono text-slate-600 dark:text-slate-300">
          {station.latitude.toFixed(4)}°N, {station.longitude.toFixed(4)}°E
        </div>
        <button
          onClick={() => onFlyTo(station.latitude, station.longitude)}
          className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold hover:underline"
        >
          <Navigation className="w-3.5 h-3.5" />
          Focus 3D View
        </button>
      </div>

      {/* Real-time Telemetry Metrics */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            <span>Water Level</span>
          </div>
          <div className="font-bold text-base text-slate-900 dark:text-white">
            {formatWaterLevel(reading?.waterLevel)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Ref: {station.elevation}m MSL datum
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
            <CloudRain className="w-3.5 h-3.5 text-sky-500" />
            <span>Rainfall (1h)</span>
          </div>
          <div className="font-bold text-base text-slate-900 dark:text-white">
            {formatRainfall(reading?.rainfall)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tipping bucket gauge</div>
        </div>
      </div>

      {/* Threshold Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-500">Threshold Status:</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Danger: {station.thresholds.dangerMax}m
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${(station.thresholds.watchMax / station.thresholds.dangerMax) * 60}%` }}
            title="Normal zone"
          />
          <div
            className="bg-amber-500 h-full"
            style={{ width: '15%' }}
            title="Watch zone"
          />
          <div
            className="bg-orange-500 h-full"
            style={{ width: '15%' }}
            title="Warning zone"
          />
          <div
            className="bg-red-500 h-full"
            style={{ width: '10%' }}
            title="Danger zone"
          />
        </div>
      </div>

      {/* GNN-Transformer AI Prediction Card */}
      {aiInsight && (
        <div className="p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              GNN–Transformer Forecast
            </span>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
              Peak: {aiInsight.predictedPeakLevel}m
            </span>
          </div>

          {/* Horizon Pills */}
          <div className="grid grid-cols-5 gap-1">
            {aiInsight.horizons.map((h, idx) => (
              <button
                key={h.hoursAhead}
                onClick={() => setSelectedHorizonIndex(idx)}
                className={`py-1 text-center font-mono rounded text-[10px] font-semibold transition-all ${
                  selectedHorizonIndex === idx
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>

          {selectedHorizon && (
            <div className="pt-1.5 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Projected Water Level:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {selectedHorizon.predictedWaterLevel.toFixed(2)} m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Model Confidence:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {Math.round(selectedHorizon.confidence * 100)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Hydro Trend:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize flex items-center gap-1">
                  {selectedHorizon.trend === 'rising' && <TrendingUp className="w-3 h-3 text-red-500" />}
                  {selectedHorizon.trend === 'peaking' && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                  {selectedHorizon.trend === 'receding' && <TrendingDown className="w-3 h-3 text-emerald-500" />}
                  {selectedHorizon.trend === 'stable' && <Minus className="w-3 h-3 text-slate-500" />}
                  {selectedHorizon.trend}
                </span>
              </div>
            </div>
          )}

          {/* Contributing Factors Breakdown */}
          <div className="pt-2 border-t border-sky-200/60 dark:border-sky-800/60 text-[10px] space-y-1 text-slate-500 dark:text-slate-400">
            <span className="font-semibold block text-slate-700 dark:text-slate-300">
              Key Contributing Drivers:
            </span>
            <div className="flex justify-between">
              <span>Upstream Discharge:</span>
              <span className="font-mono font-medium">{aiInsight.factors.upstreamDischargeInfluence}%</span>
            </div>
            <div className="flex justify-between">
              <span>Catchment Rainfall:</span>
              <span className="font-mono font-medium">{aiInsight.factors.catchmentRainfallIntensity}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Telemetry & Last Update Footer */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Battery className="w-3.5 h-3.5 text-emerald-500" />
            {station.batteryLevel}%
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-sky-500" />
            LoRaWAN
          </span>
        </div>
        <span>{reading ? timeAgo(reading.timestamp) : 'Live'}</span>
      </div>
    </div>
  );
};
