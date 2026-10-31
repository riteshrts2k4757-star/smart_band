import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { NavigationDashboard } from './components/NavigationDashboard';
import { HowItWorks } from './components/HowItWorks';
import { AboutProject } from './components/AboutProject';
import { Footer } from './components/Footer';
import { checkBackendHealth } from './services/api';

export const App: React.FC = () => {
  const [orsConnected, setOrsConnected] = useState<boolean>(true);

  // Check backend health on mount
  useEffect(() => {
    async function verifyConnection() {
      const res = await checkBackendHealth();
      setOrsConnected(res.orsConnected);
    }
    verifyConnection();
  }, []);

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Sticky Navigation */}
      <Navbar
        orsConnected={orsConnected}
        onNavigate={handleNavigate}
      />

      {/* Hero Section */}
      <HeroSection
        orsConnected={orsConnected}
        onStartSimulation={() => handleNavigate('simulator')}
        onExploreHowItWorks={() => handleNavigate('how-it-works')}
      />

      {/* Main Interactive GPS & Wristband Simulator Dashboard */}
      <NavigationDashboard />

      {/* How It Works Section */}
      <HowItWorks />

      {/* About Project Section */}
      <AboutProject />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;

