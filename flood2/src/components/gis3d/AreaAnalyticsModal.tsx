import React from 'react';
import {
  BarChart3,
  X,
  Building2,
  Waves,
  Mountain,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { BuildingFootprintStats } from '@/services/buildingFootprintService';

export interface AreaAnalyticsModalProps {
  stats: BuildingFootprintStats;
  onClose: () => void;
}

export const AreaAnalyticsModal: React.FC<AreaAnalyticsModalProps> = ({ stats, onClose }) => {
  return (
    <div className="absolute top-16 right-4 z-30 w-88 max-w-[calc(100vw-2rem)] bg-[#0B132B]/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl p-4 border border-indigo-500/30 shadow-2xl text-xs space-y-3.5 select-none text-slate-200 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Marked Area Analytics</h3>
            <span className="text-[10px] text-indigo-300 font-medium">
              Alaknanda Mountain Gorge Basin (15.4 km²)
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Building2 className="w-3 h-3 text-orange-400" />
            <span>Building Density</span>
          </div>
          <div className="text-base font-bold text-white font-mono">
            {Math.round(stats.totalCount / 15.4)} / km²
          </div>
          <div className="text-[10px] text-slate-500">{stats.totalCount} structures total</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Waves className="w-3 h-3 text-cyan-400" />
            <span>Drainage Density</span>
          </div>
          <div className="text-base font-bold text-cyan-300 font-mono">1.17 ch / km²</div>
          <div className="text-[10px] text-slate-500">18 mapped waterways</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Mountain className="w-3 h-3 text-emerald-400" />
            <span>Mean Gorge Slope</span>
          </div>
          <div className="text-base font-bold text-white font-mono">34.6°</div>
          <div className="text-[10px] text-slate-500">High runoff propensity</div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Time of Conc. (Tc)</span>
          </div>
          <div className="text-base font-bold text-amber-300 font-mono">42 min</div>
          <div className="text-[10px] text-slate-500">Flash flood lead time</div>
        </div>
      </div>

      {/* Building Exposure Risk Distribution */}
      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
        <span className="font-semibold text-slate-300 block text-[11px]">
          Building Inundation Exposure
        </span>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
          <div className="bg-emerald-500 h-full" style={{ width: '78%' }} title="Low risk: 78%" />
          <div className="bg-amber-500 h-full" style={{ width: '14%' }} title="Watch risk: 14%" />
          <div className="bg-orange-500 h-full" style={{ width: '6%' }} title="Warning risk: 6%" />
          <div className="bg-red-500 h-full" style={{ width: '2%' }} title="Danger risk: 2%" />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span className="text-emerald-400">Safe: 78%</span>
          <span className="text-amber-400">Watch: 14%</span>
          <span className="text-orange-400">Warn: 6%</span>
          <span className="text-red-400">Danger: 2%</span>
        </div>
      </div>

      {/* Protective Infrastructure */}
      <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[10px] text-slate-300 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          Evacuation Shelters Available:
        </span>
        <span className="font-mono font-bold text-white">4 Operational</span>
      </div>
    </div>
  );
};
