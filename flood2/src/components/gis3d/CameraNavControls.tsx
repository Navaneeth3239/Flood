import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  ChevronsUp,
  ChevronsDown,
  Navigation,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface CameraNavControlsProps {
  onMoveForward: () => void;
  onMoveBackward: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onTurnLeft: () => void;
  onTurnRight: () => void;
  onTiltUp: () => void;
  onTiltDown: () => void;
  onElevateUp: () => void;
  onElevateDown: () => void;
  freeMoveMode: boolean;
  onToggleFreeMove: () => void;
}

export const CameraNavControls: React.FC<CameraNavControlsProps> = ({
  onMoveForward,
  onMoveBackward,
  onMoveLeft,
  onMoveRight,
  onTurnLeft,
  onTurnRight,
  onTiltUp,
  onTiltDown,
  onElevateUp,
  onElevateDown,
  freeMoveMode,
  onToggleFreeMove,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-[#0B132B]/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl p-3 border border-cyan-500/25 shadow-2xl text-xs space-y-2.5 select-none text-slate-200 w-56">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-white text-xs">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>Camera Navigation</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Toggle camera controls"
        >
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-2.5">
          {/* D-Pad Pan & Turn Controls */}
          <div className="flex flex-col items-center gap-1">
            {/* Row 1: Forward */}
            <button
              onClick={onMoveForward}
              title="Pan Forward (Move closer along line of sight)"
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-colors shadow-xs active:scale-95"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            {/* Row 2: Left, Elevate / Free, Right */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onMoveLeft}
                title="Pan Left (Strafe left)"
                className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-colors shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleFreeMove}
                title={freeMoveMode ? 'Free Orbit Active (Click to lock)' : 'Enable Free-Move Mode'}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                  freeMoveMode
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {freeMoveMode ? 'Free' : 'Locked'}
              </button>

              <button
                onClick={onMoveRight}
                title="Pan Right (Strafe right)"
                className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-colors shadow-xs active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Row 3: Backward */}
            <button
              onClick={onMoveBackward}
              title="Pan Backward (Move back)"
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-colors shadow-xs active:scale-95"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* Secondary Controls: Heading Turn, Tilt & Altitude */}
          <div className="grid grid-cols-6 gap-1 pt-1.5 border-t border-slate-800 text-center">
            <button
              onClick={onTurnLeft}
              title="Turn Heading Left"
              className="p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex flex-col items-center"
            >
              <RotateCcw className="w-3.5 h-3.5 mb-0.5 text-cyan-400" />
              <span className="text-[8px]">Turn L</span>
            </button>

            <button
              onClick={onTurnRight}
              title="Turn Heading Right"
              className="p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex flex-col items-center"
            >
              <RotateCw className="w-3.5 h-3.5 mb-0.5 text-cyan-400" />
              <span className="text-[8px]">Turn R</span>
            </button>

            <button
              onClick={onTiltUp}
              title="Tilt Camera Up"
              className="p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex flex-col items-center"
            >
              <ArrowUp className="w-3.5 h-3.5 mb-0.5 text-amber-400" />
              <span className="text-[8px]">Tilt Up</span>
            </button>

            <button
              onClick={onTiltDown}
              title="Tilt Camera Down"
              className="p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex flex-col items-center"
            >
              <ArrowDown className="w-3.5 h-3.5 mb-0.5 text-amber-400" />
              <span className="text-[8px]">Tilt Dn</span>
            </button>

            <button
              onClick={onElevateUp}
              title="Elevate Camera Up (+Altitude)"
              className="p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex flex-col items-center"
            >
              <ChevronsUp className="w-3.5 h-3.5 mb-0.5 text-emerald-400" />
              <span className="text-[8px]">Alt +</span>
            </button>

            <button
              onClick={onElevateDown}
              title="Elevate Camera Down (-Altitude)"
              className="p-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex flex-col items-center"
            >
              <ChevronsDown className="w-3.5 h-3.5 mb-0.5 text-emerald-400" />
              <span className="text-[8px]">Alt -</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
