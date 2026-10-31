import { LocationPoint } from '../types/navigation';

export interface HealthResponse {
  status: string;
  service: string;
  orsConnected: boolean;
  timestamp: string;
}

export interface GeocodeItem {
  id: string;
  label: string;
  name?: string;
  country?: string;
  region?: string;
  locality?: string;
  coordinates: [number, number]; // [lon, lat]
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error(`Health check failed with status: ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      status: 'error',
      service: 'NAVIBAND ORS Proxy',
      orsConnected: false,
      timestamp: new Date().toISOString()
    };
  }
}

export async function searchPlaces(query: string, size = 5): Promise<GeocodeItem[]> {
  if (!query || query.trim().length === 0) return [];

  const res = await fetch(`/api/geocoding/search?text=${encodeURIComponent(query.trim())}&size=${size}`);
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to search locations');
  }

  return data.features || [];
}

export async function reverseGeocode(lon: number, lat: number): Promise<string> {
  try {
    const res = await fetch(`/api/geocoding/reverse?lon=${lon}&lat=${lat}`);
    const data = await res.json();
    if (res.ok && data.success && data.label) {
      return data.label;
    }
  } catch (_) {
    // fallback
  }
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export async function fetchRouteDirections(
  coordinates: [number, number][],
  profile = 'driving-car'
): Promise<any> {
  const res = await fetch('/api/directions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      coordinates,
      profile
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Routing service failed (${res.status})`);
  }

  return data;
}

