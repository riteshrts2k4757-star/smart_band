import React, { memo } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { LogEvent } from '../types/navigation';

interface SimulationEventLogProps {
  logs: LogEvent[];
  onClearLogs: () => void;
}

export const SimulationEventLog = memo<SimulationEventLogProps>(({ logs, onClearLogs }) => {
  const getBadge = (type: LogEvent['type']) => {
    switch (type) {
      case 'success':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">SUCCESS</span>;
      case 'warning':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">WARN</span>;
      case 'turn':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">MANEUVER</span>;
      case 'pulse':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">HAPTIC/LED</span>;
      case 'error':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">ALERT</span>;
      case 'info':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-700/60 text-slate-300 border border-slate-600/40">SYSTEM</span>;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3 flex flex-col h-72">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white tracking-wide uppercase">
            Simulation Event Log
          </h3>
          <span className="text-[10px] font-mono text-slate-400">({logs.length})</span>
        </div>
        <button
          onClick={onClearLogs}
          disabled={logs.length === 0}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center space-x-1 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Log</span>
        </button>
      </div>

      {/* Log items container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            No events logged yet. Load a route or start the simulator to see live events.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start space-x-2.5 hover:bg-slate-900/90 transition-colors"
            >
              <span className="text-[10px] text-slate-500 shrink-0 pt-0.5">
                {log.timestamp}
              </span>
              <div className="shrink-0">{getBadge(log.type)}</div>
              <div className="flex-1 min-w-0">
                <span className="text-slate-200 font-medium break-words">{log.message}</span>
                {log.details && (
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{log.details}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

