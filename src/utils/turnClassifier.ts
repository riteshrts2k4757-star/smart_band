import {
  OrsStep,
  ParsedManeuver,
  TurnDirection,
  PulseCount,
  ParsedRoute
} from '../types/navigation';
import {
  normalizeBearingDifference,
  calculateBearing,
  computeCumulativeDistances
} from './geoUtils';

const TOLERANCE_90_DEG = 5.0; // 85° - 95° considered exactly 90°

/**
 * Determine pulse count based on turning angle and maneuver type
 * EXACT rules:
 * - U-turn / hairpin: 4 pulses (priority over all other angle categories)
 * - Greater than 90° (wide / slight turn): 1 pulse
 * - Exactly 90° (within 85° - 95° tolerance): 2 pulses
 * - Less than 90° (acute / sharp turn): 3 pulses
 */
export function classifyPulses(angle: number, isUTurn: boolean): PulseCount {
  if (isUTurn) {
    return 4;
  }

  // Exactly 90° (with tolerance for floating point calculations)
  if (Math.abs(angle - 90) <= TOLERANCE_90_DEG) {
    return 2;
  }

  // Greater than 90° (wide angle, slight turn)
  if (angle > 90 + TOLERANCE_90_DEG) {
    return 1;
  }

  // Less than 90° (sharp turn)
  return 3;
}

/**
 * Parse a raw ORS step into a structured ParsedManeuver
 */
export function parseOrsStep(
  step: OrsStep,
  index: number,
  coordinates: [number, number][],
  cumulativeDistances: number[]
): ParsedManeuver {
  const waypointIdx = Math.min(step.way_points[0], coordinates.length - 1);
  const stepCoord = coordinates[waypointIdx] || [0, 0];
  const distanceFromStart = cumulativeDistances[waypointIdx] || 0;

  const instructionLower = (step.instruction || '').toLowerCase();

  // Check for U-turn from ORS step type (9) or instruction text
  let isUTurn = step.type === 9 || instructionLower.includes('u-turn') || instructionLower.includes('hairpin');

  let signedAngle = 0;
  if (step.maneuver && typeof step.maneuver.bearing_before === 'number' && typeof step.maneuver.bearing_after === 'number') {
    signedAngle = normalizeBearingDifference(step.maneuver.bearing_before, step.maneuver.bearing_after);
  } else if (waypointIdx > 0 && waypointIdx < coordinates.length - 1) {
    // Fallback: calculate bearing from adjacent coordinates
    const bBefore = calculateBearing(coordinates[waypointIdx - 1], coordinates[waypointIdx]);
    const bAfter = calculateBearing(coordinates[waypointIdx], coordinates[waypointIdx + 1]);
    signedAngle = normalizeBearingDifference(bBefore, bAfter);
  }

  const absDeflection = Math.abs(signedAngle);
  if (absDeflection >= 165) {
    isUTurn = true;
  }

  // Determine direction with strict ORS step type precedence
  let direction: TurnDirection = 'STRAIGHT';

  if (step.type === 10 || instructionLower.includes('reach') || instructionLower.includes('destination') || instructionLower.includes('arrived')) {
    direction = 'ARRIVED';
  } else if (isUTurn) {
    direction = 'U-TURN';
  } else if ([1, 3, 5, 13].includes(step.type) || (instructionLower.includes('right') && !instructionLower.includes('left'))) {
    // Explicit ORS right types: 1 = Turn right, 3 = Turn sharp right, 5 = Turn slight right, 13 = Keep right
    direction = 'RIGHT';
  } else if ([0, 2, 4, 12].includes(step.type) || (instructionLower.includes('left') && !instructionLower.includes('right'))) {
    // Explicit ORS left types: 0 = Turn left, 2 = Turn sharp left, 4 = Turn slight left, 12 = Keep left
    direction = 'LEFT';
  } else if (signedAngle > 15) {
    direction = 'RIGHT';
  } else if (signedAngle < -15) {
    direction = 'LEFT';
  } else {
    direction = 'STRAIGHT';
  }

  // Guarantee signedAngle sign aligns with determined direction
  if (direction === 'RIGHT' && signedAngle <= 0) {
    signedAngle = absDeflection > 0 ? absDeflection : 90;
  } else if (direction === 'LEFT' && signedAngle >= 0) {
    signedAngle = absDeflection > 0 ? -absDeflection : -90;
  }

  // Calculate road corner angle (where straight = 180°, slight bend > 90°, square = 90°, sharp bend < 90°)
  let cornerAngle = 90;
  if (isUTurn) {
    cornerAngle = 180;
  } else if (step.type === 4 || step.type === 5) {
    // Explicit slight turn: wide angle > 90° => 1 pulse
    cornerAngle = 120;
  } else if (step.type === 2 || step.type === 3) {
    // Explicit sharp turn: acute angle < 90° => 3 pulses
    cornerAngle = 45;
  } else if (step.type === 0 || step.type === 1) {
    // Standard turn: 90° => 2 pulses
    cornerAngle = 90;
  } else if (absDeflection > 0) {
    cornerAngle = 180 - absDeflection;
  }

  const pulseCount = classifyPulses(cornerAngle, isUTurn);

  return {
    id: `maneuver-${index}-${waypointIdx}`,
    index,
    direction,
    instruction: step.instruction || 'Continue straight',
    roadName: step.name || 'Unnamed road',
    distanceFromStart,
    segmentDistance: step.distance,
    angle: Math.round(cornerAngle * 10) / 10,
    signedAngle: Math.round(signedAngle * 10) / 10,
    pulseCount,
    coordinates: stepCoord,
    isUTurn,
    earlyWarningTriggered: false,
    immediateWarningTriggered: false,
    maneuverReached: false,
    maneuverCompleted: false,
    warningStage: 'APPROACHING'
  };
}

/**
 * Parse complete ORS GeoJSON response into our structured ParsedRoute
 */
export function parseOrsRouteResponse(geojsonData: any): ParsedRoute {
  if (!geojsonData || !geojsonData.features || !geojsonData.features[0]) {
    throw new Error('Invalid GeoJSON route response received from OpenRouteService');
  }

  const feature = geojsonData.features[0];
  const coordinates: [number, number][] = feature.geometry.coordinates || [];

  if (coordinates.length === 0) {
    throw new Error('Route geometry contains no coordinates');
  }

  const cumulativeDistances = computeCumulativeDistances(coordinates);
  const segment = feature.properties?.segments?.[0];

  const totalDistanceMeters = segment?.distance ?? cumulativeDistances[cumulativeDistances.length - 1];
  const totalDurationSeconds = segment?.duration ?? 0;

  const rawSteps: OrsStep[] = segment?.steps || [];
  const steps: ParsedManeuver[] = rawSteps.map((step, idx) =>
    parseOrsStep(step, idx, coordinates, cumulativeDistances)
  );

  return {
    coordinates,
    totalDistanceMeters,
    totalDurationSeconds,
    steps,
    cumulativeDistances
  };
}

