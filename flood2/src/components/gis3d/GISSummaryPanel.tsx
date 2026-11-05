import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Route,
  Waves,
  Building2,
  CheckCircle2,
  BrainCircuit,
  Database,
} from 'lucide-react';

export interface GISSummaryPanelProps {
  pathsCount: number;
  waterwaysCount: number;
  buildingsCount: number;
  syncStatus?: string;
  isMLModelConfigured?: boolean;
}

export const GISSummaryPanel: React.FC<GISSummaryPanelProps> = ({
  pathsCount,
  waterwaysCount,
  buildingsCount,
  syncStatus = 'Synchronized & Clamped to DEM',
  isMLModelConfigured = true,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="w-full bg-[#0B132B]/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl p-3.5 border border-cyan-500/25 shadow-2xl text-xs space-y-2.5 select-none text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-white text-xs tracking-wide">
            GIS Digital Twin Summary
          </span>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Toggle Summary Panel"
        >
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-2">
          {/* 3 Metric Pills */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
              <Route className="w-3.5 h-3.5 text-amber-400 mb-1" />
              <span className="font-mono font-bold text-white text-sm">
                {pathsCount}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                Paths / Roads
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
              <Waves className="w-3.5 h-3.5 text-cyan-400 mb-1" />
              <span className="font-mono font-bold text-white text-sm">
                {waterwaysCount}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                Waterways
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
              <Building2 className="w-3.5 h-3.5 text-orange-400 mb-1" />
              <span className="font-mono font-bold text-white text-sm">
                {buildingsCount.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                Buildings
              </span>
            </div>
          </div>

          {/* Data Loading & Sync Status */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-cyan-400" />
              Data Pipeline:
            </span>
            <span className="font-medium text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {syncStatus}
            </span>
          </div>

          {/* ML Model Status */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <BrainCircuit className="w-3 h-3 text-indigo-400" />
              ML Inundation Model:
            </span>
            {isMLModelConfigured ? (
              <span className="font-mono font-semibold text-indigo-300">
                GNN–Transformer v2.4 Active
              </span>
            ) : (
              <span className="text-amber-400 font-medium">Model Offline / Demo</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

