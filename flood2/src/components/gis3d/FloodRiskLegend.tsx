import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { DemoBadge } from '@/components/common/DemoBadge';

interface FloodRiskLegendProps {
  isMock?: boolean;
}

export const FloodRiskLegend: React.FC<FloodRiskLegendProps> = ({ isMock = true }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-slate-200 dark:border-slate-800 text-xs w-64 space-y-2.5 transition-all">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
          <Info className="w-3.5 h-3.5 text-sky-500" />
          <span>3D GIS Legend</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          aria-label={collapsed ? 'Expand Legend' : 'Collapse Legend'}
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-3">
          {/* Station Status Indicators */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              IoT Gauging Stations
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300">Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300">Watch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300">Warning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300">Danger / Evac</span>
              </div>
            </div>
          </div>

          {/* Spatial Inundation Layers */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Hydrological & Flood Layers
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1.5 rounded-sm bg-sky-600 flex-shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300">River Network (Vector)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-2.5 rounded-xs bg-sky-500/50 border border-sky-600 flex-shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300">Sentinel-1 SAR Inundation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-2.5 rounded-xs bg-red-500/40 border border-dashed border-red-500 flex-shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300">GNN AI Forecast Extent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-2.5 rounded-xs bg-purple-500/30 border border-purple-500 flex-shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300">Historic High-Water Mark</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 flex-shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300">Evacuation Shelter</span>
              </div>
            </div>
          </div>

          {/* Data Honesty Notice */}
          {isMock && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                Simulation Data
              </span>
              <DemoBadge size="sm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

