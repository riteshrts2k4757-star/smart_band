import React, { 
  useEffect, 
  useRef, 
  useState, 
  useCallback, 
  useImperativeHandle, 
  forwardRef, 
  memo 
} from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Crosshair, Maximize2, MapPin, Compass } from 'lucide-react';
import { LocationPoint, ParsedRoute, ParsedManeuver, WarningStage } from '../types/navigation';

export interface MapViewHandle {
  updateCarPosition: (lon: number, lat: number, bearing: number) => void;
  recenterOnCar: () => void;
  fitRouteBounds: () => void;
}

interface MapViewProps {
  route: ParsedRoute | null;
  startLocation: LocationPoint | null;
  destLocation: LocationPoint | null;
  upcomingManeuver?: ParsedManeuver | null;
  warningStage?: WarningStage;
  autoFollow: boolean;
  onToggleAutoFollow: () => void;
  selectionMode: 'start' | 'dest' | null;
  onMapClick: (coords: [number, number]) => void;
  initialCenter?: [number, number]; // [lat, lon]
}

// Configurable lightweight OpenStreetMap tile layers (100% free, zero API key required, zero watermark)
const TILE_PROVIDERS = [
  {
    name: 'OpenStreetMap Dark (Night Nav)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    className: 'map-dark-tiles',
    maxZoom: 19
  },
  {
    name: 'OpenStreetMap Standard (Light)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    className: '',
    maxZoom: 19
  },
  {
    name: 'OpenStreetMap Humanitarian (HOT)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles &copy; <a href="https://www.hotosm.org/">HOT</a>',
    subdomains: 'abc',
    className: '',
    maxZoom: 19
  },
  {
    name: 'OpenStreetMap Muted Dark',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    className: 'map-muted-dark-tiles',
    maxZoom: 19
  }
];

