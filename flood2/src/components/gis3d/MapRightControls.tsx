import React from 'react';
import { Compass, Plus, Minus } from 'lucide-react';

export interface MapRightControlsProps {
  headingDegrees: number;
  onResetNorth: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetPitch: () => void;
}

export const MapRightControls: React.FC<MapRightControlsProps> = ({
  headingDegrees,
  onResetNorth,
  onZoomIn,
  onZoomOut,
  onResetPitch,
}) => {
  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Compass / North Heading */}
      <button
        onClick={onResetNorth}
        title={`Compass: ${Math.round(headingDegrees)}°. Click to orient North.`}
        className="w-10 h-10 rounded-2xl bg-[#0B132B]/95 dark:bg-slate-950/95 backdrop-blur-md border border-cyan-500/30 shadow-xl flex items-center justify-center text-cyan-400 hover:text-white hover:bg-slate-800 transition-all group"
      >
        <div
          className="transition-transform duration-100 ease-out"
          style={{ transform: `rotate(${-headingDegrees}deg)` }}
        >
          <Compass className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
        </div>
      </button>

      {/* Zoom In & Out */}
      <div className="flex flex-col rounded-2xl bg-[#0B132B]/95 dark:bg-slate-950/95 backdrop-blur-md border border-cyan-500/30 shadow-xl overflow-hidden divide-y divide-slate-800">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Oblique Pitch Reset */}
      <button
        onClick={onResetPitch}
        title="Reset to 35° Oblique 3D Mountain Perspective"
        className="w-10 h-10 rounded-2xl bg-[#0B132B]/95 dark:bg-slate-950/95 backdrop-blur-md border border-cyan-500/30 shadow-xl flex items-center justify-center text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
        aria-label="Reset Pitch"
      >
        <span className="font-mono text-[11px] font-bold">3D</span>
      </button>
    </div>
  );
};
