import React from 'react';
import {
  X,
  Activity,
  CloudRain,
  Battery,
  Wifi,
  Navigation,
  Droplets,
  Thermometer,
  Layers,
  Info,
} from 'lucide-react';
import { Station, Reading } from '@/types';
import { formatWaterLevel, formatRainfall } from '@/utils/formatters';
import { timeAgo } from '@/utils/date';

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
  if (!station) return null;

  // Determine Flood Risk Level based on deterministic IF-ELSE logic
  const wl = reading?.waterLevel ?? 0;
  const rf = reading?.rainfall ?? 0;
  const sm = reading?.soilMoisture ?? 0;
  const soilType = (station as any).soil_type || 'Clay';
  const isClay = soilType.toLowerCase() === 'clay';

  let riskLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
  let riskBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
  let riskTitle = 'Normal Conditions';
  let riskDesc = 'All hydrological indicators within standard operating baseline.';

  if (
    wl >= station.thresholds.dangerMax ||
    (wl >= station.thresholds.warningMax && rf >= 50 && sm >= 80) ||
    (rf >= 90 && sm >= 80)
  ) {
    riskLevel = 'RED';
    riskBadge = 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border-red-300 dark:border-red-800 animate-pulse';
    riskTitle = 'Critical Flood Risk';
    riskDesc = 'Water stage exceeds danger capacity or flash flooding imminent. Emergency warning active.';
  } else if (
    wl >= station.thresholds.warningMax ||
    (wl >= station.thresholds.watchMax && rf >= 35 && sm >= 70) ||
    (isClay && sm >= 85 && rf >= 30)
  ) {
    riskLevel = 'ORANGE';
    riskBadge = 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-400 border-orange-300 dark:border-orange-800';
    riskTitle = 'High Flood Risk';
    riskDesc = 'Water level near warning threshold with sustained heavy rainfall and high soil moisture.';
  } else if (
    wl >= station.thresholds.watchMax ||
    (wl >= station.thresholds.normalMax && (rf >= 20 || sm >= 60)) ||
    rf >= 30 ||
    (isClay && sm >= 75)
  ) {
    riskLevel = 'YELLOW';
    riskBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-800';
    riskTitle = 'Moderate Flood Risk';
    riskDesc = 'Elevated water stage or high soil moisture with moderate precipitation.';
  }

  return (
    <aside className="absolute top-4 right-4 z-30 w-84 sm:w-96 max-h-[calc(100vh-210px)] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-3.5 animate-in slide-in-from-right-4 duration-200 no-scrollbar">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${riskBadge}`}
            >
              {riskLevel}: {riskTitle}
            </span>
            <span className="font-mono text-[10px] text-slate-400 uppercase">
              {station.code || station.id}
            </span>
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
            {station.name}
          </h3>
          <p className="text-[11px] text-slate-500 truncate">{station.riverBasin || 'Monitoring Basin'}</p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close station details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Geographic Coordinates & Elevation */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-[11px]">
        <div className="space-y-0.5">
          <div className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
            {station.latitude.toFixed(4)}°N, {station.longitude.toFixed(4)}°E
          </div>
          <div className="text-[10px] text-slate-500">
            Sensor Elevation: <strong>{station.elevation} m MSL</strong>
          </div>
        </div>
        <button
          onClick={() => onFlyTo(station.latitude, station.longitude)}
          className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold hover:underline"
        >
          <Navigation className="w-3.5 h-3.5" />
          Focus 3D
        </button>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <Activity className="w-3 h-3 text-sky-500" />
            <span>Water Level</span>
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            {formatWaterLevel(reading?.waterLevel)}
          </div>
          <div className="text-[9px] text-slate-400">Normal Max: {station.thresholds.normalMax}m</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <CloudRain className="w-3 h-3 text-sky-500" />
            <span>Precipitation (1h)</span>
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            {formatRainfall(reading?.rainfall)}
          </div>
          <div className="text-[9px] text-slate-400">Rain gauge</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <Droplets className="w-3 h-3 text-cyan-500" />
            <span>Soil Moisture</span>
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            {reading?.soilMoisture !== undefined && reading?.soilMoisture !== null
              ? `${reading.soilMoisture}%`
              : '65%'}
          </div>
          <div className="text-[9px] text-slate-400">Volumetric water content</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <Thermometer className="w-3 h-3 text-amber-500" />
            <span>Temp / Humidity</span>
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            {reading?.temperature ?? 29}°C / {reading?.humidity ?? 80}%
          </div>
          <div className="text-[9px] text-slate-400">Microclimate sensor</div>
        </div>
      </div>

      {/* Soil Type Information Card */}
      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Local Soil: {soilType}
          </span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
            {isClay ? '1.5 mm/h infiltration' : 'Standard infiltration'}
          </span>
        </div>
        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
          {isClay
            ? 'Clay soil particles swell upon moisture contact. At current soil moisture, rainfall infiltration slows and surface runoff potential increases.'
            : `${soilType} substrate with permeable soil drainage dynamics.`}
        </p>
      </div>

      {/* Flood Risk Rule Factors */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-500" />
            IF-ELSE Risk Evaluation
          </span>
          <span className="text-[10px] font-mono text-slate-500">Backend Engine</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          {riskDesc}
        </p>
        <div className="space-y-1 text-[10px] pt-1 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Stage vs Danger:</span>
            <span className="font-mono">{wl}m / {station.thresholds.dangerMax}m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Rainfall vs Saturated Clay:</span>
            <span className="font-mono">{rf} mm/h ({sm}% moist)</span>
          </div>
        </div>
      </div>

      {/* Hardware Telemetry & Last Seen */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Battery className="w-3.5 h-3.5 text-emerald-500" />
            {station.batteryLevel}%
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-sky-500" />
            Active
          </span>
        </div>
        <span>{reading ? timeAgo(reading.timestamp) : 'Live'}</span>
      </div>
    </aside>
  );
};
