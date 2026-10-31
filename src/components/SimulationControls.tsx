import React, { memo } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Gauge, 
  AlertTriangle,
  Compass,
  Zap
} from 'lucide-react';
import { SimulationStatus } from '../types/navigation';

interface SimulationControlsProps {
  status: SimulationStatus;
  speedKmh: number;
  onSpeedChange: (speed: number) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onSimulateOffRoute: () => void;
  canStart: boolean;
  earlyWarningDist: number;
  mainSignalDist: number;
  onEarlyWarningChange: (dist: number) => void;
  onMainSignalChange: (dist: number) => void;
  autoFollow: boolean;
  onToggleAutoFollow: () => void;
}

const SPEED_PRESETS = [
  { label: 'Stop', speed: 0, tag: '0 km/h' },
  { label: 'City', speed: 30, tag: '30 km/h' },
  { label: 'Normal', speed: 40, tag: '40 km/h' },
  { label: 'Highway', speed: 80, tag: '80 km/h' },
  { label: 'Fast Sim', speed: 120, tag: '120 km/h' },
];

export const SimulationControls = memo<SimulationControlsProps>(({
  status,
  speedKmh,
  onSpeedChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onSimulateOffRoute,
  canStart,
  earlyWarningDist,
  mainSignalDist,
  onEarlyWarningChange,
  onMainSignalChange,
  autoFollow,
  onToggleAutoFollow,
}) => {
  const isRunning = status === 'RUNNING';
  const isPaused = status === 'PAUSED';
  const isOffRoute = status === 'OFF_ROUTE' || status === 'REROUTING';

  const getSpeedLabel = (spd: number) => {
    if (spd === 0) return 'VEHICLE STATIONARY';
    if (spd <= 35) return 'CITY DRIVING PACE';
    if (spd <= 60) return 'URBAN ARTERIAL CRUISE';
    if (spd <= 90) return 'HIGHWAY VELOCITY';
    return 'HIGH-SPEED ACCELERATED';
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white tracking-wide uppercase">Navigation Controller</h3>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${
            isRunning ? 'bg-emerald-400 animate-pulse' :
            isPaused ? 'bg-amber-400' :
            isOffRoute ? 'bg-rose-500 animate-ping' :
            'bg-slate-500'
          }`} />
          <span className="text-xs font-mono font-bold text-slate-300">
            {status}
          </span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Start / Resume */}
        {!isRunning ? (
          <button
            onClick={isPaused ? onResume : onStart}
            disabled={!canStart}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer ${
              !canStart
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:-translate-y-0.5'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>{isPaused ? 'Resume' : 'Start Nav'}</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="py-2.5 px-3 rounded-xl font-bold text-xs tracking-wide bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30 transition-all hover:-translate-y-0.5 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 fill-white text-white" />
            <span>Pause</span>
          </button>
        )}

        {/* Stop */}
        <button
          onClick={onStop}
          disabled={status === 'IDLE' || status === 'STOPPED'}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer ${
            status === 'IDLE' || status === 'STOPPED'
              ? 'bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-800'
              : 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-rose-600/30 hover:-translate-y-0.5'
          }`}
        >
          <Square className="w-3.5 h-3.5 fill-white text-white" />
          <span>Stop</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          disabled={!canStart && status === 'IDLE'}
          className="py-2.5 px-3 rounded-xl font-bold text-xs tracking-wide bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
          <span>Reset</span>
        </button>

        {/* Deviate Off-Route Simulation */}
        <button
          onClick={onSimulateOffRoute}
          disabled={!isRunning}
          title="Simulate vehicle taking a wrong turn off-route"
          className={`py-2.5 px-3 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer ${
            !isRunning
              ? 'bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-800'
              : 'bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:-translate-y-0.5'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
          <span>Off-Route</span>
        </button>
      </div>

      {/* Large Digital Speedometer Cockpit Panel (Section 2 & 7 Requirement) */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            Digital Speedometer
          </span>
          <span className="text-[10px] font-mono font-bold text-cyan-400/90 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
            {getSpeedLabel(speedKmh)}
          </span>
        </div>

        {/* Large Digital Display */}
        <div className="flex items-baseline justify-center space-x-2 py-1 select-none">
          <span className="text-4xl sm:text-5xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            {speedKmh.toString().padStart(3, '0')}
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-cyan-400">
            km/h
          </span>
        </div>

        {/* Speed Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max="120"
            step="5"
            value={speedKmh}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0 km/h</span>
            <span>40 km/h</span>
            <span>80 km/h</span>
            <span>120 km/h</span>
          </div>
        </div>

        {/* Simulation Speed Presets (Section 8.B Requirement) */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 block mb-1">Driving Presets:</span>
          <div className="grid grid-cols-5 gap-1.5">
            {SPEED_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onSpeedChange(preset.speed)}
                className={`py-1.5 px-1 rounded-lg text-center text-xs font-mono font-bold transition-all cursor-pointer ${
                  speedKmh === preset.speed
                    ? 'bg-cyan-500 text-navy-950 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
                }`}
              >
                <div className="text-[10px] truncate">{preset.label}</div>
                <div className="text-[9px] text-slate-400 truncate">{preset.tag}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Follow Vehicle Toggle */}
      <div className="grid grid-cols-1 gap-2 text-xs">
        <button
          onClick={onToggleAutoFollow}
          className={`p-2.5 rounded-xl border flex items-center justify-between font-semibold transition-all cursor-pointer ${
            autoFollow
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/80 shadow-sm shadow-emerald-500/20'
              : 'bg-slate-900/60 text-slate-400 border-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Compass className={`w-3.5 h-3.5 ${autoFollow ? 'animate-spin text-emerald-400' : 'text-slate-500'}`} style={{ animationDuration: '6s' }} />
            Map Follow Vehicle Mode
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 font-bold">
            {autoFollow ? 'ENABLED' : 'MANUAL'}
          </span>
        </button>
      </div>

      {/* Configurable Warning Distances (Section 8 Requirement) */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="font-semibold text-xs text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Configurable Warning Distances
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Stages 1 & 2
          </span>
        </div>

        {/* Stage 1: Early Warning Distance Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-300">
              Stage 1 — Early Warning:
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              {earlyWarningDist} metres
            </span>
          </div>
          <input
            type="range"
            min="80"
            max="300"
            step="10"
            value={earlyWarningDist}
            onChange={(e) => onEarlyWarningChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>80 m</span>
            <span>Default: 150 m</span>
            <span>300 m</span>
          </div>
        </div>

        {/* Stage 2: Immediate Warning Distance Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-300">
              Stage 2 — Immediate Alert:
            </span>
            <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
              {mainSignalDist} metres
            </span>
          </div>
          <input
            type="range"
            min="20"
            max={Math.min(100, earlyWarningDist - 15)}
            step="5"
            value={mainSignalDist}
            onChange={(e) => onMainSignalChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>20 m</span>
            <span>Default: 50 m</span>
            <span>{Math.min(100, earlyWarningDist - 15)} m</span>
          </div>
        </div>
      </div>
    </div>
  );
});
