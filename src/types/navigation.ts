export type TurnDirection = 'LEFT' | 'RIGHT' | 'STRAIGHT' | 'U-TURN' | 'ARRIVED';

export type PulseCount = 1 | 2 | 3 | 4;

export type WarningStage = 
  | 'NONE'
  | 'APPROACHING' 
  | 'EARLY_WARNING' 
  | 'IMMEDIATE_WARNING' 
  | 'MAINTAIN_TURN' 
  | 'REACHED' 
  | 'COMPLETED';

export interface OrsManeuver {
  location: [number, number]; // [lon, lat]
  bearing_before: number;
  bearing_after: number;
}

export interface OrsStep {
  distance: number; // meters
  duration: number; // seconds
  type: number; // ORS action code
  instruction: string;
  name: string;
  way_points: [number, number]; // [startIndex, endIndex]
  maneuver?: OrsManeuver;
}

export interface ParsedManeuver {
  id: string;
  index: number;
  direction: TurnDirection;
  instruction: string;
  roadName: string;
  distanceFromStart: number; // meters along route
  segmentDistance: number; // meters in this step
  angle: number; // corner angle in degrees (0 - 180)
  signedAngle: number; // signed angle (-180 to 180, negative is left, positive is right)
  pulseCount: PulseCount;
  coordinates: [number, number]; // [lon, lat]
  isUTurn: boolean;
  earlyWarningTriggered?: boolean;
  immediateWarningTriggered?: boolean;
  maneuverReached?: boolean;
  maneuverCompleted?: boolean;
  warningStage?: WarningStage;
}

export interface RouteGeometry {
  coordinates: [number, number][]; // Array of [lon, lat]
}

export interface ParsedRoute {
  coordinates: [number, number][]; // [lon, lat]
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  steps: ParsedManeuver[];
  cumulativeDistances: number[]; // distance from start to coordinate i
}

export interface LocationPoint {
  label: string;
  coordinates: [number, number]; // [lon, lat]
}

export interface LEDState {
  leftRed: boolean;
  leftGreen: boolean;
  rightRed: boolean;
  rightGreen: boolean;
}

export type SimulationStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'ARRIVED' | 'STOPPED' | 'OFF_ROUTE' | 'REROUTING';

export interface LogEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'turn' | 'error' | 'pulse';
  message: string;
  details?: string;
}

export interface SimulationConfig {
  speedKmh: number;
  earlyWarningDistance: number; // e.g. 150m
  mainSignalDistance: number; // e.g. 50m
  ledOnDurationMs: number; // e.g. 250ms
  ledOffDurationMs: number; // e.g. 200ms
  autoFollowMap: boolean;
}

