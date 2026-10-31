import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Search, 
  MapPin, 
  ArrowUpDown, 
  Navigation, 
  MousePointerClick, 
  Sparkles, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { searchPlaces, GeocodeItem } from '../services/api';
import { LocationPoint } from '../types/navigation';

interface LocationSearchProps {
  startLocation: LocationPoint | null;
  destLocation: LocationPoint | null;
  onSetStartLocation: (loc: LocationPoint) => void;
  onSetDestLocation: (loc: LocationPoint) => void;
  onSwapLocations: () => void;
  onFindRoute: () => void;
  isLoadingRoute: boolean;
  selectionMode: 'start' | 'dest' | null;
  onToggleSelectionMode: (mode: 'start' | 'dest') => void;
  errorMessage: string | null;
}

// Preset real-world routes for instant one-click testing
const PRESET_ROUTES = [
  {
    name: 'Heidelberg Neckar Drive',
    start: { label: 'Heidelberg Castle, Germany', coordinates: [8.7153, 49.4106] as [number, number] },
    dest: { label: 'University of Heidelberg, Germany', coordinates: [8.6815, 49.4146] as [number, number] },
  },
  {
    name: 'Berlin City Route',
    start: { label: 'Brandenburg Gate, Berlin, Germany', coordinates: [13.3777, 52.5163] as [number, number] },
    dest: { label: 'Alexanderplatz, Berlin, Germany', coordinates: [13.4132, 52.5219] as [number, number] },
  },
  {
    name: 'Munich Center Maneuver',
    start: { label: 'Marienplatz, Munich, Germany', coordinates: [11.5755, 48.1371] as [number, number] },
    dest: { label: 'English Garden, Munich, Germany', coordinates: [11.5956, 48.1528] as [number, number] },
  }
];

