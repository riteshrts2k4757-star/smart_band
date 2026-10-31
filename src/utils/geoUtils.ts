/**
 * Geodesic and navigation mathematics utilities
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians
 */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Calculate great circle distance between two points in meters using Haversine formula
 * @param coord1 [lon, lat]
 * @param coord2 [lon, lat]
 */
export function calculateDistanceMeters(coord1: [number, number], coord2: [number, number]): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate forward azimuth / bearing between two points in degrees (0° - 360°, 0° = North)
 * @param coord1 [lon, lat]
 * @param coord2 [lon, lat]
 */
export function calculateBearing(coord1: [number, number], coord2: [number, number]): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lon2 - lon1);

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
}

/**
 * Normalize angle difference to [-180, 180] degrees
 * Positive = turn right (clockwise)
 * Negative = turn left (counter-clockwise)
 */
export function normalizeBearingDifference(bearingBefore: number, bearingAfter: number): number {
  let diff = (bearingAfter - bearingBefore + 360) % 360;
  if (diff > 180) {
    diff -= 360;
  }
  return diff;
}

/**
 * Compute cumulative distances along a route coordinate array
 */
export function computeCumulativeDistances(coordinates: [number, number][]): number[] {
  const distances: number[] = [0];
  let accumulated = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const dist = calculateDistanceMeters(coordinates[i - 1], coordinates[i]);
    accumulated += dist;
    distances.push(accumulated);
  }

  return distances;
}

export interface InterpolatedPoint {
  coordinates: [number, number]; // [lon, lat]
  bearing: number; // degrees
  segmentIndex: number;
}

/**
 * Get interpolated position and heading along the route at a given travelled distance
 */
export function getPositionAtDistance(
  coordinates: [number, number][],
  cumulativeDistances: number[],
  targetDistance: number
): InterpolatedPoint {
  if (coordinates.length === 0) {
    return { coordinates: [0, 0], bearing: 0, segmentIndex: 0 };
  }

  const totalLength = cumulativeDistances[cumulativeDistances.length - 1];

  // Clamp target distance
  if (targetDistance <= 0) {
    const bearing = coordinates.length > 1 ? calculateBearing(coordinates[0], coordinates[1]) : 0;
    return { coordinates: coordinates[0], bearing, segmentIndex: 0 };
  }

  if (targetDistance >= totalLength) {
    const lastIdx = coordinates.length - 1;
    const bearing = coordinates.length > 1 ? calculateBearing(coordinates[lastIdx - 1], coordinates[lastIdx]) : 0;
    return { coordinates: coordinates[lastIdx], bearing, segmentIndex: lastIdx - 1 };
  }

  // Binary search to find segment
  let low = 0;
  let high = cumulativeDistances.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (cumulativeDistances[mid] <= targetDistance) {
      if (mid === cumulativeDistances.length - 1 || cumulativeDistances[mid + 1] > targetDistance) {
        low = mid;
        break;
      }
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const i = low;
  const startDist = cumulativeDistances[i];
  const endDist = cumulativeDistances[i + 1];
  const segmentLength = endDist - startDist;

  const fraction = segmentLength > 0 ? (targetDistance - startDist) / segmentLength : 0;

  const [lon1, lat1] = coordinates[i];
  const [lon2, lat2] = coordinates[i + 1];

  const interpLon = lon1 + fraction * (lon2 - lon1);
  const interpLat = lat1 + fraction * (lat2 - lat1);

  let bearing = calculateBearing(coordinates[i], coordinates[i + 1]);

  // Smooth heading blend as vehicle approaches curve vertices
  if (fraction > 0.75 && i < coordinates.length - 2) {
    const nextBearing = calculateBearing(coordinates[i + 1], coordinates[i + 2]);
    const diff = normalizeBearingDifference(bearing, nextBearing);
    const blend = (fraction - 0.75) / 0.25;
    bearing = (bearing + diff * blend + 360) % 360;
  }

  return {
    coordinates: [interpLon, interpLat],
    bearing: Math.round(bearing * 10) / 10,
    segmentIndex: i
  };
}

/**
 * Format meters into readable display string
 */
export function formatDistance(meters: number): string {
  if (meters < 0) meters = 0;
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format seconds into readable duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) {
    return `${Math.max(1, totalMinutes)} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} h ${minutes} m` : `${hours} h`;
}

