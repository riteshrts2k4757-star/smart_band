import React from 'react';
import { ShieldCheck, HeartHandshake, EyeOff, Radio, BatteryCharging, Zap } from 'lucide-react';

export const AboutProject: React.FC = () => {
  return (
    <section id="about-project" className="py-16 border-b border-slate-800/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold">
            <span>Project Mission & Design Philosophy</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            About NAVIBAND
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Eliminating screen-distracted navigation through peripheral visual cues and targeted haptic feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Eyes-on-the-road safety */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Eyes-On-The-Road Safety</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Standard GPS navigation forces drivers and cyclists to glance away from complex intersections to read digital smartphone maps. NAVIBAND replaces visual clutter with glanceable, intuitive light signals.
            </p>
          </div>

          {/* Card 2: 4-Channel Precision */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Angle-Differentiated Pulses</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Not all turns are equal. By encoding maneuver angles into pulse quantities—from slight highway merges to right-angle intersections and hairpins—users know exactly how sharply to turn without guesswork.
            </p>
          </div>

          {/* Card 3: Physical ESP32 Target */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Physical Wearable Roadmap</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              This interactive platform enables extensive test suites and simulation of real OpenRouteService routes before flashing firmware to the physical ESP32 wristband hardware equipped with BLE and haptic drivers.
            </p>
          </div>
        </div>

        {/* Pulse Rule Summary Matrix */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Turn Classification Specification Matrix</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 px-4">Maneuver Category</th>
                  <th className="pb-3 px-4">Turn Angle Deflection</th>
                  <th className="pb-3 px-4">Pulse Count</th>
                  <th className="pb-3 px-4">Active LED Channel</th>
                  <th className="pb-3 px-4">Signal Timing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-bold text-emerald-400">Wide / Gentle Turn</td>
                  <td className="py-3 px-4">&gt; 90° (&gt; 95°)</td>
                  <td className="py-3 px-4 font-bold text-white">1 Pulse</td>
                  <td className="py-3 px-4">Direction Green LED</td>
                  <td className="py-3 px-4">250ms ON / 200ms OFF</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-cyan-400">Square Turn</td>
                  <td className="py-3 px-4">Exactly 90° (85° - 95°)</td>
                  <td className="py-3 px-4 font-bold text-white">2 Pulses</td>
                  <td className="py-3 px-4">Direction Green LED</td>
                  <td className="py-3 px-4">250ms ON / 200ms OFF</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-indigo-400">Sharp Turn</td>
                  <td className="py-3 px-4">&lt; 90° (&lt; 85°)</td>
                  <td className="py-3 px-4 font-bold text-white">3 Pulses</td>
                  <td className="py-3 px-4">Direction Green LED</td>
                  <td className="py-3 px-4">250ms ON / 200ms OFF</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-rose-400">U-Turn / Hairpin</td>
                  <td className="py-3 px-4">Priority (≥ 165° or ORS type 9)</td>
                  <td className="py-3 px-4 font-bold text-white">4 Pulses</td>
                  <td className="py-3 px-4">Both Red LEDs Flash + Direction Green</td>
                  <td className="py-3 px-4">Distinctive Warning Pattern</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-teal-400">Straight Movement</td>
                  <td className="py-3 px-4">Cruise Navigation (&lt; 12°)</td>
                  <td className="py-3 px-4 font-bold text-white">Continuous</td>
                  <td className="py-3 px-4 font-semibold text-emerald-300">Both Green LEDs ON Together</td>
                  <td className="py-3 px-4">Steady Glow</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-amber-400">Arrival</td>
                  <td className="py-3 px-4">Destination Reached (&lt; 5m)</td>
                  <td className="py-3 px-4 font-bold text-white">Continuous</td>
                  <td className="py-3 px-4 font-semibold text-emerald-300">Both Green LEDs ON Together</td>
                  <td className="py-3 px-4">Arrival Celebration</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

