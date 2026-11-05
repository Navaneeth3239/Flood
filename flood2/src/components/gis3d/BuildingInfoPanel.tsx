import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { BuildingFootprint, BuildingFootprintStats } from '@/services/buildingFootprintService';

export interface BuildingInfoPanelProps {
  stats: BuildingFootprintStats;
  selectedBuilding: BuildingFootprint | null;
  onClearSelectedBuilding: () => void;
  showBuildings: boolean;
  onToggleBuildings: (val: boolean) => void;
  onReloadBuildings: () => void;
  isReloading?: boolean;
}

export const BuildingInfoPanel: React.FC<BuildingInfoPanelProps> = ({
  stats,
  selectedBuilding,
  onClearSelectedBuilding,
  showBuildings,
  onToggleBuildings,
  onReloadBuildings,
  isReloading = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="w-full bg-[#0B132B]/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl p-4 border border-orange-500/30 shadow-2xl text-xs space-y-3 select-none text-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40">
            <Building2 className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide">
              Houses in Marked Area
            </h3>
            <span className="text-[10px] text-orange-400 font-medium">
              Microsoft ML Building Footprints
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleBuildings(!showBuildings)}
            title={showBuildings ? 'Hide 3D Buildings' : 'Show 3D Buildings'}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {showBuildings ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onReloadBuildings}
            disabled={isReloading}
            title="Reload & Re-extrude Footprints"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-orange-400' : ''}`} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Collapse panel"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Main Stat Banner */}
          <div className="flex items-baseline justify-between p-3 rounded-xl bg-gradient-to-r from-orange-950/40 to-slate-900 border border-orange-500/20">
            <div>
              <div className="text-3xl font-black tracking-tight text-white font-mono">
                {stats.totalCount.toLocaleString()}
              </div>
              <div className="text-[11px] text-orange-300 font-medium mt-0.5">
                Mapped Building Footprints
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                3D Extruded
              </span>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {stats.minHeight}m – {stats.maxHeight}m H
              </div>
            </div>
          </div>

          {/* Metric Sub-Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Average Height</span>
              <span className="font-bold text-white font-mono text-sm">
                {stats.avgHeight} m
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Total Roof Area</span>
              <span className="font-bold text-white font-mono text-sm">
                {(stats.totalRoofAreaSqM / 1000).toFixed(1)}k m²
              </span>
            </div>
          </div>

          {/* Mandatory Data-Honesty Notice */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-300">Estimated-height notice:</strong> Heights are
              estimated algorithmically from planar ML footprint area and regional zoning
              profiles.
            </span>
          </div>

          {/* Selected Building Details (if user clicked on a 3D building) */}
          {selectedBuilding && (
            <div className="p-3 rounded-xl bg-orange-950/50 border border-orange-500/40 space-y-2 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between border-b border-orange-500/20 pb-1.5">
                <span className="font-bold text-orange-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  Building #{selectedBuilding.id}
                </span>
                <button
                  onClick={onClearSelectedBuilding}
                  className="text-slate-400 hover:text-white"
                  title="Close inspector"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Roof Footprint</span>
                  <span className="font-mono font-bold text-white">
                    {selectedBuilding.areaSqMeters} m²
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">3D Extrusion</span>
                  <span className="font-mono font-bold text-orange-300">
                    {selectedBuilding.heightMeters} m ({selectedBuilding.floors} fl)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Elevation</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {selectedBuilding.elevationMsl} m MSL
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Flood Exposure</span>
                  <span
                    className={`font-semibold capitalize ${
                      selectedBuilding.floodRiskTier === 'danger'
                        ? 'text-red-400'
                        : selectedBuilding.floodRiskTier === 'warning'
                        ? 'text-orange-400'
                        : selectedBuilding.floodRiskTier === 'watch'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedBuilding.floodRiskTier}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
