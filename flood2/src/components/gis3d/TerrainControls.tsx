import React from 'react';
import { Mountain, Compass, RotateCcw } from 'lucide-react';

interface TerrainControlsProps {
  terrainEnabled: boolean;
  onToggleTerrain: (enabled: boolean) => void;
  exaggeration: number;
  onChangeExaggeration: (val: number) => void;
  onResetOrientation: () => void;
  coordinates: {
    lat: number;
    lng: number;
    elevation: number | null;
  } | null;
}

export const TerrainControls: React.FC<TerrainControlsProps> = ({
  terrainEnabled,
  onToggleTerrain,
  exaggeration,
  onChangeExaggeration,
  onResetOrientation,
  coordinates,
}) => {
  const exaggerationLevels = [1.0, 1.5, 2.0, 3.0];

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-slate-200 dark:border-slate-800 text-xs space-y-3 min-w-[220px]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Mountain className="w-4 h-4 text-sky-500" />
          3D Terrain & Camera
        </span>
        <button
          onClick={onResetOrientation}
          title="Reset Camera Orientation"
          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terrain Elevation Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-slate-700 dark:text-slate-300 font-medium">3D Elevation Mesh</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={terrainEnabled}
            onChange={(e) => onToggleTerrain(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-gray-600 peer-checked:bg-sky-600"></div>
        </label>
      </div>

      {/* Terrain Exaggeration Controls */}
      {terrainEnabled && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Terrain Exaggeration</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{exaggeration}x</span>
          </div>
          <div className="grid grid-cols-4 gap-1 pt-1">
            {exaggerationLevels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => onChangeExaggeration(lvl)}
                className={`py-1 text-center font-mono rounded text-[10px] font-semibold transition-all ${
                  exaggeration === lvl
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {lvl}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Cursor Coordinate Readout */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-500">
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-sky-500" />
            Coords
          </span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            {coordinates
              ? `${coordinates.lat.toFixed(4)}°, ${coordinates.lng.toFixed(4)}°`
              : 'Hover on terrain'}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Surface Elevation</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">
            {coordinates?.elevation !== null && coordinates?.elevation !== undefined
              ? `${coordinates.elevation.toFixed(1)} m MSL`
              : '---'}
          </span>
        </div>
      </div>
    </div>
  );
};

