import React, { memo } from 'react';
import { 
  Zap, 
  CornerUpLeft, 
  CornerUpRight, 
  ArrowUp, 
  RotateCcw, 
  CheckCircle2, 
  Square, 
  AlertCircle,
  PlaySquare
} from 'lucide-react';
import { TurnDirection, PulseCount } from '../types/navigation';

export interface TestScenario {
  id: string;
  name: string;
  instruction: string;
  direction: TurnDirection;
  angle: number;
  pulseCount: PulseCount;
  description: string;
}

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'straight-road',
    name: 'Straight Road',
    instruction: 'Continue straight on Parkway Express',
    direction: 'STRAIGHT',
    angle: 0,
    pulseCount: 1,
    description: 'Both Green LEDs ON simultaneously'
  },
  {
    id: 'slight-left',
    name: 'Slight Left Turn',
    instruction: 'Bear slight left onto Riverside Way',
    direction: 'LEFT',
    angle: 115,
    pulseCount: 1,
    description: '1 Pulse (> 90° wide angle)'
  },
  {
    id: 'sharp-left',
    name: 'Sharp Left Turn',
    instruction: 'Turn sharp left onto Alpine Pass',
    direction: 'LEFT',
    angle: 45,
    pulseCount: 3,
    description: '3 Pulses (< 90° sharp turn)'
  },
  {
    id: 'slight-right',
    name: 'Slight Right Turn',
    instruction: 'Bear slight right onto Grand Boulevard',
    direction: 'RIGHT',
    angle: 120,
    pulseCount: 1,
    description: '1 Pulse (> 90° wide angle)'
  },
  {
    id: 'sharp-right',
    name: 'Sharp Right Turn',
    instruction: 'Turn sharp right onto Valley Canyon Road',
    direction: 'RIGHT',
    angle: 40,
    pulseCount: 3,
    description: '3 Pulses (< 90° sharp turn)'
  },
  {
    id: 'u-turn',
    name: 'U-Turn Maneuver',
    instruction: 'Make a U-turn at next crossover',
    direction: 'U-TURN',
    angle: 180,
    pulseCount: 4,
    description: '4 Pulses (Dual Red Alert + Green indicator)'
  },
  {
    id: 'destination-arrival',
    name: 'Destination Arrival',
    instruction: 'Destination Reached! You have arrived.',
    direction: 'ARRIVED',
    angle: 0,
    pulseCount: 1,
    description: 'Arrival mode: Both Green LEDs Lit'
  }
];

interface LEDTestPanelProps {
  onTestLeftTurn: (pulses: 1 | 2 | 3) => void;
  onTestRightTurn: (pulses: 1 | 2 | 3) => void;
  onTestStraight: () => void;
  onTestUTurn: () => void;
  onTestArrival: () => void;
  onTestStopAll: () => void;
  onSelectScenario: (scenario: TestScenario) => void;
  activeScenarioId?: string | null;
  isSimulationRunning: boolean;
  manualOverrideActive: boolean;
}

