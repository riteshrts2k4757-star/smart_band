import React, { useState, memo } from 'react';
import { 
  Milestone, 
  Clock, 
  MapPin, 
  CornerUpLeft, 
  CornerUpRight, 
  ArrowUp, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  ListFilter 
} from 'lucide-react';
import { ParsedRoute, ParsedManeuver, TurnDirection } from '../types/navigation';
import { formatDistance, formatDuration } from '../utils/geoUtils';

interface RouteSummaryProps {
  route: ParsedRoute | null;
  activeStepIndex: number;
}

export const RouteSummary = memo<RouteSummaryProps>(({ route, activeStepIndex }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  if (!route) return null;

  const getDirectionIcon = (dir: TurnDirection, size = 16) => {
    switch (dir) {
      case 'LEFT':
        return <CornerUpLeft size={size} className="text-emerald-400" />;
      case 'RIGHT':
        return <CornerUpRight size={size} className="text-cyan-400" />;
      case 'U-TURN':
        return <RotateCcw size={size} className="text-rose-400" />;
      case 'ARRIVED':
        return <MapPin size={size} className="text-amber-400" />;
      case 'STRAIGHT':
      default:
        return <ArrowUp size={size} className="text-emerald-300" />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
      {/* Route Quick Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {/* Distance */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Milestone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Distance</span>
            <span className="text-sm font-extrabold text-white">
              {formatDistance(route.totalDistanceMeters)}
            </span>
          </div>
        </div>

        {/* ORS Duration */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">ORS Est. Time</span>
            <span className="text-sm font-extrabold text-white">
              {formatDuration(route.totalDurationSeconds)}
            </span>
          </div>
        </div>

        {/* Total Maneuvers */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <ListFilter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Maneuvers</span>
            <span className="text-sm font-extrabold text-white">
              {route.steps.length} Steps
            </span>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Instruction Toggle */}
      <div className="pt-1">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Turn-by-Turn Maneuvers & Pulses ({route.steps.length})
          </span>
          {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showInstructions && (
          <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {route.steps.map((step, idx) => {
              const isActive = idx === activeStepIndex;
              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-xl text-xs border transition-all flex items-start justify-between ${
                    isActive
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="p-1 rounded-lg bg-slate-800 mt-0.5">
                      {getDirectionIcon(step.direction, 14)}
                    </div>
                    <div>
                      <p className={`font-semibold ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>
                        {step.instruction}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span>{formatDistance(step.segmentDistance)}</span>
                        {step.direction !== 'STRAIGHT' && step.direction !== 'ARRIVED' && (
                          <>
                            <span>•</span>
                            <span>Angle: {step.angle}°</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pulse count badge */}
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      step.direction === 'U-TURN'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : step.direction === 'STRAIGHT'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {step.direction === 'STRAIGHT'
                        ? 'DUAL GREEN'
                        : `${step.pulseCount} Pulse${step.pulseCount > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

