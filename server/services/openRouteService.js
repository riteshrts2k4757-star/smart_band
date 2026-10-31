import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ORS_BASE_URL = 'https://api.heigit.org';

/**
 * Safely retrieve the OpenRouteService API key without logging or exposing it
 */
export function getOrsApiKey() {
  const rawKey = process.env.OPEN_ROUTE_SERVICES || process.env.ORS_API_KEY || process.env.OPENROUTESERVICE_API_KEY || '';
  // Clean surrounding quotes or whitespace if present
  return rawKey.trim().replace(/^['"]|['"]$/g, '');
}

/**
 * Geocode an address/place using ORS Pelias search
 * @param {string} text - Search query
 * @param {number} size - Max results
 */
export async function geocodeSearch(text, size = 5) {
  const apiKey = getOrsApiKey();
  if (!apiKey) {
    throw new Error('OpenRouteService API key is missing in .env (OPEN_ROUTE_SERVICES)');
  }

  const url = `${ORS_BASE_URL}/pelias/v1/search?text=${encodeURIComponent(text)}&size=${size}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': apiKey,
      'Accept': 'application/json, application/geo+json'
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedMsg = response.statusText;
    try {
      const parsed = JSON.parse(errorBody);
      parsedMsg = parsed.error || parsed.message || parsedMsg;
    } catch (_) {
      parsedMsg = errorBody || parsedMsg;
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(`OpenRouteService authentication error (${response.status}): please verify your API key.`);
    } else if (response.status === 429) {
      throw new Error('OpenRouteService rate limit exceeded. Please wait a moment before trying again.');
    } else {
      throw new Error(`Geocoding error (${response.status}): ${parsedMsg}`);
    }
  }

  const data = await response.json();
  return data;
}

/**
 * Reverse geocode coordinates [longitude, latitude] to human readable address
 * @param {number} lon 
 * @param {number} lat 
 */
export async function reverseGeocode(lon, lat) {
  const apiKey = getOrsApiKey();
  if (!apiKey) {
    throw new Error('OpenRouteService API key is missing in .env');
  }

  const url = `${ORS_BASE_URL}/pelias/v1/reverse?point.lon=${lon}&point.lat=${lat}&size=1`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': apiKey,
      'Accept': 'application/json, application/geo+json'
    }
  });

  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data?.features?.[0]?.properties?.label || null;
}

/**
 * Get driving directions between coordinates using ORS Directions GeoJSON endpoint
 * @param {Array<[number, number]>} coordinates - Array of [lon, lat] pairs
 * @param {string} profile - Routing profile ('driving-car')
 */
export async function getDirections(coordinates, profile = 'driving-car') {
  const apiKey = getOrsApiKey();
  if (!apiKey) {
    throw new Error('OpenRouteService API key is missing in .env (OPEN_ROUTE_SERVICES)');
  }

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error('At least two coordinate pairs [[lon1, lat1], [lon2, lat2]] are required');
  }

  // Validate coordinates format
  for (const pt of coordinates) {
    if (!Array.isArray(pt) || pt.length !== 2 || typeof pt[0] !== 'number' || typeof pt[1] !== 'number') {
      throw new Error('Coordinates must be arrays of numbers [longitude, latitude]');
    }
  }

  const url = `${ORS_BASE_URL}/openrouteservice/v2/directions/${profile}/geojson`;

  const requestBody = {
    coordinates,
    instructions: true,
    maneuvers: true
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json, application/geo+json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedMsg = response.statusText;
    try {
      const parsed = JSON.parse(errorBody);
      parsedMsg = parsed?.error?.message || parsed?.message || parsedMsg;
    } catch (_) {
      parsedMsg = errorBody || parsedMsg;
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(`OpenRouteService authentication error (${response.status}): invalid or unauthorized API key.`);
    } else if (response.status === 404 || response.status === 400) {
      throw new Error(`Route calculation unavailable: ${parsedMsg || 'No suitable road route found between these points.'}`);
    } else if (response.status === 429) {
      throw new Error('OpenRouteService quota or rate limit exceeded. Please try again in a few moments.');
    } else {
      throw new Error(`OpenRouteService routing error (${response.status}): ${parsedMsg}`);
    }
  }

  const data = await response.json();
  return data;
}

