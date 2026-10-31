import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';

import { MapView, MapViewHandle } from './MapView';
import { LocationSearch } from './LocationSearch';
import { RouteSummary } from './RouteSummary';
import { SimulationControls } from './SimulationControls';
import { WristbandSimulator } from './WristbandSimulator';
import { LEDTestPanel, TestScenario } from './LEDTestPanel';
import { NavigationInstruction } from './NavigationInstruction';
import { SimulationEventLog } from './SimulationEventLog';

import { 
  ParsedRoute, 
  ParsedManeuver, 
  LocationPoint, 
  SimulationStatus, 
  LEDState, 
  LogEvent,
  WarningStage 
} from '../types/navigation';
import { fetchRouteDirections, reverseGeocode } from '../services/api';
import { parseOrsRouteResponse } from '../utils/turnClassifier';
import { getPositionAtDistance, formatDistance } from '../utils/geoUtils';
import { LedScheduler } from '../utils/ledScheduler';

interface ManeuverTrackingState {
  earlyWarningTriggered: boolean;
  immediateWarningTriggered: boolean;
  maneuverReached: boolean;
  maneuverCompleted: boolean;
  warningStage: WarningStage;
}

export const NavigationDashboard: React.FC = () => {
  // Navigation endpoints
  const [startLocation, setStartLocation] = useState<LocationPoint | null>({
    label: 'Heidelberg Castle, Germany',
    coordinates: [8.7153, 49.4106]
  });
  const [destLocation, setDestLocation] = useState<LocationPoint | null>({
    label: 'University of Heidelberg, Germany',
    coordinates: [8.6815, 49.4146]
  });

  // Map state
  const [route, setRoute] = useState<ParsedRoute | null>(null);
  const [autoFollow, setAutoFollow] = useState<boolean>(true);
  const [selectionMode, setSelectionMode] = useState<'start' | 'dest' | null>(null);
  const mapViewRef = useRef<MapViewHandle>(null);

  // Simulation execution state
  const [status, setStatus] = useState<SimulationStatus>('IDLE');
  const [speedKmh, setSpeedKmh] = useState<number>(40);

  // Configurable Warning Distances (Section 8: default 150m early, 50m immediate)
  const [earlyWarningDist, setEarlyWarningDist] = useState<number>(150);
  const [mainSignalDist, setMainSignalDist] = useState<number>(50);

  const earlyWarningDistRef = useRef<number>(150);
  const mainSignalDistRef = useRef<number>(50);

  useEffect(() => {
    earlyWarningDistRef.current = earlyWarningDist;
  }, [earlyWarningDist]);

  useEffect(() => {
    mainSignalDistRef.current = mainSignalDist;
  }, [mainSignalDist]);

  // Handler for early warning distance slider
  const handleEarlyWarningChange = useCallback((newDist: number) => {
    const clamped = Math.max(80, Math.min(300, newDist));
    setEarlyWarningDist(clamped);
    if (mainSignalDistRef.current >= clamped) {
      const adjusted = clamped - 20;
      setMainSignalDist(adjusted);
      mainSignalDistRef.current = adjusted;
    }
  }, []);

  // Handler for immediate warning distance slider
  const handleMainSignalChange = useCallback((newDist: number) => {
    const clamped = Math.max(20, Math.min(earlyWarningDistRef.current - 15, newDist));
    setMainSignalDist(clamped);
  }, []);

  // Throttled UI Telemetry State (Updated ~8-10 times/sec, decoupled from 60fps RAF loop)
  const [telemetry, setTelemetry] = useState<{
    progressMeters: number;
    activeStepIndex: number;
    distanceToNextTurn: number;
    warningStage: WarningStage;
    demoScenario: TestScenario | null;
  }>({
    progressMeters: 0,
    activeStepIndex: 0,
    distanceToNextTurn: 0,
    warningStage: 'APPROACHING',
    demoScenario: null,
  });

  // LED Timing (configurable)
  const [ledOnDurationMs, setLedOnDurationMs] = useState<number>(250);
  const [ledOffDurationMs, setLedOffDurationMs] = useState<number>(200);

  // LED and hardware state
  const [ledState, setLedState] = useState<LEDState>({
    leftRed: false,
    leftGreen: false,
    rightRed: false,
    rightGreen: false,
  });
  const [manualOverrideActive, setManualOverrideActive] = useState<boolean>(false);
  const manualOverrideRef = useRef<boolean>(false);
  const manualTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Logs & UI feedback
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  // Maneuver tracking state: separate flags per maneuver (Section 6)
  const trackingStatesRef = useRef<{ [stepId: string]: ManeuverTrackingState }>({});

  // High-frequency animation refs
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);
  const lastTelemetryTimeRef = useRef<number>(0);
  const currentPosRef = useRef<[number, number]>([8.7153, 49.4106]);

  // Keep refs synchronized with active states
  const routeRef = useRef<ParsedRoute | null>(null);
  const statusRef = useRef<SimulationStatus>('IDLE');
  const speedRef = useRef<number>(40);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    speedRef.current = speedKmh;
  }, [speedKmh]);

  // Append a live log event
  const addLog = useCallback((type: LogEvent['type'], message: string, details?: string) => {
    const newLog: LogEvent = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  }, []);

  // Initialize LED Scheduler
  const ledSchedulerRef = useRef<LedScheduler | null>(null);
  useEffect(() => {
    ledSchedulerRef.current = new LedScheduler(
      (newLedState) => {
        setLedState(newLedState);
      },
      (completedPattern) => {
        addLog('pulse', `LED Pattern Completed: ${completedPattern}`);
      },
      ledOnDurationMs,
      ledOffDurationMs
    );

    return () => {
      ledSchedulerRef.current?.turnOffAll();
    };
  }, [addLog]);

  // Update LED timing
  const handleTimingChange = useCallback((onMs: number, offMs: number) => {
    setLedOnDurationMs(onMs);
    setLedOffDurationMs(offMs);
    ledSchedulerRef.current?.updateTiming(onMs, offMs);
    addLog('info', `LED Timing updated: ${onMs}ms ON, ${offMs}ms OFF gap`);
  }, [addLog]);

  // Find Route using OpenRouteService
  const handleFindRoute = useCallback(async () => {
    if (!startLocation || !destLocation) {
      setRoutingError('Please select both starting point and destination.');
      return;
    }

    setIsLoadingRoute(true);
    setRoutingError(null);

    // Stop active simulation if any
    setStatus('STOPPED');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    ledSchedulerRef.current?.turnOffAll();

    try {
      addLog('info', `Requesting real ORS route from ${startLocation.label} to ${destLocation.label}...`);
      
      const rawGeojson = await fetchRouteDirections([
        startLocation.coordinates,
        destLocation.coordinates
      ]);

      const parsed = parseOrsRouteResponse(rawGeojson);
      setRoute(parsed);
      routeRef.current = parsed;

      // Reset car to beginning
      progressRef.current = 0;
      trackingStatesRef.current = {};

      const firstCoord = parsed.coordinates[0];
      currentPosRef.current = firstCoord;

      let initialBearing = 0;
      if (parsed.coordinates.length > 1) {
        const p = getPositionAtDistance(parsed.coordinates, parsed.cumulativeDistances, 0);
        initialBearing = p.bearing;
      }

      // Update map marker directly without global React re-render
      mapViewRef.current?.updateCarPosition(firstCoord[0], firstCoord[1], initialBearing);

      setTelemetry({
        progressMeters: 0,
        activeStepIndex: 0,
        distanceToNextTurn: parsed.steps[0]?.segmentDistance || 0,
        warningStage: 'APPROACHING',
        demoScenario: null
      });

      setStatus('IDLE');
      addLog(
        'success',
        `Route loaded successfully: ${formatDistance(parsed.totalDistanceMeters)}, ${parsed.steps.length} maneuvers`,
        `Estimated driving time: ${Math.round(parsed.totalDurationSeconds / 60)} min`
      );
    } catch (err: any) {
      console.error('Route calculation failed:', err.message);
      setRoutingError(err.message || 'Failed to calculate driving route. Please check coordinates or network connection.');
      addLog('error', `Routing failed: ${err.message}`);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [startLocation, destLocation, addLog]);

  // Trigger Destination Reached Celebration
  const triggerArrival = useCallback(() => {
    setStatus('ARRIVED');
    ledSchedulerRef.current?.setArrival();
    addLog('success', 'Destination reached! Navigation complete. Both green LEDs steady ON.');

    // Fire celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, [addLog]);

  // Start Simulation
  const handleStartSimulation = useCallback(() => {
    if (!routeRef.current) return;
    setStatus('RUNNING');
    lastTimeRef.current = performance.now();
    addLog('info', 'Simulation started. Vehicle moving along route...');

    if (!ledSchedulerRef.current?.isBusy()) {
      ledSchedulerRef.current?.setStraight();
    }
  }, [addLog]);

  // Pause Simulation (Freezes vehicle and warning progression - Section 7)
  const handlePauseSimulation = useCallback(() => {
    setStatus('PAUSED');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    ledSchedulerRef.current?.turnOffAll();
    addLog('info', `Simulation paused at distance ${formatDistance(progressRef.current)}`);
  }, [addLog]);

  // Resume Simulation (Resumes from exact route position - Section 7)
  const handleResumeSimulation = useCallback(() => {
    if (!routeRef.current) return;
    setStatus('RUNNING');
    lastTimeRef.current = performance.now();
    addLog('info', `Simulation resumed from ${formatDistance(progressRef.current)}`);
    if (!ledSchedulerRef.current?.isBusy() && !ledSchedulerRef.current?.isTurnWarningActive()) {
      ledSchedulerRef.current?.setStraight();
    }
  }, [addLog]);

  // Stop Simulation (Cancels all active warning animations - Section 7)
  const handleStopSimulation = useCallback(() => {
    setStatus('STOPPED');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    ledSchedulerRef.current?.turnOffAll();
    addLog('info', 'Simulation stopped. All LEDs turned OFF.');
  }, [addLog]);

  // Reset Simulation (Clears all warning flags - Section 6 & 7)
  const handleResetSimulation = useCallback(() => {
    handleStopSimulation();
    progressRef.current = 0;
    trackingStatesRef.current = {};

    if (routeRef.current && routeRef.current.coordinates.length > 0) {
      const firstCoord = routeRef.current.coordinates[0];
      currentPosRef.current = firstCoord;
      const { bearing } = getPositionAtDistance(routeRef.current.coordinates, routeRef.current.cumulativeDistances, 0);
      mapViewRef.current?.updateCarPosition(firstCoord[0], firstCoord[1], bearing);
    }

    setTelemetry({
      progressMeters: 0,
      activeStepIndex: 0,
      distanceToNextTurn: routeRef.current?.steps[0]?.segmentDistance || 0,
      warningStage: 'APPROACHING',
      demoScenario: null
    });

    setStatus('IDLE');
    addLog('info', 'Simulation reset to route starting position.');
  }, [handleStopSimulation, addLog]);

  // Simulate Off-Route / Detour
  const handleSimulateOffRoute = useCallback(async () => {
    if (!routeRef.current || !destLocation) return;

    setStatus('OFF_ROUTE');
    addLog('warning', 'Off-Route warning! Vehicle deviated from planned navigation path.');
    
    // Distinctive red warning pattern on LEDs
    ledSchedulerRef.current?.setOffRoute(3);

    // After 1.5 seconds, start dynamic rerouting
    setTimeout(async () => {
      setStatus('REROUTING');
      addLog('info', 'Rerouting: Requesting dynamic recalculation from current GPS position to destination...');

      try {
        const newGeojson = await fetchRouteDirections([
          currentPosRef.current,
          destLocation.coordinates
        ]);

        const newParsed = parseOrsRouteResponse(newGeojson);
        setRoute(newParsed);
        routeRef.current = newParsed;

        progressRef.current = 0;
        trackingStatesRef.current = {};

        setStatus('RUNNING');
        addLog('success', 'Rerouting complete! New route geometry loaded from OpenRouteService. Resuming navigation.');
        ledSchedulerRef.current?.setStraight();
      } catch (err: any) {
        addLog('error', `Rerouting failed: ${err.message}`);
        setStatus('PAUSED');
      }
    }, 1500);
  }, [destLocation, addLog]);

  // Central 60 FPS requestAnimationFrame Simulation Loop with Distance-Based Warning Engine
  useEffect(() => {
    if (status !== 'RUNNING') return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTimeSeconds = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const currentRoute = routeRef.current;
      if (!currentRoute) return;

      // Speed in meters per second (0 km/h stays stationary)
      const currentSpeed = speedRef.current;
      const speedMps = (currentSpeed * 1000) / 3600;
      const deltaDist = speedMps * deltaTimeSeconds;

      let newProgress = progressRef.current + deltaDist;
      const totalDist = currentRoute.totalDistanceMeters;

      // Arrival check at route destination
      if (newProgress >= totalDist - 5) {
        newProgress = totalDist;
        progressRef.current = totalDist;

        const lastPoint = currentRoute.coordinates[currentRoute.coordinates.length - 1];
        currentPosRef.current = lastPoint;
        mapViewRef.current?.updateCarPosition(lastPoint[0], lastPoint[1], 0);

        setTelemetry(prev => ({
          ...prev,
          progressMeters: totalDist,
          distanceToNextTurn: 0,
          warningStage: 'REACHED'
        }));

        triggerArrival();
        return;
      }

      progressRef.current = newProgress;

      // Interpolate current position and heading
      const { coordinates, bearing } = getPositionAtDistance(
        currentRoute.coordinates,
        currentRoute.cumulativeDistances,
        newProgress
      );
      currentPosRef.current = coordinates;

      // ⚡ Direct 60 FPS map marker update without React re-render
      mapViewRef.current?.updateCarPosition(coordinates[0], coordinates[1], bearing);

      // --- DISTANCE-BASED EARLY & IMMEDIATE WARNING ENGINE ---
      const earlyDist = earlyWarningDistRef.current;
      const immediateDist = mainSignalDistRef.current;

      // Find upcoming active maneuver
      let activeStepIdx = -1;
      for (let i = 0; i < currentRoute.steps.length; i++) {
        const step = currentRoute.steps[i];
        const tracking = trackingStatesRef.current[step.id];

        // Skip steps that have completed
        if (tracking?.maneuverCompleted) {
          continue;
        }

        // Active until 8m past the intersection
        if (newProgress < step.distanceFromStart + 8 || i === currentRoute.steps.length - 1) {
          activeStepIdx = i;
          break;
        }
      }

      let distToStep = 0;
      let currentStage: WarningStage = 'APPROACHING';

      if (activeStepIdx !== -1) {
        const step = currentRoute.steps[activeStepIdx];
        distToStep = Math.max(0, step.distanceFromStart - newProgress);

        // Ensure tracking entry exists
        if (!trackingStatesRef.current[step.id]) {
          trackingStatesRef.current[step.id] = {
            earlyWarningTriggered: false,
            immediateWarningTriggered: false,
            maneuverReached: false,
            maneuverCompleted: false,
            warningStage: 'APPROACHING'
          };
        }
        const tracking = trackingStatesRef.current[step.id];

        // 1. Stage 1 — Early Warning (150m default)
        if (distToStep <= earlyDist && distToStep > immediateDist) {
          currentStage = 'EARLY_WARNING';
          tracking.warningStage = 'EARLY_WARNING';

          if (!tracking.earlyWarningTriggered && !manualOverrideRef.current) {
            tracking.earlyWarningTriggered = true;

            if (step.direction === 'LEFT') {
              ledSchedulerRef.current?.triggerEarlyWarning('LEFT', step.pulseCount);
              addLog(
                'turn',
                `[EARLY WARNING 150m] Left turn in ${Math.round(distToStep)}m: ${step.instruction}`,
                `Corner angle: ${step.angle}° | Vibration pulses: ${step.pulseCount}`
              );
            } else if (step.direction === 'RIGHT') {
              ledSchedulerRef.current?.triggerEarlyWarning('RIGHT', step.pulseCount);
              addLog(
                'turn',
                `[EARLY WARNING 150m] Right turn in ${Math.round(distToStep)}m: ${step.instruction}`,
                `Corner angle: ${step.angle}° | Vibration pulses: ${step.pulseCount}`
              );
            } else if (step.direction === 'U-TURN') {
              ledSchedulerRef.current?.triggerUTurn(step.signedAngle < 0 ? 'LEFT' : 'RIGHT', 4);
              addLog(
                'turn',
                `[EARLY WARNING 150m] U-Turn in ${Math.round(distToStep)}m: ${step.instruction}`,
                `Dual Red Flash + Haptic Vibration (4 pulses)`
              );
            }
          }
        }

        // 2. Stage 2 — Immediate Warning (50m default)
        else if (distToStep <= immediateDist && distToStep > 20) {
          currentStage = 'IMMEDIATE_WARNING';
          tracking.warningStage = 'IMMEDIATE_WARNING';

          if (!tracking.immediateWarningTriggered && !manualOverrideRef.current) {
            tracking.immediateWarningTriggered = true;

            if (step.direction === 'LEFT') {
              ledSchedulerRef.current?.triggerImmediateWarning('LEFT', step.pulseCount);
              addLog(
                'pulse',
                `[IMMEDIATE WARNING 50m] TURN LEFT NOW in ${Math.round(distToStep)}m!`,
                step.instruction
              );
            } else if (step.direction === 'RIGHT') {
              ledSchedulerRef.current?.triggerImmediateWarning('RIGHT', step.pulseCount);
              addLog(
                'pulse',
                `[IMMEDIATE WARNING 50m] TURN RIGHT NOW in ${Math.round(distToStep)}m!`,
                step.instruction
              );
            } else if (step.direction === 'U-TURN') {
              ledSchedulerRef.current?.triggerUTurn(step.signedAngle < 0 ? 'LEFT' : 'RIGHT', 4);
              addLog('pulse', `[IMMEDIATE WARNING 50m] MAKE U-TURN NOW in ${Math.round(distToStep)}m!`, step.instruction);
            }
          }
        }

        // 3. Turn Negotiation Zone (20m down to intersection): Maintain directional indication
        else if (distToStep <= 20 && distToStep > 5) {
          currentStage = 'MAINTAIN_TURN';
          tracking.warningStage = 'MAINTAIN_TURN';

          if (!manualOverrideRef.current && !ledSchedulerRef.current?.isBusy()) {
            if (step.direction === 'LEFT' || step.direction === 'RIGHT') {
              ledSchedulerRef.current?.maintainTurnIndication(step.direction);
            }
          }
        }

        // 4. Maneuver Reached (within 5m of intersection)
        else if (distToStep <= 5 && !tracking.maneuverReached) {
          tracking.maneuverReached = true;
          currentStage = 'REACHED';
          tracking.warningStage = 'REACHED';
          addLog('turn', `[MANEUVER REACHED] Reached turn point: ${step.instruction}`);
        }

        // 5. Maneuver Completed (vehicle passed maneuver by 6m)
        if (newProgress >= step.distanceFromStart + 6 && !tracking.maneuverCompleted) {
          tracking.maneuverCompleted = true;
          currentStage = 'COMPLETED';
          tracking.warningStage = 'COMPLETED';
          addLog('info', `[MANEUVER COMPLETED] Completed maneuver: ${step.instruction}`);

          // If next maneuver is > earlyDist away, return to dual green straight mode
          const nextStep = currentRoute.steps[activeStepIdx + 1];
          if (!nextStep || (nextStep.distanceFromStart - newProgress > earlyDist)) {
            if (!manualOverrideRef.current) {
              ledSchedulerRef.current?.setStraight(true);
            }
          }
        }

        // 6. Between turns (> earlyDist away): Keep straight signal active
        if (distToStep > earlyDist && !manualOverrideRef.current && !ledSchedulerRef.current?.isBusy() && !ledSchedulerRef.current?.isTurnWarningActive()) {
          ledSchedulerRef.current?.setStraight();
          currentStage = 'APPROACHING';
        }
      } else {
        if (!manualOverrideRef.current && !ledSchedulerRef.current?.isBusy() && !ledSchedulerRef.current?.isTurnWarningActive()) {
          ledSchedulerRef.current?.setStraight();
        }
      }

      // ⏱ Throttled Telemetry Updates to React (~8 times/sec): Keeps dashboard snappy without 60fps React re-renders!
      if (timestamp - lastTelemetryTimeRef.current > 120) {
        lastTelemetryTimeRef.current = timestamp;
        setTelemetry(prev => ({
          ...prev,
          progressMeters: newProgress,
          activeStepIndex: activeStepIdx !== -1 ? activeStepIdx : prev.activeStepIndex,
          distanceToNextTurn: distToStep,
          warningStage: currentStage,
        }));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [status, triggerArrival, addLog]);

  // Handle Manual LED Tests (Section 5: Preserves active route progress & isolates hardware test)
  const executeManualTest = useCallback((action: () => void, testLabel: string) => {
    if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
    manualOverrideRef.current = true;
    setManualOverrideActive(true);
    addLog('pulse', `Manual Test: ${testLabel}`);

    action();

    // Revert manual override state after pattern completes
    manualTimeoutRef.current = setTimeout(() => {
      manualOverrideRef.current = false;
      setManualOverrideActive(false);
      setTelemetry(prev => ({ ...prev, demoScenario: null }));
      if (statusRef.current === 'RUNNING') {
        if (!ledSchedulerRef.current?.isTurnWarningActive()) {
          ledSchedulerRef.current?.setStraight(true);
        }
      } else {
        ledSchedulerRef.current?.turnOffAll();
      }
    }, 2800);
  }, [addLog]);

  const handleTestLeftTurn = useCallback((pulses: 1 | 2 | 3) => {
    executeManualTest(
      () => ledSchedulerRef.current?.triggerTurn('LEFT', pulses, `MANUAL_LEFT_${pulses}`),
      `Left Turn — ${pulses} Pulse(s)`
    );
  }, [executeManualTest]);

  const handleTestRightTurn = useCallback((pulses: 1 | 2 | 3) => {
    executeManualTest(
      () => ledSchedulerRef.current?.triggerTurn('RIGHT', pulses, `MANUAL_RIGHT_${pulses}`),
      `Right Turn — ${pulses} Pulse(s)`
    );
  }, [executeManualTest]);

  const handleTestStraight = useCallback(() => {
    executeManualTest(
      () => ledSchedulerRef.current?.setStraight(true),
      'Straight — Both Green LEDs ON'
    );
  }, [executeManualTest]);

  const handleTestUTurn = useCallback(() => {
    executeManualTest(
      () => ledSchedulerRef.current?.triggerUTurn('LEFT', 4, 'MANUAL_UTURN'),
      'U-Turn — 4 Pulses (Dual Red Flash + Green Indicator)'
    );
  }, [executeManualTest]);

  const handleTestArrival = useCallback(() => {
    executeManualTest(
      () => {
        ledSchedulerRef.current?.setArrival();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      },
      'Arrival — Both Green LEDs ON'
    );
  }, [executeManualTest]);

  const handleTestStopAll = useCallback(() => {
    executeManualTest(
      () => ledSchedulerRef.current?.turnOffAll(),
      'Stop — All LEDs OFF'
    );
  }, [executeManualTest]);

  // Handle Preset Test Scenario Selection
  const handleSelectScenario = useCallback((scenario: TestScenario) => {
    setTelemetry(prev => ({
      ...prev,
      demoScenario: scenario
    }));

    executeManualTest(() => {
      if (scenario.direction === 'LEFT') {
        ledSchedulerRef.current?.triggerTurn('LEFT', scenario.pulseCount, `SCENARIO_${scenario.id}`);
      } else if (scenario.direction === 'RIGHT') {
        ledSchedulerRef.current?.triggerTurn('RIGHT', scenario.pulseCount, `SCENARIO_${scenario.id}`);
      } else if (scenario.direction === 'U-TURN') {
        ledSchedulerRef.current?.triggerUTurn('LEFT', 4, `SCENARIO_${scenario.id}`);
      } else if (scenario.direction === 'ARRIVED') {
        ledSchedulerRef.current?.setArrival();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } else {
        ledSchedulerRef.current?.setStraight(true);
      }
    }, `Scenario "${scenario.name}" — ${scenario.description}`);
  }, [executeManualTest]);

  // Map Click handler (for picking start or destination)
  const handleMapClick = useCallback(async (coords: [number, number]) => {
    if (!selectionMode) return;

    try {
      const address = await reverseGeocode(coords[0], coords[1]);
      const point: LocationPoint = {
        label: address,
        coordinates: coords,
      };

      if (selectionMode === 'start') {
        setStartLocation(point);
        addLog('info', `Start location set from map: ${address}`);
      } else {
        setDestLocation(point);
        addLog('info', `Destination set from map: ${address}`);
      }
    } catch (_) {
      // fallback
    } finally {
      setSelectionMode(null);
    }
  }, [selectionMode, addLog]);

  // Swap start and dest
  const handleSwapLocations = useCallback(() => {
    setStartLocation(prevStart => {
      setDestLocation(prevStart);
      return destLocation;
    });
    addLog('info', 'Swapped Starting Location and Destination');
  }, [destLocation, addLog]);

  // Active maneuver and instruction resolution
  const activeManeuver = useMemo(() => {
    if (telemetry.demoScenario) {
      return {
        id: `scenario-${telemetry.demoScenario.id}`,
        index: 0,
        direction: telemetry.demoScenario.direction,
        instruction: telemetry.demoScenario.instruction,
        roadName: 'Demo Roadway',
        distanceFromStart: 0,
        segmentDistance: 150,
        angle: telemetry.demoScenario.angle,
        signedAngle: telemetry.demoScenario.direction === 'LEFT' ? -telemetry.demoScenario.angle : telemetry.demoScenario.angle,
        pulseCount: telemetry.demoScenario.pulseCount,
        coordinates: [0, 0] as [number, number],
        isUTurn: telemetry.demoScenario.direction === 'U-TURN',
        warningStage: 'IMMEDIATE_WARNING' as WarningStage
      };
    }
    return route?.steps[telemetry.activeStepIndex] || null;
  }, [telemetry.demoScenario, route, telemetry.activeStepIndex]);

  const remainingDistance = useMemo(() => {
    return route ? Math.max(0, route.totalDistanceMeters - telemetry.progressMeters) : 0;
  }, [route, telemetry.progressMeters]);

  const speedMps = (speedKmh * 1000) / 3600;
  const simulatedEtaSeconds = speedMps > 0 ? remainingDistance / speedMps : 0;

  return (
    <section id="simulator" className="py-8 border-b border-slate-800/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                GPS Navigation & Haptic Wristband Simulator
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Lightweight 2D Leaflet map with zero-overhead vehicle animation, 150m early warnings & 50m immediate alerts
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              Steps: <strong className="text-emerald-400">{route?.steps.length || 0}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              State: <strong className="text-cyan-400">{status}</strong>
            </span>
          </div>
        </div>

        {/* Primary Prominent Navigation HUD Banner */}
        <NavigationInstruction
          status={status}
          currentManeuver={activeManeuver}
          distanceToNextTurn={telemetry.demoScenario ? 150 : telemetry.distanceToNextTurn}
          warningStage={telemetry.demoScenario ? 'IMMEDIATE_WARNING' : telemetry.warningStage}
          earlyWarningDist={earlyWarningDist}
          mainSignalDist={mainSignalDist}
          currentSpeedKmh={speedKmh}
          distanceTravelledMeters={telemetry.progressMeters}
          remainingDistanceMeters={remainingDistance}
          simulatedEtaSeconds={simulatedEtaSeconds}
          startLabel={startLocation?.label || ''}
          destLabel={destLocation?.label || ''}
        />

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT AREA: Map View + Route Planner (Below Map) + Route Summary + Event Log (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 2D Leaflet Map (Optimized, Stable Instance) */}
            <MapView
              ref={mapViewRef}
              route={route}
              startLocation={startLocation}
              destLocation={destLocation}
              upcomingManeuver={activeManeuver}
              warningStage={telemetry.warningStage}
              autoFollow={autoFollow}
              onToggleAutoFollow={() => setAutoFollow(!autoFollow)}
              selectionMode={selectionMode}
              onMapClick={handleMapClick}
            />

            {/* Route Planner Box (Shifted Below the Map) */}
            <LocationSearch
              startLocation={startLocation}
              destLocation={destLocation}
              onSetStartLocation={setStartLocation}
              onSetDestLocation={setDestLocation}
              onSwapLocations={handleSwapLocations}
              onFindRoute={handleFindRoute}
              isLoadingRoute={isLoadingRoute}
              selectionMode={selectionMode}
              onToggleSelectionMode={(mode) => setSelectionMode(selectionMode === mode ? null : mode)}
              errorMessage={routingError}
            />

            {/* Turn-by-Turn Maneuver List & Route Summary */}
            <RouteSummary
              route={route}
              activeStepIndex={telemetry.activeStepIndex}
            />

            {/* Live Event Log */}
            <SimulationEventLog
              logs={logs}
              onClearLogs={() => setLogs([])}
            />
          </div>

          {/* RIGHT AREA: Wristband Hardware Simulation + Controls + Test Bench (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 4-LED Realistic Physical Wristband Simulator */}
            <WristbandSimulator
              ledState={ledState}
              activeDirection={activeManeuver?.direction || null}
              activePulseCount={activeManeuver?.pulseCount || null}
              activeInstruction={activeManeuver?.instruction || null}
              distanceToManeuver={telemetry.demoScenario ? 150 : telemetry.distanceToNextTurn}
              isDestinationReached={status === 'ARRIVED'}
              manualOverrideActive={manualOverrideActive}
              onDurationMs={ledOnDurationMs}
              offDurationMs={ledOffDurationMs}
              onTimingChange={handleTimingChange}
            />

            {/* Simulation Speed, Early & Immediate Warning Distances, and State Controls */}
            <SimulationControls
              status={status}
              speedKmh={speedKmh}
              onSpeedChange={setSpeedKmh}
              onStart={handleStartSimulation}
              onPause={handlePauseSimulation}
              onResume={handleResumeSimulation}
              onStop={handleStopSimulation}
              onReset={handleResetSimulation}
              onSimulateOffRoute={handleSimulateOffRoute}
              canStart={!!route}
              earlyWarningDist={earlyWarningDist}
              mainSignalDist={mainSignalDist}
              onEarlyWarningChange={handleEarlyWarningChange}
              onMainSignalChange={handleMainSignalChange}
              autoFollow={autoFollow}
              onToggleAutoFollow={() => setAutoFollow(!autoFollow)}
            />

            {/* Interactive LED Test Bench with Preset Scenarios */}
            <LEDTestPanel
              onTestLeftTurn={handleTestLeftTurn}
              onTestRightTurn={handleTestRightTurn}
              onTestStraight={handleTestStraight}
              onTestUTurn={handleTestUTurn}
              onTestArrival={handleTestArrival}
              onTestStopAll={handleTestStopAll}
              onSelectScenario={handleSelectScenario}
              activeScenarioId={telemetry.demoScenario?.id}
              isSimulationRunning={status === 'RUNNING'}
              manualOverrideActive={manualOverrideActive}
            />
          </div>

        </div>
      </div>
    </section>
  );
};
