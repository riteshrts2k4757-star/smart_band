import React, { useState } from 'react';
import { Compass, Cpu, Menu, X, Radio, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  orsConnected: boolean;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ orsConnected, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Overview', id: 'hero' },
    { label: 'Simulator', id: 'simulator' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'About Project', id: 'about-project' },
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => handleLinkClick('hero')}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
            <div className="w-full h-full bg-navy-900 rounded-[11px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-emerald-400 group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                NAVI<span className="text-emerald-400">BAND</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold tracking-wide">
                ESP32 SIM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Haptic GPS Wristband Platform</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Status Indicators */}
        <div className="hidden lg:flex items-center space-x-3">
          {/* ORS Status */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border ${
            orsConnected 
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50' 
              : 'bg-amber-950/40 text-amber-300 border-amber-800/50'
          }`}>
            <span className={`w-2 h-2 rounded-full ${orsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>ORS {orsConnected ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Simulator status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-800/50">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sim v2.0 Ready</span>
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2 bg-navy-900/95 border-b border-slate-800 backdrop-blur-xl">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 flex flex-col space-y-2 border-t border-slate-800/80">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono ${
              orsConnected ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>OpenRouteService: {orsConnected ? 'Connected & Ready' : 'Key Check Needed'}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

