import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Mountain,
  Radio,
  Waves,
  Satellite,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SENTINEL1_METADATA } from '@/services/floodLayerService';

export interface LayerVisibilityState {
  terrain: boolean;
  stations: boolean;
  rivers: boolean;
  sarObservedFlood: boolean;
  gnnPredictedRisk: boolean;
  satelliteImagery: boolean;
  emergencyShelters: boolean;
}

interface LayerControlPanelProps {
  layers: LayerVisibilityState;
  onToggleLayer: (key: keyof LayerVisibilityState, val: boolean) => void;
  onToggleAll: (enable: boolean) => void;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layers,
  onToggleLayer,
  onToggleAll,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  const allVisible = Object.values(layers).every(Boolean);

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-slate-200 dark:border-slate-800 text-xs w-68 space-y-2.5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <Layers className="w-4 h-4 text-sky-500" />
          <span>GIS Geospatial Layers</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleAll(!allVisible)}
            title={allVisible ? 'Hide all layers' : 'Show all layers'}
            className="p-1 rounded text-slate-400 hover:text-sky-600 transition-colors"
          >
            {allVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={collapsed ? 'Expand Layer Controls' : 'Collapse Layer Controls'}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-2.5">
          {/* Layer toggles */}
          <div className="space-y-2 text-slate-700 dark:text-slate-300">
            {/* Terrain Layer */}
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <Mountain className="w-3.5 h-3.5 text-amber-500" />
                <span>3D Elevation Terrain</span>
              </span>
              <input
                type="checkbox"
                checked={layers.terrain}
                onChange={(e) => onToggleLayer('terrain', e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            {/* IoT Gauging Stations */}
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-sky-500" />
                <span>IoT Monitoring Stations</span>
              </span>
              <input
                type="checkbox"
                checked={layers.stations}
                onChange={(e) => onToggleLayer('stations', e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            {/* River Network */}
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <Waves className="w-3.5 h-3.5 text-blue-500" />
                <span>River Channels (Vector)</span>
              </span>
              <input
                type="checkbox"
                checked={layers.rivers}
                onChange={(e) => onToggleLayer('rivers', e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            {/* Observed Flood Extent (Sentinel-1 SAR) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="flex items-center gap-2">
                  <Satellite className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Observed SAR Inundation</span>
                </span>
                <input
                  type="checkbox"
                  checked={layers.sarObservedFlood}
                  onChange={(e) => onToggleLayer('sarObservedFlood', e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
              </label>
              {layers.sarObservedFlood && (
                <div className="pl-5 text-[10px] text-cyan-600 dark:text-cyan-400 flex items-center justify-between">
                  <span>{SENTINEL1_METADATA.satellite}</span>
                  <button
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="underline text-[10px] hover:text-cyan-700"
                  >
                    {showMetadata ? 'Hide meta' : 'View meta'}
                  </button>
                </div>
              )}
            </div>

            {/* Metadata preview card */}
            {layers.sarObservedFlood && showMetadata && (
              <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900 text-[10px] space-y-1">
                <div className="font-semibold text-cyan-900 dark:text-cyan-200">
                  {SENTINEL1_METADATA.name}
                </div>
                <div>Sensor: {SENTINEL1_METADATA.instrument}</div>
                <div>Acquired: {SENTINEL1_METADATA.acquisitionDate}</div>
                <div>Polarization: {SENTINEL1_METADATA.polarization}</div>
              </div>
            )}

            {/* GNN Predicted Risk Zones */}
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                <span>GNN Predicted Risk Zones</span>
              </span>
              <input
                type="checkbox"
                checked={layers.gnnPredictedRisk}
                onChange={(e) => onToggleLayer('gnnPredictedRisk', e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            {/* Emergency Shelters */}
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Emergency Shelters</span>
              </span>
              <input
                type="checkbox"
                checked={layers.emergencyShelters}
                onChange={(e) => onToggleLayer('emergencyShelters', e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

