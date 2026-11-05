import React from 'react';
import { Mountain, Compass, Eye, MapPin } from 'lucide-react';

export interface StatusAltitudeBarProps {
  cameraAltitudeMeters: number;
  pitchDegrees: number;
  headingDegrees: number;
  cursorCoordinates: {
    lat: number;
    lng: number;
    elevation: number | null;
  } | null;
}

export const StatusAltitudeBar: React.FC<StatusAltitudeBarProps> = ({
  cameraAltitudeMeters,
  pitchDegrees,
  headingDegrees,
  cursorCoordinates,
}) => {
  return (
    <footer className="bg-[#0B132B]/90 dark:bg-slate-950/90 backdrop-blur-md rounded-2xl px-3.5 py-1.5 border border-cyan-500/25 shadow-xl text-[11px] font-mono text-slate-300 flex items-center gap-3 select-none flex-wrap">
      {/* Live Camera Altitude */}
      <div className="flex items-center gap-1.5 text-cyan-300">
        <Eye className="w-3.5 h-3.5 text-cyan-400" />
        <span>Camera Alt:</span>
        <strong className="font-bold text-white">
          {Math.round(cameraAltitudeMeters).toLocaleString()} m MSL
        </strong>
      </div>

      <div className="h-3 w-px bg-slate-700/80 hidden sm:block" />

      {/* Camera Orientation */}
      <div className="flex items-center gap-1.5 text-slate-400">
        <Compass className="w-3.5 h-3.5 text-amber-400" />
        <span>Pitch:</span>
        <span className="text-slate-200">{Math.round(pitchDegrees)}°</span>
        <span className="text-slate-600">|</span>
        <span>Hdg:</span>
        <span className="text-slate-200">{Math.round(headingDegrees)}°</span>
      </div>

      <div className="h-3 w-px bg-slate-700/80 hidden md:block" />

      {/* Ground Surface Elevation & Coordinates */}
      <div className="flex items-center gap-1.5 text-slate-400">
        <Mountain className="w-3.5 h-3.5 text-emerald-400" />
        <span>Surface:</span>
        <span className="text-slate-200">
          {cursorCoordinates?.elevation !== null && cursorCoordinates?.elevation !== undefined
            ? `${Math.round(cursorCoordinates.elevation)} m`
            : '---'}
        </span>
      </div>

      <div className="h-3 w-px bg-slate-700/80 hidden lg:block" />

      {/* Lat / Lng Readout */}
      <div className="flex items-center gap-1 text-slate-400 hidden sm:flex">
        <MapPin className="w-3.5 h-3.5 text-sky-400" />
        <span>
          {cursorCoordinates
            ? `${cursorCoordinates.lat.toFixed(4)}°N, ${cursorCoordinates.lng.toFixed(4)}°E`
            : 'WGS84 Hydrology'}
        </span>
      </div>
    </footer>
  );
};

