import React from 'react';
import {
  Globe,
  Satellite,
  Mountain,
  Map as FlatMapIcon,
  Activity,
  Waves,
  Route,
  Building2,
  BarChart3,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Radio,
  Siren,
  Bot,
  Layers,
} from 'lucide-react';

export type MapMode = 'standard3d' | 'satellite' | 'tinTerrain' | 'flatView' | 'srtm30';

export interface DigitalTwinToolbarProps {
  currentMode: MapMode;
  onSelectMode: (mode: MapMode) => void;
  // Vector Layer Toggles
  showRivers: boolean;
  onToggleRivers: (val: boolean) => void;
  showPaths: boolean;
  onTogglePaths: (val: boolean) => void;
  showBuildings: boolean;
  onToggleBuildings: (val: boolean) => void;
  buildingCount: number;
  showAreaInGIS: boolean;
  onToggleAreaInGIS: (val: boolean) => void;
  // Analytics & Module Toggles
  showAreaAnalytics: boolean;
  onToggleAreaAnalytics: (val: boolean) => void;
  showFlashFlood: boolean;
  onToggleFlashFlood: (val: boolean) => void;
  showSensors: boolean;
  onToggleSensors: (val: boolean) => void;
  showEvacuation: boolean;
  onToggleEvacuation: (val: boolean) => void;
  onOpenAIChat: () => void;
  onResetView: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const DigitalTwinToolbar: React.FC<DigitalTwinToolbarProps> = ({
  currentMode,
  onSelectMode,
  showRivers,
  onToggleRivers,
  showPaths,
  onTogglePaths,
  showBuildings,
  onToggleBuildings,
  buildingCount,
  showAreaInGIS,
  onToggleAreaInGIS,
  showAreaAnalytics,
  onToggleAreaAnalytics,
  showFlashFlood,
  onToggleFlashFlood,
  showSensors,
  onToggleSensors,
  showEvacuation,
  onToggleEvacuation,
  onOpenAIChat,
  onResetView,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="w-full bg-[#0B132B]/95 dark:bg-slate-950/95 backdrop-blur-md border border-cyan-500/20 shadow-2xl rounded-2xl p-2 text-xs flex items-center justify-between gap-1 overflow-x-auto select-none no-scrollbar">
      {/* Group 1: Map Modes */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onSelectMode('standard3d')}
          title="Standard 3D: Real terrain + satellite + 3D buildings"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            currentMode === 'standard3d'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Standard 3D</span>
        </button>

        <button
          onClick={() => onSelectMode('satellite')}
          title="Satellite: Pure high-resolution satellite imagery basemap"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            currentMode === 'satellite'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          onClick={() => onSelectMode('tinTerrain')}
          title="TIN Terrain: Triangulated Irregular Network with elevation contours"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            currentMode === 'tinTerrain'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>TIN Terrain</span>
        </button>

        <button
          onClick={() => onSelectMode('flatView')}
          title="Flat View: Top-down 2D orthographic map"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            currentMode === 'flatView'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <FlatMapIcon className="w-3.5 h-3.5" />
          <span>Flat View</span>
        </button>

        <button
          onClick={() => onSelectMode('srtm30')}
          title="SRTM 30: NASA SRTM 30m Digital Elevation Model slope & relief"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            currentMode === 'srtm30'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30 font-bold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>SRTM 30</span>
        </button>
      </div>

      <div className="h-4 w-px bg-slate-700/60 mx-1 flex-shrink-0" />

      {/* Group 2: GIS Vector Overlays */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Rivers in Cyan */}
        <button
          onClick={() => onToggleRivers(!showRivers)}
          title="Toggle Cyan River & Waterway Network (18 channels)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            showRivers
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span>Rivers</span>
        </button>

        {/* Paths & Roads */}
        <button
          onClick={() => onTogglePaths(!showPaths)}
          title="Toggle Roads, Highways, and Mountain Paths (142 paths)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            showPaths
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Route className="w-3.5 h-3.5 text-amber-400" />
          <span>Paths</span>
        </button>

        {/* 3D Extruded Buildings with live count badge */}
        <button
          onClick={() => onToggleBuildings(!showBuildings)}
          title="Toggle Microsoft ML 3D Extruded Building Footprints"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            showBuildings
              ? 'bg-orange-950/90 text-orange-300 border border-orange-500/60 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-orange-400" />
          <span>Buildings</span>
          <span className="px-1.5 py-0.2 rounded-md bg-orange-500 text-slate-950 font-mono text-[10px] font-bold">
            {buildingCount.toLocaleString()}
          </span>
        </button>

        {/* Area in GIS */}
        <button
          onClick={() => onToggleAreaInGIS(!showAreaInGIS)}
          title="Toggle Marked Study Area Boundary Polygon (15.4 sq km)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            showAreaInGIS
              ? 'bg-sky-950 text-sky-300 border border-sky-500/50 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Area in GIS</span>
        </button>
      </div>

      <div className="h-4 w-px bg-slate-700/60 mx-1 flex-shrink-0" />

      {/* Group 3: Intelligence, Analytics & Safety Modules */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onToggleAreaAnalytics(!showAreaAnalytics)}
          title="Area Analytics: Hydrology, building density, and slope statistics"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            showAreaAnalytics
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Area Analytics</span>
        </button>

        <button
          onClick={() => onToggleFlashFlood(!showFlashFlood)}
          title="Flash Flood: GNN AI flood inundation prediction module"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            showFlashFlood
              ? 'bg-red-950 text-red-300 border border-red-500/60 shadow-xs animate-pulse'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>Flash Flood</span>
        </button>

        <button
          onClick={() => onToggleSensors(!showSensors)}
          title="Sensors: IoT Hydrometric water-level & rainfall gauging stations"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            showSensors
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sensors</span>
        </button>

        <button
          onClick={() => onToggleEvacuation(!showEvacuation)}
          title="Evacuation: Emergency relief shelters and escape corridors"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all ${
            showEvacuation
              ? 'bg-teal-950 text-teal-300 border border-teal-500/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Siren className="w-3.5 h-3.5 text-teal-400" />
          <span>Evacuation</span>
        </button>

        <button
          onClick={onOpenAIChat}
          title="AI Chat: Launch FloodGuard hydrological AI assistant"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/60 transition-all"
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Chat</span>
        </button>
      </div>

      <div className="h-4 w-px bg-slate-700/60 mx-1 flex-shrink-0" />

      {/* Group 4: Camera Reset & Fullscreen */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onResetView}
          title="Reset Camera to Oblique Mountain Perspective"
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Reset Camera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
