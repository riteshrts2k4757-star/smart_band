import React, { memo } from 'react';
import { 
  Cpu, 
  ArrowUp, 
  CornerUpLeft, 
  CornerUpRight, 
  RotateCcw, 
  CheckCircle2, 
  Sliders,
  Vibrate,
  Radio,
  Zap
} from 'lucide-react';
import { LEDState, TurnDirection } from '../types/navigation';

interface WristbandSimulatorProps {
  ledState: LEDState;
  activeDirection: TurnDirection | null;
  activePulseCount: number | null;
  activeInstruction: string | null;
  distanceToManeuver: number | null;
  isDestinationReached: boolean;
  manualOverrideActive: boolean;
  onDurationMs: number;
  offDurationMs: number;
  onTimingChange: (onMs: number, offMs: number) => void;
}

export const WristbandSimulator = memo<WristbandSimulatorProps>(({
  ledState,
  activeDirection,
  activePulseCount,
  distanceToManeuver,
  isDestinationReached,
  manualOverrideActive,
  onDurationMs,
  offDurationMs,
  onTimingChange,
}) => {
  const isLeftVibrating = ledState.leftGreen || ledState.leftRed;
  const isRightVibrating = ledState.rightGreen || ledState.rightRed;

  const getDisplayIcon = () => {
    if (isDestinationReached) {
      return <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />;
    }
    switch (activeDirection) {
      case 'LEFT':
        return <CornerUpLeft className="w-6 h-6 text-emerald-400 animate-pulse" />;
      case 'RIGHT':
        return <CornerUpRight className="w-6 h-6 text-cyan-400 animate-pulse" />;
      case 'U-TURN':
        return <RotateCcw className="w-6 h-6 text-rose-400 animate-spin" style={{ animationDuration: '3s' }} />;
      case 'STRAIGHT':
        return <ArrowUp className="w-6 h-6 text-emerald-400" />;
      default:
        return <ArrowUp className="w-6 h-6 text-slate-600" />;
    }
  };

  const getStatusText = () => {
    if (manualOverrideActive) {
      return 'MANUAL TEST OVERRIDE';
    }
    if (isDestinationReached) {
      return 'DESTINATION REACHED!';
    }
    if (!activeDirection) {
      return 'STANDBY / IDLE';
    }
    if (activeDirection === 'STRAIGHT') {
      return 'STRAIGHT: DUAL GREEN ILLUMINATED';
    }
    if (activeDirection === 'U-TURN') {
      return `U-TURN (4 PULSES + DUAL RED)`;
    }
    return `${activeDirection} TURN (${activePulseCount} PULSE${(activePulseCount || 0) > 1 ? 'S' : ''})`;
  };

  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-700/80 shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-navy-950/95">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white tracking-wide uppercase">
            Haptic Wristband Simulator
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {manualOverrideActive && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
              MANUAL TEST
            </span>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" />
            4-LED + 2-ERM HAPTIC
          </span>
        </div>
      </div>

      {/* Main Wristband Realistic Representation */}
      <div className="py-5 flex flex-col items-center select-none relative">
        {/* Top Silicone Strap */}
        <div className="w-32 h-9 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-t-xl border-t border-x border-slate-700 shadow-inner flex flex-col items-center justify-center space-y-1">
          <div className="w-16 h-1 bg-slate-700/50 rounded-full" />
          <div className="w-16 h-1 bg-slate-700/50 rounded-full" />
        </div>

        {/* Central Watch Casing */}
        <div className="w-72 sm:w-80 h-60 rounded-3xl bg-gradient-to-b from-slate-800 via-slate-900 to-black p-3.5 border-2 border-slate-600 shadow-2xl relative flex flex-col justify-between">
          {/* Subtle screw studs */}
          <span className="w-2 h-2 rounded-full bg-slate-600 border border-slate-500 absolute top-2 left-2" />
          <span className="w-2 h-2 rounded-full bg-slate-600 border border-slate-500 absolute top-2 right-2" />
          <span className="w-2 h-2 rounded-full bg-slate-600 border border-slate-500 absolute bottom-2 left-2" />
          <span className="w-2 h-2 rounded-full bg-slate-600 border border-slate-500 absolute bottom-2 right-2" />

          {/* Inner OLED Glass Display */}
          <div className="w-full h-full rounded-2xl bg-navy-950 border border-slate-800 p-3 flex flex-col justify-between relative overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:10px_10px] opacity-30 pointer-events-none" />

            {/* Watch Screen Top Bar */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 relative z-10">
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                NAVIBAND ESP32
              </span>
              <span>
                {distanceToManeuver !== null ? `IN ${Math.round(distanceToManeuver)}m` : 'STANDBY'}
              </span>
            </div>

            {/* 4 LEDs Physical Arrangement Layout */}
            <div className="grid grid-cols-2 gap-3 my-auto relative z-10 px-1 sm:px-2">
              
              {/* LEFT CHANNEL */}
              <div className={`p-2.5 rounded-xl border transition-all flex flex-col items-center space-y-1.5 ${
                isLeftVibrating ? 'bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-500/20' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between w-full px-1 text-[9px] font-mono text-slate-400 font-bold">
                  <span>LEFT WING</span>
                  {isLeftVibrating && (
                    <span className="text-emerald-400 flex items-center gap-0.5 text-[8px] animate-pulse">
                      <Vibrate className="w-2.5 h-2.5" /> BUZZ
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {/* Left Red LED */}
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-75 flex items-center justify-center relative ${
                        ledState.leftRed ? 'led-glow-red' : 'led-off'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${ledState.leftRed ? 'bg-white' : 'bg-red-950/70'}`} />
                    </div>
                    <span className="text-[8px] font-mono text-rose-400 font-bold">RED</span>
                  </div>

                  {/* Left Green LED */}
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-75 flex items-center justify-center relative ${
                        ledState.leftGreen ? 'led-glow-green' : 'led-off'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${ledState.leftGreen ? 'bg-white' : 'bg-emerald-950/70'}`} />
                    </div>
                    <span className="text-[8px] font-mono text-emerald-400 font-bold">GRN</span>
                  </div>
                </div>

                {/* Left Haptic Vibration Motor Indicator */}
                <div className={`w-full py-0.5 px-1.5 rounded flex items-center justify-center gap-1 text-[8px] font-mono border ${
                  isLeftVibrating 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
                    : 'bg-slate-950/60 text-slate-500 border-slate-800'
                }`}>
                  <Vibrate className="w-2.5 h-2.5" />
                  <span>{isLeftVibrating ? 'ERM PULSE ON' : 'HAPTIC MOTOR L'}</span>
                </div>
              </div>

              {/* RIGHT CHANNEL */}
              <div className={`p-2.5 rounded-xl border transition-all flex flex-col items-center space-y-1.5 ${
                isRightVibrating ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-500/20' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between w-full px-1 text-[9px] font-mono text-slate-400 font-bold">
                  <span>RIGHT WING</span>
                  {isRightVibrating && (
                    <span className="text-cyan-400 flex items-center gap-0.5 text-[8px] animate-pulse">
                      <Vibrate className="w-2.5 h-2.5" /> BUZZ
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {/* Right Green LED */}
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-75 flex items-center justify-center relative ${
                        ledState.rightGreen ? 'led-glow-green' : 'led-off'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${ledState.rightGreen ? 'bg-white' : 'bg-emerald-950/70'}`} />
                    </div>
                    <span className="text-[8px] font-mono text-emerald-400 font-bold">GRN</span>
                  </div>

                  {/* Right Red LED */}
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-75 flex items-center justify-center relative ${
                        ledState.rightRed ? 'led-glow-red' : 'led-off'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${ledState.rightRed ? 'bg-white' : 'bg-red-950/70'}`} />
                    </div>
                    <span className="text-[8px] font-mono text-rose-400 font-bold">RED</span>
                  </div>
                </div>

                {/* Right Haptic Vibration Motor Indicator */}
                <div className={`w-full py-0.5 px-1.5 rounded flex items-center justify-center gap-1 text-[8px] font-mono border ${
                  isRightVibrating 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse' 
                    : 'bg-slate-950/60 text-slate-500 border-slate-800'
                }`}>
                  <Vibrate className="w-2.5 h-2.5" />
                  <span>{isRightVibrating ? 'ERM PULSE ON' : 'HAPTIC MOTOR R'}</span>
                </div>
              </div>

            </div>

            {/* Watch Screen Bottom Status Bar */}
            <div className="relative z-10 flex items-center justify-center gap-2 py-0.5">
              <div className="shrink-0">{getDisplayIcon()}</div>
              <span className={`text-[9px] font-mono font-extrabold px-2.5 py-1 rounded-md border tracking-tight truncate ${
                isDestinationReached
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : activeDirection === 'STRAIGHT'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  : activeDirection === 'U-TURN'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : 'bg-slate-900 text-slate-300 border-slate-800'
              }`}>
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Silicone Strap */}
        <div className="w-32 h-9 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-900 rounded-b-xl border-b border-x border-slate-700 shadow-inner flex flex-col items-center justify-center space-y-1">
          <div className="w-16 h-1 bg-slate-700/50 rounded-full" />
          <div className="w-16 h-1 bg-slate-700/50 rounded-full" />
        </div>
      </div>

      {/* LED Timing Controls (Configurable ON / OFF durations) */}
      <div className="mt-2 pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Pulse Timing Calibration
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            ON: <strong className="text-white">{onDurationMs}ms</strong> | OFF: <strong className="text-white">{offDurationMs}ms</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Pulse ON Duration</span>
              <span>{onDurationMs} ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="600"
              step="25"
              value={onDurationMs}
              onChange={(e) => onTimingChange(Number(e.target.value), offDurationMs)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Pulse OFF Gap</span>
              <span>{offDurationMs} ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="500"
              step="25"
              value={offDurationMs}
              onChange={(e) => onTimingChange(onDurationMs, Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        <p className="text-[10px] text-slate-500 italic text-center pt-0.5">
          Simulating ESP32 4-LED & Dual-Haptic ERM Vibration Actuators.
        </p>
      </div>
    </div>
  );
});