export const LEDTestPanel = memo<LEDTestPanelProps>(({
  onTestLeftTurn,
  onTestRightTurn,
  onTestStraight,
  onTestUTurn,
  onTestArrival,
  onTestStopAll,
  onSelectScenario,
  activeScenarioId,
  isSimulationRunning,
  manualOverrideActive,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm text-white tracking-wide uppercase">
            Interactive LED Test Bench
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Hardware Verification</span>
      </div>

      {/* Override Notice if running */}
      {isSimulationRunning && manualOverrideActive && (
        <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-600/60 text-amber-200 text-xs flex items-center space-x-2 animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <b>Manual Test Override:</b> Running test pattern without corrupting active route progress.
          </span>
        </div>
      )}

      {/* Section 1: Pre-Engineered Test Scenarios Selector (Mandatory Requirement) */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
          <PlaySquare className="w-3.5 h-3.5 text-emerald-400" />
          PRESET NAVIGATION TEST SCENARIOS:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEST_SCENARIOS.map((sc) => {
            const isSelected = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold truncate">
                  <span className="truncate">{sc.name}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                  {sc.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Individual Pattern Tests */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        {/* Left Turns (1, 2, 3 pulses) */}
        <div>
          <span className="text-[11px] font-mono font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
            <CornerUpLeft className="w-3.5 h-3.5 text-emerald-400" />
            LEFT TURN PATTERNS:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onTestLeftTurn(1)}
              className="py-2 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all flex flex-col items-center cursor-pointer shadow-sm"
            >
              <span className="text-emerald-400 font-mono font-bold">1 Pulse</span>
              <span className="text-[9px] text-slate-500">&gt; 90° Turn</span>
            </button>

            <button
              onClick={() => onTestLeftTurn(2)}
              className="py-2 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all flex flex-col items-center cursor-pointer shadow-sm"
            >
              <span className="text-emerald-400 font-mono font-bold">2 Pulses</span>
              <span className="text-[9px] text-slate-500">= 90° Square</span>
            </button>

            <button
              onClick={() => onTestLeftTurn(3)}
              className="py-2 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all flex flex-col items-center cursor-pointer shadow-sm"
            >
              <span className="text-emerald-400 font-mono font-bold">3 Pulses</span>
              <span className="text-[9px] text-slate-500">&lt; 90° Sharp</span>
            </button>
          </div>
        </div>

        {/* Right Turns (1, 2, 3 pulses) */}
        <div>
          <span className="text-[11px] font-mono font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
            <CornerUpRight className="w-3.5 h-3.5 text-cyan-400" />
            RIGHT TURN PATTERNS:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onTestRightTurn(1)}
              className="py-2 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all flex flex-col items-center cursor-pointer shadow-sm"
            >
              <span className="text-cyan-400 font-mono font-bold">1 Pulse</span>
              <span className="text-[9px] text-slate-500">&gt; 90° Turn</span>
            </button>

            <button
              onClick={() => onTestRightTurn(2)}
              className="py-2 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all flex flex-col items-center cursor-pointer shadow-sm"
            >
              <span className="text-cyan-400 font-mono font-bold">2 Pulses</span>
              <span className="text-[9px] text-slate-500">= 90° Square</span>
            </button>

            <button
              onClick={() => onTestRightTurn(3)}
              className="py-2 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all flex flex-col items-center cursor-pointer shadow-sm"
            >
              <span className="text-cyan-400 font-mono font-bold">3 Pulses</span>
              <span className="text-[9px] text-slate-500">&lt; 90° Sharp</span>
            </button>
          </div>
        </div>

        {/* Special Modes */}
        <div>
          <span className="text-[11px] font-mono font-semibold text-slate-400 block mb-1.5">
            SPECIAL SIGNAL MODES:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Straight: Dual Green */}
            <button
              onClick={onTestStraight}
              className="py-2 px-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/60 text-xs font-semibold text-emerald-300 transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer"
            >
              <ArrowUp className="w-4 h-4 text-emerald-400" />
              <span className="font-bold">Straight</span>
              <span className="text-[9px] text-emerald-400/80 font-mono">Both Green ON</span>
            </button>

            {/* U-Turn: 4 Pulses */}
            <button
              onClick={onTestUTurn}
              className="py-2 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-700/60 text-xs font-semibold text-rose-300 transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span className="font-bold">U-Turn</span>
              <span className="text-[9px] text-rose-400/80 font-mono">4 Pulses (Dual Red)</span>
            </button>

            {/* Arrival */}
            <button
              onClick={onTestArrival}
              className="py-2 px-2 rounded-xl bg-teal-950/40 hover:bg-teal-900/50 border border-teal-700/60 text-xs font-semibold text-teal-300 transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span className="font-bold">Arrival</span>
              <span className="text-[9px] text-teal-400/80 font-mono">Both Green Lit</span>
            </button>

            {/* Stop / Turn Off All */}
            <button
              onClick={onTestStopAll}
              className="py-2 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer"
            >
              <Square className="w-4 h-4 text-slate-400" />
              <span className="font-bold">Turn Off</span>
              <span className="text-[9px] text-slate-500 font-mono">All LEDs OFF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