// Inner Controller component that has access to the Leaflet map instance
const LeafletController: React.FC<{
  route: ParsedRoute | null;
  startLocation: LocationPoint | null;
  destLocation: LocationPoint | null;
  upcomingManeuver?: ParsedManeuver | null;
  warningStage?: WarningStage;
  autoFollow: boolean;
  selectionMode: 'start' | 'dest' | null;
  onMapClick: (coords: [number, number]) => void;
  imperativeRef: React.Ref<MapViewHandle>;
}> = ({
  route,
  startLocation,
  destLocation,
  upcomingManeuver,
  warningStage,
  autoFollow,
  selectionMode,
  onMapClick,
  imperativeRef
}) => {
  const map = useMap();

  const carMarkerRef = useRef<L.Marker | null>(null);
  const carElementRef = useRef<HTMLDivElement | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeOutlineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const maneuverMarkerRef = useRef<L.CircleMarker | null>(null);

  const lastPanTimeRef = useRef<number>(0);
  const currentCarLatLngRef = useRef<L.LatLng | null>(null);

  // Map click handler for picking start or destination
  useMapEvents({
    click(e) {
      if (selectionMode) {
        onMapClick([e.latlng.lng, e.latlng.lat]);
      }
    }
  });

  // Expose imperative methods for high-frequency 60 FPS car movement
  useImperativeHandle(imperativeRef, () => ({
    updateCarPosition(lon: number, lat: number, bearing: number) {
      const latlng = L.latLng(lat, lon);
      currentCarLatLngRef.current = latlng;

      if (!carMarkerRef.current) {
        // Create lightweight 2D SVG directional vehicle icon
        const iconDiv = document.createElement('div');
        iconDiv.className = 'vehicle-marker-container';
        iconDiv.style.width = '36px';
        iconDiv.style.height = '36px';
        iconDiv.style.display = 'flex';
        iconDiv.style.alignItems = 'center';
        iconDiv.style.justifyContent = 'center';
        iconDiv.style.transform = `rotate(${bearing}deg)`;

        iconDiv.innerHTML = `
          <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.6));">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#06b6d4" fill-opacity="0.25" stroke="#22d3ee" stroke-width="2"/>
              <path d="M16 4L25 25L16 20L7 25L16 4Z" fill="#10b981" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
          </div>
        `;

        carElementRef.current = iconDiv;

        const customIcon = L.divIcon({
          html: iconDiv,
          className: 'leaflet-vehicle-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        carMarkerRef.current = L.marker(latlng, {
          icon: customIcon,
          zIndexOffset: 1000
        }).addTo(map);
      } else {
        // Direct marker coordinate update
        carMarkerRef.current.setLatLng(latlng);

        // Direct DOM rotation update (GPU accelerated, 0ms React re-renders)
        if (carElementRef.current) {
          carElementRef.current.style.transform = `rotate(${bearing}deg)`;
        }
      }

      // Smooth throttled auto-follow
      if (autoFollow) {
        const now = performance.now();
        if (now - lastPanTimeRef.current > 750) {
          const mapCenter = map.getCenter();
          if (map.distance(latlng, mapCenter) > 25) {
            map.panTo(latlng, { animate: true, duration: 0.5 });
            lastPanTimeRef.current = now;
          }
        }
      }
    },

    recenterOnCar() {
      if (currentCarLatLngRef.current) {
        map.setView(currentCarLatLngRef.current, Math.max(map.getZoom(), 15), { animate: true });
      } else if (startLocation) {
        map.setView([startLocation.coordinates[1], startLocation.coordinates[0]], 15, { animate: true });
      }
    },

    fitRouteBounds() {
      if (routePolylineRef.current) {
        map.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50], maxZoom: 16 });
      }
    }
  }), [map, autoFollow, startLocation]);

  // Handle Route Polyline rendering (drawn once when route changes)
  useEffect(() => {
    // Clean old polyline
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (routeOutlineRef.current) {
      map.removeLayer(routeOutlineRef.current);
      routeOutlineRef.current = null;
    }

    if (route && route.coordinates.length > 0) {
      const latlngs: L.LatLngExpression[] = route.coordinates.map(([lon, lat]) => [lat, lon]);

      // Subtle background stroke for high visibility
      const outline = L.polyline(latlngs, {
        color: '#064e3b',
        weight: 8,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Core crisp route polyline
      const line = L.polyline(latlngs, {
        color: '#10b981',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      routeOutlineRef.current = outline;
      routePolylineRef.current = line;

      // Fit bounds cleanly on new route
      map.fitBounds(line.getBounds(), { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, route]);

  // Handle Start & Destination Markers (Static, rendered once per location change)
  useEffect(() => {
    // Start marker
    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (startLocation) {
      const [lon, lat] = startLocation.coordinates;
      const startIcon = L.divIcon({
        className: 'start-pin-marker',
        html: `
          <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #10b981; border: 2px solid #ffffff; box-shadow: 0 0 8px rgba(16, 185, 129, 0.8); display: flex; align-items: center; justify-content: center;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      startMarkerRef.current = L.marker([lat, lon], { icon: startIcon })
        .addTo(map)
        .bindPopup(`<b>Start Location:</b><br/>${startLocation.label}`);
    }

    // Destination marker
    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }
    if (destLocation) {
      const [lon, lat] = destLocation.coordinates;
      const destIcon = L.divIcon({
        className: 'dest-pin-marker',
        html: `
          <div style="display: flex; align-items: center; justify-content: center; width: 26px; height: 26px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 8px rgba(239, 68, 68, 0.8); display: flex; align-items: center; justify-content: center;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 24]
      });

      destMarkerRef.current = L.marker([lat, lon], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b><br/>${destLocation.label}`);
    }
  }, [map, startLocation, destLocation]);

  // Handle Upcoming Maneuver Waypoint Highlight on Map (Section 9 Requirement)
  useEffect(() => {
    if (maneuverMarkerRef.current) {
      map.removeLayer(maneuverMarkerRef.current);
      maneuverMarkerRef.current = null;
    }

    if (
      upcomingManeuver &&
      upcomingManeuver.coordinates &&
      upcomingManeuver.coordinates.length === 2 &&
      upcomingManeuver.direction !== 'STRAIGHT' &&
      upcomingManeuver.direction !== 'ARRIVED' &&
      (warningStage === 'EARLY_WARNING' || warningStage === 'IMMEDIATE_WARNING' || warningStage === 'MAINTAIN_TURN')
    ) {
      const [lon, lat] = upcomingManeuver.coordinates;
      const isUrgent = warningStage === 'IMMEDIATE_WARNING' || warningStage === 'MAINTAIN_TURN';

      const circle = L.circleMarker([lat, lon], {
        radius: isUrgent ? 14 : 10,
        color: isUrgent ? '#22d3ee' : '#f59e0b',
        fillColor: isUrgent ? '#06b6d4' : '#fbbf24',
        fillOpacity: 0.55,
        weight: isUrgent ? 3 : 2,
        className: 'maneuver-highlight-marker'
      }).addTo(map);

      circle.bindTooltip(`<b>${upcomingManeuver.instruction}</b>`, {
        permanent: false,
        direction: 'top'
      });

      maneuverMarkerRef.current = circle;
    }
  }, [map, upcomingManeuver, warningStage]);

  // Teardown
  useEffect(() => {
    return () => {
      if (carMarkerRef.current) map.removeLayer(carMarkerRef.current);
      if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
      if (routeOutlineRef.current) map.removeLayer(routeOutlineRef.current);
      if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
      if (destMarkerRef.current) map.removeLayer(destMarkerRef.current);
      if (maneuverMarkerRef.current) map.removeLayer(maneuverMarkerRef.current);
    };
  }, [map]);

  return null;
};

// Main MapView Component (Memoized for zero redundant re-renders)
export const MapView = memo(forwardRef<MapViewHandle, MapViewProps>(({
  route,
  startLocation,
  destLocation,
  upcomingManeuver,
  warningStage,
  autoFollow,
  onToggleAutoFollow,
  selectionMode,
  onMapClick,
  initialCenter = [49.4146, 8.6815], // Heidelberg default
}, ref) => {
  const [activeTileIndex, setActiveTileIndex] = useState(0);
  const [showTileSelector, setShowTileSelector] = useState(false);

  const activeProvider = TILE_PROVIDERS[activeTileIndex];

  // Helper buttons
  const handleRecenter = () => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.recenterOnCar();
    }
  };

  const handleFitRoute = () => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.fitRouteBounds();
    }
  };

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-navy-950">
      
      {/* Selection Mode Notice Banner */}
      {selectionMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-500/60 shadow-xl backdrop-blur-md flex items-center space-x-2 text-cyan-200 text-xs sm:text-sm font-medium animate-bounce pointer-events-none">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span>Click anywhere on the map to set <b>{selectionMode === 'start' ? 'Starting Point' : 'Destination'}</b></span>
        </div>
      )}

      {/* React-Leaflet 2D Map Container */}
      <MapContainer
        center={initialCenter}
        zoom={14}
        zoomControl={false}
        attributionControl={true}
        preferCanvas={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          key={activeProvider.name}
          url={activeProvider.url}
          attribution={activeProvider.attribution}
          subdomains={activeProvider.subdomains}
          maxZoom={activeProvider.maxZoom}
          className={activeProvider.className}
        />

        {/* Inner Controller handles all high-frequency updates directly on Leaflet */}
        <LeafletController
          route={route}
          startLocation={startLocation}
          destLocation={destLocation}
          upcomingManeuver={upcomingManeuver}
          warningStage={warningStage}
          autoFollow={autoFollow}
          selectionMode={selectionMode}
          onMapClick={onMapClick}
          imperativeRef={ref}
        />
      </MapContainer>

      {/* Lightweight Map Controls (Top Left) */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col space-y-2">
        {/* Fit Route */}
        {route && (
          <button
            onClick={handleFitRoute}
            title="Fit Full Route"
            className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:bg-slate-800/90 transition-all shadow-lg border border-slate-700/80 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {/* Recenter */}
        <button
          onClick={handleRecenter}
          title="Recenter on Vehicle / Start"
          className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:bg-slate-800/90 transition-all shadow-lg border border-slate-700/80 cursor-pointer"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Auto Follow Toggle */}
        <button
          onClick={onToggleAutoFollow}
          title={autoFollow ? 'Disable Auto Follow' : 'Enable Auto Follow'}
          className={`p-2.5 rounded-xl transition-all shadow-lg border cursor-pointer ${
            autoFollow
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30'
              : 'glass-panel text-slate-400 hover:text-white hover:bg-slate-800/90 border-slate-700/80'
          }`}
        >
          <Compass className={`w-4 h-4 ${autoFollow ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </button>

        {/* Tile Layers Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTileSelector(!showTileSelector)}
            title="Map Style"
            className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:bg-slate-800/90 transition-all shadow-lg border border-slate-700/80 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
          </button>

          {showTileSelector && (
            <div className="absolute left-0 mt-2 w-44 rounded-xl glass-panel bg-navy-900/95 border border-slate-700 p-1.5 shadow-2xl z-50">
              <span className="text-[10px] font-mono uppercase text-slate-400 px-2 py-1 block">Map Tile Layer</span>
              {TILE_PROVIDERS.map((provider, idx) => (
                <button
                  key={provider.name}
                  onClick={() => {
                    setActiveTileIndex(idx);
                    setShowTileSelector(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTileIndex === idx
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[400] hidden sm:flex items-center space-x-3 px-3 py-1.5 rounded-xl glass-panel text-[11px] font-mono text-slate-300 border border-slate-800 pointer-events-none">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-1 bg-emerald-400 rounded-full" />
          <span>ORS 2D Route</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>Simulated Car</span>
        </div>
      </div>
    </div>
  );
}));
