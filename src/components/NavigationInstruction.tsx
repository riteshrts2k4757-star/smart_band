import React, { memo } from 'react';
import { 
  CornerUpLeft, 
  CornerUpRight, 
  ArrowUp, 
  RotateCcw, 
  MapPin, 
  Navigation, 
  Clock, 
  Milestone, 
  Gauge, 
  Sparkles,
  AlertTriangle,
  Zap,
  BellRing
} from 'lucide-react';
import { TurnDirection, ParsedManeuver, SimulationStatus, WarningStage } from '../types/navigation';
import { formatDistance, formatDuration } from '../utils/geoUtils';

interface NavigationInstructionProps {
  status: SimulationStatus;
  currentManeuver: ParsedManeuver | null;
  distanceToNextTurn: number;
  warningStage?: WarningStage;
  earlyWarningDist?: number;
  mainSignalDist?: number;
  currentSpeedKmh: number;
  distanceTravelledMeters: number;
  remainingDistanceMeters: number;
  simulatedEtaSeconds: number;
  startLabel: string;
  destLabel: string;
}

export const NavigationInstruction = memo<NavigationInstructionProps>(({
  status,
  currentManeuver,
  distanceToNextTurn,
  warningStage = 'APPROACHING',
  earlyWarningDist = 150,
  mainSignalDist = 50,
  currentSpeedKmh,
  distanceTravelledMeters,
  remainingDistanceMeters,
  simulatedEtaSeconds,
  startLabel,
  destLabel,
}) => {
  const totalDistance = distanceTravelledMeters + remainingDistanceMeters;
  const progressPercent = totalDistance > 0 
    ? Math.min(100, Math.max(0, Math.round((distanceTravelledMeters / totalDistance) * 100))) 
    : 0;

  const isImmediate = warningStage === 'IMMEDIATE_WARNING' || (distanceToNextTurn <= mainSignalDist && currentManeuver && currentManeuver.direction !== 'STRAIGHT' && currentManeuver.direction !== 'ARRIVED');
  const isEarly = warningStage === 'EARLY_WARNING' || (distanceToNextTurn <= earlyWarningDist && distanceToNextTurn > mainSignalDist && currentManeuver && currentManeuver.direction !== 'STRAIGHT' && currentManeuver.direction !== 'ARRIVED');
  const isMaintaining = warningStage === 'MAINTAIN_TURN';

  const getManeuverIcon = (dir?: TurnDirection) => {
    switch (dir) {
      case 'LEFT':
        return <CornerUpLeft className={`w-10 h-10 text-emerald-400 ${isImmediate ? 'animate-bounce text-cyan-300' : isEarly ? 'animate-pulse' : ''}`} />;
      case 'RIGHT':
        return <CornerUpRight className={`w-10 h-10 text-emerald-400 ${isImmediate ? 'animate-bounce text-cyan-300' : isEarly ? 'animate-pulse' : ''}`} />;
      case 'U-TURN':
        return <RotateCcw className="w-10 h-10 text-rose-400 animate-spin" style={{ animationDuration: '3s' }} />;
      case 'ARRIVED':
        return <MapPin className="w-10 h-10 text-emerald-400 animate-bounce" />;
      case 'STRAIGHT':
      default:
        return <ArrowUp className="w-10 h-10 text-emerald-400" />;
    }
  };

  const getManeuverBannerTitle = () => {
    if (status === 'ARRIVED') return 'DESTINATION REACHED!';
    if (status === 'OFF_ROUTE' || status === 'REROUTING') return 'OFF ROUTE — RECALCULATING...';
    if (!currentManeuver || currentManeuver.direction === 'STRAIGHT') return 'CONTINUE STRAIGHT';

    const dir = currentManeuver.direction;
    const dist = Math.round(distanceToNextTurn);

    if (isImmediate) {
      if (dir === 'LEFT') return 'TURN LEFT NOW';
      if (dir === 'RIGHT') return 'TURN RIGHT NOW';
      if (dir === 'U-TURN') return 'MAKE U-TURN NOW';
    }

    if (isEarly) {
      if (dir === 'LEFT') return `↰ LEFT TURN IN ${dist} m`;
      if (dir === 'RIGHT') return `↱ RIGHT TURN IN ${dist} m`;
      if (dir === 'U-TURN') return `⤹ U-TURN IN ${dist} m`;
    }

    if (isMaintaining) {
      return `EXECUTING ${dir} TURN`;
    }

    if (dist <= 300) {
      if (dir === 'LEFT') return `LEFT TURN AHEAD (${dist} m)`;
      if (dir === 'RIGHT') return `RIGHT TURN AHEAD (${dist} m)`;
      if (dir === 'U-TURN') return `U-TURN AHEAD (${dist} m)`;
    }

    return `CONTINUE TOWARDS ${dir} TURN`;
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
      {/* Primary Prominent Navigation Instruction Card */}
      <div className={`p-4 rounded-2xl border transition-all ${
        status === 'ARRIVED'
          ? 'bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border-emerald-500 shadow-lg shadow-emerald-500/30'
          : status === 'OFF_ROUTE' || status === 'REROUTING'
          ? 'bg-rose-950/90 border-rose-500 shadow-lg shadow-rose-500/30'
          : isImmediate
          ? 'bg-gradient-to-r from-cyan-950/95 via-navy-900 to-emerald-950/90 border-cyan-400 shadow-xl shadow-cyan-500/30 ring-1 ring-cyan-400/50'
          : isEarly
          ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-emerald-950/70 border-amber-500/80 shadow-lg shadow-amber-500/20'
          : 'bg-slate-900/90 border-slate-700/80'
      }`}>
        <div className="flex items-center space-x-4">
          {/* Direction icon */}
          <div className={`p-3 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${
            isImmediate 
              ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-400/30' 
              : isEarly
              ? 'bg-amber-500/20 border-amber-400/60'
              : 'bg-slate-800/90 border-slate-700'
          }`}>
            {getManeuverIcon(currentManeuver?.direction)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Dynamic Action Banner */}
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-mono uppercase tracking-wider font-black ${
                  isImmediate 
                    ? 'text-cyan-300 animate-pulse text-sm' 
                    : isEarly
                    ? 'text-amber-300 font-bold'
                    : 'text-emerald-400'
                }`}>
                  {getManeuverBannerTitle()}
                </span>

                {/* Stage Badges */}
                {isImmediate && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-navy-950 font-black text-[9px] font-mono animate-bounce flex items-center gap-1 shadow-sm shadow-cyan-400/50">
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    STAGE 2: IMMEDIATE (50m)
                  </span>
                )}
                {isEarly && !isImmediate && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/60 font-bold text-[9px] font-mono flex items-center gap-1">
                    <BellRing className="w-2.5 h-2.5" />
                    STAGE 1: EARLY WARNING (150m)
                  </span>
                )}
                {isMaintaining && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[9px] font-mono">
                    TURNING ZONE
                  </span>
                )}
              </div>

              {/* Pulse Count Badge */}
              {currentManeuver && currentManeuver.direction !== 'STRAIGHT' && currentManeuver.direction !== 'ARRIVED' && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shrink-0">
                  {currentManeuver.pulseCount} Pulse{currentManeuver.pulseCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Instruction road text */}
            <p className="text-base sm:text-lg font-extrabold text-white truncate mt-1">
              {currentManeuver?.instruction || 'Ready to navigate'}
            </p>

            {/* Distance Countdown & Geometry Metrics */}
            <div className="flex items-center space-x-3 text-xs font-mono text-slate-300 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                Next Turn: <strong className={isImmediate ? 'text-cyan-300 text-sm font-black' : isEarly ? 'text-amber-300 font-bold' : 'text-white'}>
                  {formatDistance(distanceToNextTurn)}
                </strong>
              </span>
              {currentManeuver?.angle ? (
                <>
                  <span className="text-slate-600">•</span>
                  <span>Corner Angle: <strong className="text-white">{currentManeuver.angle}°</strong></span>
                </>
              ) : null}
              {currentManeuver?.direction && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>Direction: <strong className="text-emerald-400 font-bold">{currentManeuver.direction}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Route Progress Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Route Progress
            </span>
            <span className="font-bold text-emerald-400">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden p-[1px]">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-200 shadow-sm shadow-emerald-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Speed */}
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-400 mb-0.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[10px] uppercase">Speed</span>
          </div>
          <span className="text-sm font-extrabold text-white font-mono">
            {currentSpeedKmh} km/h
          </span>
        </div>

        {/* Travelled */}
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-400 mb-0.5">
            <Milestone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[10px] uppercase">Travelled</span>
          </div>
          <span className="text-sm font-extrabold text-white font-mono">
            {formatDistance(distanceTravelledMeters)}
          </span>
        </div>

        {/* Remaining Distance */}
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-400 mb-0.5">
            <Navigation className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-[10px] uppercase">Remaining</span>
          </div>
          <span className="text-sm font-extrabold text-white font-mono">
            {formatDistance(remainingDistanceMeters)}
          </span>
        </div>

        {/* Simulated ETA */}
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center space-x-1.5 text-slate-400 mb-0.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[10px] uppercase">Sim. ETA</span>
          </div>
          <span className="text-sm font-extrabold text-white font-mono">
            {currentSpeedKmh > 0 ? formatDuration(simulatedEtaSeconds) : 'Stopped'}
          </span>
        </div>
      </div>

      {/* Origin & Destination Display */}
      <div className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-1 text-xs">
        <div className="flex items-center space-x-2 text-slate-300 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-slate-400 font-mono text-[10px] w-12 shrink-0">FROM:</span>
          <span className="truncate font-medium">{startLabel || 'Not selected'}</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300 truncate">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span className="text-slate-400 font-mono text-[10px] w-12 shrink-0">TO:</span>
          <span className="truncate font-medium">{destLabel || 'Not selected'}</span>
        </div>
      </div>
    </div>
  );
});
