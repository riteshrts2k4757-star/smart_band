import React from 'react';
import { Compass, Github, Heart, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-12 border-t border-slate-900 bg-navy-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-navy-900 border border-slate-800 flex items-center justify-center">
            <Compass className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="font-bold text-white tracking-wider text-sm">NAVIBAND</span>
            <p className="text-[11px] text-slate-500">Haptic Navigation & ESP32 Simulator</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-[11px] font-mono text-slate-400">
          <span>Routing via OpenRouteService API</span>
          <span>•</span>
          <span>OpenStreetMap & CartoDB Tiles</span>
          <span>•</span>
          <span>ESP32 Ready</span>
        </div>

        <div className="text-center sm:text-right text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} NAVIBAND Project. Built for pairs & hardware prototyping.</p>
        </div>
      </div>
    </footer>
  );
};