export const LocationSearch = memo<LocationSearchProps>(({
  startLocation,
  destLocation,
  onSetStartLocation,
  onSetDestLocation,
  onSwapLocations,
  onFindRoute,
  isLoadingRoute,
  selectionMode,
  onToggleSelectionMode,
  errorMessage,
}) => {
  const [startQuery, setStartQuery] = useState(startLocation?.label || '');
  const [destQuery, setDestQuery] = useState(destLocation?.label || '');

  const [startSuggestions, setStartSuggestions] = useState<GeocodeItem[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodeItem[]>([]);

  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);

  const [geoError, setGeoError] = useState<string | null>(null);

  const startDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const destDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync inputs with props if changed externally
  useEffect(() => {
    if (startLocation) setStartQuery(startLocation.label);
  }, [startLocation]);

  useEffect(() => {
    if (destLocation) setDestQuery(destLocation.label);
  }, [destLocation]);

  // Handle Start search typing with debounce
  const handleStartQueryChange = (text: string) => {
    setStartQuery(text);
    if (startDebounceRef.current) clearTimeout(startDebounceRef.current);

    if (text.trim().length < 2) {
      setStartSuggestions([]);
      return;
    }

    startDebounceRef.current = setTimeout(async () => {
      setIsSearchingStart(true);
      try {
        const results = await searchPlaces(text, 5);
        setStartSuggestions(results);
      } catch (err: any) {
        console.error('Start search failed:', err.message);
      } finally {
        setIsSearchingStart(false);
      }
    }, 350);
  };

  // Handle Dest search typing with debounce
  const handleDestQueryChange = (text: string) => {
    setDestQuery(text);
    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);

    if (text.trim().length < 2) {
      setDestSuggestions([]);
      return;
    }

    destDebounceRef.current = setTimeout(async () => {
      setIsSearchingDest(true);
      try {
        const results = await searchPlaces(text, 5);
        setDestSuggestions(results);
      } catch (err: any) {
        console.error('Dest search failed:', err.message);
      } finally {
        setIsSearchingDest(false);
      }
    }, 350);
  };

  // Geolocation
  const handleUseMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        onSetStartLocation({
          label: `My Current Location (${coords[1].toFixed(4)}, ${coords[0].toFixed(4)})`,
          coordinates: coords
        });
      },
      (err) => {
        let msg = 'Unable to retrieve location.';
        if (err.code === 1) msg = 'Location permission denied. Please allow location access or choose on map.';
        else if (err.code === 2) msg = 'Location unavailable. Please search manually.';
        else if (err.code === 3) msg = 'Location request timed out.';
        setGeoError(msg);
      },
      { timeout: 8000 }
    );
  };

  const handleApplyPreset = (preset: typeof PRESET_ROUTES[0]) => {
    onSetStartLocation(preset.start);
    onSetDestLocation(preset.dest);
    setStartQuery(preset.start.label);
    setDestQuery(preset.dest.label);
    setStartSuggestions([]);
    setDestSuggestions([]);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white tracking-wide uppercase">Route Planner</h3>
        </div>
        <button
          onClick={handleUseMyLocation}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium hover:underline cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Use My Location</span>
        </button>
      </div>

      {/* Geolocation error notice */}
      {geoError && (
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Route Error Message from ORS */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <strong className="block font-semibold">Routing Error</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Inputs container */}
      <div className="space-y-3 relative">
        {/* Start Location Input */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Starting Location
            </span>
            <button
              onClick={() => onToggleSelectionMode('start')}
              className={`text-[11px] px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                selectionMode === 'start'
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-800/80'
              }`}
            >
              <MousePointerClick className="w-3 h-3" />
              {selectionMode === 'start' ? 'Click Map Now' : 'Pick on Map'}
            </button>
          </label>

          <div className="relative">
            <input
              type="text"
              value={startQuery}
              onChange={(e) => handleStartQueryChange(e.target.value)}
              placeholder="Search city, address, or landmark..."
              className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {isSearchingStart && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute right-3 top-3" />}
          </div>

          {/* Start Suggestions Dropdown */}
          {startSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-navy-900 border border-slate-700 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
              {startSuggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSetStartLocation({ label: item.label, coordinates: item.coordinates });
                    setStartQuery(item.label);
                    setStartSuggestions([]);
                  }}
                  className="px-3.5 py-2.5 hover:bg-slate-800 cursor-pointer border-b border-slate-800/60 last:border-0 transition-colors"
                >
                  <p className="text-xs font-semibold text-white truncate">{item.label}</p>
                  <p className="text-[10px] text-slate-400">
                    {[item.locality, item.region, item.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-center -my-1 relative z-10">
          <button
            onClick={onSwapLocations}
            title="Swap Starting Location and Destination"
            className="p-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-md cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination Input */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Destination
            </span>
            <button
              onClick={() => onToggleSelectionMode('dest')}
              className={`text-[11px] px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                selectionMode === 'dest'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white bg-slate-800/80'
              }`}
            >
              <MousePointerClick className="w-3 h-3" />
              {selectionMode === 'dest' ? 'Click Map Now' : 'Pick on Map'}
            </button>
          </label>

          <div className="relative">
            <input
              type="text"
              value={destQuery}
              onChange={(e) => handleDestQueryChange(e.target.value)}
              placeholder="Search destination address..."
              className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {isSearchingDest && <Loader2 className="w-4 h-4 text-rose-400 animate-spin absolute right-3 top-3" />}
          </div>

          {/* Dest Suggestions Dropdown */}
          {destSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-navy-900 border border-slate-700 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
              {destSuggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSetDestLocation({ label: item.label, coordinates: item.coordinates });
                    setDestQuery(item.label);
                    setDestSuggestions([]);
                  }}
                  className="px-3.5 py-2.5 hover:bg-slate-800 cursor-pointer border-b border-slate-800/60 last:border-0 transition-colors"
                >
                  <p className="text-xs font-semibold text-white truncate">{item.label}</p>
                  <p className="text-[10px] text-slate-400">
                    {[item.locality, item.region, item.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preset Routes quick selector */}
      <div className="pt-1">
        <span className="text-[11px] font-mono text-slate-400 block mb-1.5">Quick Demo Route Presets:</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_ROUTES.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1.5 rounded-lg text-left text-xs bg-slate-900/70 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white transition-all truncate cursor-pointer"
            >
              <span className="flex items-center gap-1 font-medium truncate">
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Find Route Button */}
      <button
        onClick={onFindRoute}
        disabled={isLoadingRoute || !startLocation || !destLocation}
        className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer ${
          isLoadingRoute || !startLocation || !destLocation
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0'
        }`}
      >
        {isLoadingRoute ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Calculating Real ORS Route...</span>
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4 fill-white text-white" />
            <span>Find & Load Route</span>
          </>
        )}
      </button>
    </div>
  );
});

