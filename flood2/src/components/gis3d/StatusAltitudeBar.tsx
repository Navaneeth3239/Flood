import React from 'react';
import { Mountain, Compass, Eye, MapPin, Layers, Radio } from 'lucide-react';

export interface ClickedLocationInfo {
  lat: number;
  lng: number;
  elevation: number | null;
  layerName?: string;
  soilType?: string;
}

export interface StatusAltitudeBarProps {
  cameraAltitudeMeters: number;
  pitchDegrees: number;
  headingDegrees: number;
  cursorCoordinates: {
    lat: number;
    lng: number;
    elevation: number | null;
  } | null;
  clickedCoordinates?: ClickedLocationInfo | null;
  activeLayerName?: string;
  activeSensorCount?: number;
  totalSensorCount?: number;
}

export const StatusAltitudeBar: React.FC<StatusAltitudeBarProps> = ({
  cameraAltitudeMeters,
  pitchDegrees,
  headingDegrees,
  cursorCoordinates,
  clickedCoordinates,
  activeLayerName = '3D World Terrain',
  activeSensorCount = 5,
  totalSensorCount = 5,
}) => {
  return (
    <footer className="w-full bg-[#0B132B]/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl px-4 py-2 border border-cyan-500/25 shadow-2xl text-[11px] font-mono text-slate-300 flex items-center justify-between gap-3 select-none flex-wrap">
      {/* Left Segment: Active Layer & Clicked Point Readout */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Active Terrain Layer */}
        <div className="flex items-center gap-1.5 text-cyan-300">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Layer:</span>
          <strong className="font-bold text-white uppercase text-[10px] tracking-wide">
            {activeLayerName}
          </strong>
        </div>

        <div className="h-3 w-px bg-slate-700/80 hidden sm:block" />

        {/* Clicked / Cursor Coordinates */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">Location:</span>
          <span className="text-white font-semibold">
            {clickedCoordinates
              ? `${clickedCoordinates.lat.toFixed(4)}°N, ${clickedCoordinates.lng.toFixed(4)}°E`
              : cursorCoordinates
              ? `${cursorCoordinates.lat.toFixed(4)}°N, ${cursorCoordinates.lng.toFixed(4)}°E`
              : 'Click map to inspect'}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-700/80 hidden md:block" />

        {/* Surface Elevation */}
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Mountain className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Elevation:</span>
          <strong className="font-bold text-white">
            {clickedCoordinates?.elevation !== null && clickedCoordinates?.elevation !== undefined
              ? `${Math.round(clickedCoordinates.elevation)} m MSL`
              : cursorCoordinates?.elevation !== null && cursorCoordinates?.elevation !== undefined
              ? `${Math.round(cursorCoordinates.elevation)} m MSL`
              : '---'}
          </strong>
        </div>

        {/* Soil Type at location */}
        {clickedCoordinates?.soilType && (
          <>
            <div className="h-3 w-px bg-slate-700/80 hidden lg:block" />
            <div className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              <span className="text-slate-400">Soil:</span>
              <strong className="text-white">{clickedCoordinates.soilType}</strong>
            </div>
          </>
        )}
      </div>

      {/* Right Segment: Camera Position & Sensor Network Status */}
      <div className="flex items-center gap-3 flex-wrap ml-auto">
        {/* Sensor Status */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Sensors:</span>
          <span className="text-emerald-400 font-bold">
            {activeSensorCount}/{totalSensorCount} Online
          </span>
        </div>

        <div className="h-3 w-px bg-slate-700/80 hidden sm:block" />

        {/* Camera Altitude */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Eye Alt:</span>
          <span className="text-slate-200">
            {Math.round(cameraAltitudeMeters).toLocaleString()} m
          </span>
        </div>

        <div className="h-3 w-px bg-slate-700/80 hidden sm:block" />

        {/* Orientation */}
        <div className="flex items-center gap-1 text-slate-400">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>{Math.round(pitchDegrees)}°</span>
          <span className="text-slate-600">/</span>
          <span>{Math.round(headingDegrees)}°</span>
        </div>
      </div>
    </footer>
  );
};
