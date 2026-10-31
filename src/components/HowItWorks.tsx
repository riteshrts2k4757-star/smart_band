import React from 'react';
import { 
  Route, 
  Cpu, 
  Radio, 
  Bluetooth, 
  Eye, 
  Compass, 
  Sparkles, 
  ChevronRight, 
  ArrowRight, 
  Layers 
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Geocoding & Selection',
      desc: 'User inputs source and destination addresses via OpenRouteService Pelias geocoding or directly by clicking coordinates on the interactive map.',
      icon: <Compass className="w-5 h-5 text-emerald-400" />
    },
    {
      step: '02',
      title: 'ORS Real Routing',
      desc: 'The Express backend securely communicates with OpenRouteService using authenticated headers to fetch genuine driving geometry and maneuver steps.',
      icon: <Route className="w-5 h-5 text-cyan-400" />
    },
    {
      step: '03',
      title: 'Geometry & Simulation',
      desc: 'Route coordinates are parsed into cumulative distance matrices. A requestAnimationFrame loop smoothly interpolates vehicle position and heading.',
      icon: <Layers className="w-5 h-5 text-indigo-400" />
    },
    {
      step: '04',
      title: 'Turn & Angle Classifier',
      desc: 'ORS maneuver steps and bearing changes are analyzed. Angles classify into exact pulse counts: >90° (1 pulse), =90° (2 pulses), <90° (3 pulses), U-turn (4 pulses).',
      icon: <Cpu className="w-5 h-5 text-amber-400" />
    },
    {
      step: '05',
      title: '4-Channel LED Simulator',
      desc: 'Discrete Left/Right Red & Green LEDs illuminate. Left/Right signals trigger independent pulses, straight turns both green ON, and U-turns flash red.',
      icon: <Sparkles className="w-5 h-5 text-teal-400" />
    },
    {
      step: '06',
      title: 'Future ESP32 Hardware',
      desc: 'In the physical deployment phase, identical byte packets will be broadcast via Bluetooth Low Energy (BLE) to an ESP32 microcontroller with ERM vibration motors.',
      icon: <Bluetooth className="w-5 h-5 text-purple-400" />
    }
  ];

  return (
    <section id="how-it-works" className="py-16 border-b border-slate-800/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
            <span>System Pipeline & Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How NAVIBAND Works
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            From cloud routing providers to microsecond haptic pulse schedulers: explore how turn-by-turn maneuvers are translated into intuitive non-visual signals.
          </p>
        </div>

        {/* Clean Architecture Diagram Banner */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950">
          <span className="text-[11px] font-mono uppercase text-slate-400 block mb-4 font-semibold text-center sm:text-left">
            Data Flow Pipeline
          </span>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-bold">
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 shadow-md flex items-center gap-2">
              <Route className="w-4 h-4 text-cyan-400" />
              <span>OpenRouteService</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />

            <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 shadow-md flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>React Navigation Dashboard</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />

            <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-indigo-300 shadow-md flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Turn Detection Engine</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />

            <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 shadow-md flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>LED Simulation</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden md:block" />

            <div className="px-3.5 py-2.5 rounded-xl bg-purple-950/60 border border-purple-700/60 text-purple-300 shadow-md flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-purple-400" />
              <span>Future ESP32 BLE</span>
            </div>
          </div>
        </div>

        {/* 6 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.step}
              className="glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-slate-700 transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-slate-700 transition-colors">
                  {s.icon}
                </div>
                <span className="font-mono text-xl font-extrabold text-slate-600 group-hover:text-emerald-400/80 transition-colors">
                  {s.step}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                {s.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Clarification banner */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 max-w-2xl mx-auto">
          <strong className="text-slate-300">Important Scope Note:</strong> This web application serves as the complete, interactive simulation environment for validating navigation patterns and user responsiveness prior to embedded ESP32 BLE integration.
        </div>
      </div>
    </section>
  );
};

