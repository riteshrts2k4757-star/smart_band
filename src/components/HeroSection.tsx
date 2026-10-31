import React from 'react';
import { Play, ArrowRight, Activity, Cpu, Sparkles, Navigation, Check } from 'lucide-react';

interface HeroSectionProps {
  onStartSimulation: () => void;
  onExploreHowItWorks: () => void;
  orsConnected: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartSimulation,
  onExploreHowItWorks,
  orsConnected,
}) => {
  return (
    <section id="hero" className="relative pt-6 pb-12 overflow-hidden border-b border-slate-800/60">
      {/* Background ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            {/* Project status pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-medium text-slate-300">
                ESP32 Hardware Simulation Engine
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live GPS Routing
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Navigation Beyond <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Your Screen.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              A smart GPS navigation wristband that transforms turn-by-turn directions into intuitive visual and haptic signals. Keep your eyes on the road while 4-channel LED pulses guide every maneuver.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onStartSimulation}
                className="group inline-flex items-center space-x-3 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm sm:text-base cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
                <span>Start Simulation</span>
              </button>

              <button
                onClick={onExploreHowItWorks}
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all text-sm sm:text-base cursor-pointer"
              >
                <span>Explore How It Works</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Status indicators */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${orsConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>OpenRouteService {orsConnected ? 'Connected' : 'Offline'}</span>
              </div>
              <span className="text-slate-700 hidden sm:inline">•</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Turn-Angle Pulse Engine</span>
              </div>
              <span className="text-slate-700 hidden sm:inline">•</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Real-Time Vehicle Follow</span>
              </div>
            </div>
          </div>

          {/* Right Column: Wristband Device Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              {/* Outer decorative card */}
              <div className="relative glass-panel rounded-3xl p-6 border border-slate-700/60 shadow-2xl bg-gradient-to-b from-slate-900/90 to-navy-950/90">
                {/* Device badge */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono font-semibold text-slate-200">ESP32-S3 HAPTIC UNIT</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                    ONLINE
                  </span>
                </div>

                {/* Stylized wristband illustration */}
                <div className="py-6 flex flex-col items-center">
                  {/* Top strap */}
                  <div className="w-24 h-6 bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-lg border-t border-x border-slate-700 shadow-inner" />
                  
                  {/* Central Watch/Device Body */}
                  <div className="w-56 h-44 rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-black p-3.5 border-2 border-slate-700 shadow-2xl relative flex flex-col justify-between">
                    {/* Device bezel inner */}
                    <div className="w-full h-full rounded-xl bg-navy-950 border border-slate-800/80 p-3 flex flex-col justify-between relative overflow-hidden">
                      {/* Subtle radar sweep grid background */}
                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                      {/* Header in watch */}
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 relative z-10">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Activity className="w-3 h-3 animate-pulse" /> NAV ACTIVE
                        </span>
                        <span>40 km/h</span>
                      </div>

                      {/* Central LEDs layout preview */}
                      <div className="grid grid-cols-2 gap-4 my-auto relative z-10 px-3">
                        {/* Left Side */}
                        <div className="flex flex-col items-center space-y-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                          <span className="text-[9px] font-mono text-slate-400 font-medium">LEFT</span>
                          <div className="flex space-x-2">
                            {/* Left Red */}
                            <div className="w-5 h-5 rounded-full led-off flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-900/60" />
                            </div>
                            {/* Left Green - Lit Demo */}
                            <div className="w-5 h-5 rounded-full led-glow-green flex items-center justify-center animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-100" />
                            </div>
                          </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex flex-col items-center space-y-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                          <span className="text-[9px] font-mono text-slate-400 font-medium">RIGHT</span>
                          <div className="flex space-x-2">
                            {/* Right Green - Lit Demo */}
                            <div className="w-5 h-5 rounded-full led-glow-green flex items-center justify-center animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-100" />
                            </div>
                            {/* Right Red */}
                            <div className="w-5 h-5 rounded-full led-off flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-900/60" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Straight mode status footer on watch */}
                      <div className="relative z-10 text-center">
                        <span className="text-[10px] font-mono font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                          STRAIGHT: BOTH GREEN LIT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom strap */}
                  <div className="w-24 h-6 bg-gradient-to-t from-slate-800 to-slate-900 rounded-b-lg border-b border-x border-slate-700 shadow-inner" />
                </div>

                {/* Sub info */}
                <div className="mt-2 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> 4-Angle Pulse Logic
                  </span>
                  <span className="font-mono text-slate-300">ESP32 BLE Ready</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

