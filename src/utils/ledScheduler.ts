import { LEDState, TurnDirection } from '../types/navigation';

export type LedChangeCallback = (state: LEDState) => void;
export type PatternCompleteCallback = (pattern: string) => void;

export type SchedulerMode = 
  | 'IDLE' 
  | 'STRAIGHT' 
  | 'EARLY_WARNING' 
  | 'IMMEDIATE_WARNING' 
  | 'MAINTAIN_TURN' 
  | 'U_TURN' 
  | 'ARRIVAL' 
  | 'OFF_ROUTE' 
  | 'MANUAL_TEST';

export class LedScheduler {
  private activeTimeouts: NodeJS.Timeout[] = [];
  private currentPattern: string | null = null;
  private currentMode: SchedulerMode = 'IDLE';
  private currentLedState: LEDState = {
    leftRed: false,
    leftGreen: false,
    rightRed: false,
    rightGreen: false,
  };
  private onStateChange: LedChangeCallback;
  private onPatternComplete?: PatternCompleteCallback;
  private onDuration: number = 250;
  private offDuration: number = 200;

  constructor(
    onStateChange: LedChangeCallback,
    onPatternComplete?: PatternCompleteCallback,
    onDuration = 250,
    offDuration = 200
  ) {
    this.onStateChange = onStateChange;
    this.onPatternComplete = onPatternComplete;
    this.onDuration = onDuration;
    this.offDuration = offDuration;
  }

  public updateTiming(onDuration: number, offDuration: number) {
    this.onDuration = Math.max(50, onDuration);
    this.offDuration = Math.max(50, offDuration);
  }

  public clear() {
    this.activeTimeouts.forEach((t) => clearTimeout(t));
    this.activeTimeouts = [];
    this.currentPattern = null;
  }

  public turnOffAll() {
    this.clear();
    this.currentMode = 'IDLE';
    this.emitState({
      leftRed: false,
      leftGreen: false,
      rightRed: false,
      rightGreen: false,
    });
  }

  public setStraight(force = false) {
    // Prevent lower-priority straight signal from wiping out an active turn alert
    if (!force && this.isTurnWarningActive()) {
      return;
    }

    this.clear();
    this.currentMode = 'STRAIGHT';
    this.currentPattern = 'STRAIGHT';
    this.emitState({
      leftRed: false,
      leftGreen: true,
      rightRed: false,
      rightGreen: true,
    });
  }

  public setArrival() {
    this.clear();
    this.currentMode = 'ARRIVAL';
    this.currentPattern = 'ARRIVAL';
    this.emitState({
      leftRed: false,
      leftGreen: true,
      rightRed: false,
      rightGreen: true,
    });
  }

  public setOffRoute(pulses = 3) {
    this.clear();
    this.currentMode = 'OFF_ROUTE';
    this.currentPattern = 'OFF_ROUTE';
    this.schedulePulses(
      pulses,
      () => ({ leftRed: true, leftGreen: false, rightRed: true, rightGreen: false }),
      () => ({ leftRed: false, leftGreen: false, rightRed: false, rightGreen: false }),
      'OFF_ROUTE',
      this.onDuration,
      this.offDuration
    );
  }

  /**
   * Stage 1 — Early Warning (150m):
   * Directional green LED vibration pattern with exact pulse count (1, 2, or 3 pulses)
   */
  public triggerEarlyWarning(direction: 'LEFT' | 'RIGHT', pulses: number, patternLabel?: string) {
    this.clear();
    this.currentMode = 'EARLY_WARNING';
    const label = patternLabel || `EARLY_WARNING_${direction}_${pulses}_PULSES`;
    this.currentPattern = label;

    const onState: LEDState = {
      leftRed: false,
      leftGreen: direction === 'LEFT',
      rightRed: false,
      rightGreen: direction === 'RIGHT',
    };

    const offState: LEDState = {
      leftRed: false,
      leftGreen: false,
      rightRed: false,
      rightGreen: false,
    };

    this.schedulePulses(pulses, () => onState, () => offState, label, this.onDuration, this.offDuration);
  }

  /**
   * Stage 2 — Immediate Warning (50m):
   * Distinct, prominent alert pattern (faster cadence with high-energy urgency)
   */
  public triggerImmediateWarning(direction: 'LEFT' | 'RIGHT', pulses: number, patternLabel?: string) {
    this.clear();
    this.currentMode = 'IMMEDIATE_WARNING';
    const label = patternLabel || `IMMEDIATE_WARNING_${direction}_${pulses}_PULSES`;
    this.currentPattern = label;

    const onState: LEDState = {
      leftRed: false,
      leftGreen: direction === 'LEFT',
      rightRed: false,
      rightGreen: direction === 'RIGHT',
    };

    const offState: LEDState = {
      leftRed: false,
      leftGreen: false,
      rightRed: false,
      rightGreen: false,
    };

    // Immediate warning uses faster cadence (160ms ON / 120ms OFF) for distinguished urgency
    const immediateOn = Math.min(180, Math.max(80, Math.round(this.onDuration * 0.7)));
    const immediateOff = Math.min(140, Math.max(60, Math.round(this.offDuration * 0.6)));

    // Minimum 3 urgent alert pulses at the 50m threshold
    const immediatePulses = Math.max(pulses, 3);

    this.schedulePulses(immediatePulses, () => onState, () => offState, label, immediateOn, immediateOff);
  }

  /**
   * Turn zone (20m down to intersection):
   * Maintain directional green indication while negotiating the turn
   */
  public maintainTurnIndication(direction: 'LEFT' | 'RIGHT') {
    if (this.currentMode === 'MAINTAIN_TURN' && this.currentPattern === `MAINTAIN_${direction}`) {
      return;
    }
    this.clear();
    this.currentMode = 'MAINTAIN_TURN';
    this.currentPattern = `MAINTAIN_${direction}`;

    this.emitState({
      leftRed: false,
      leftGreen: direction === 'LEFT',
      rightRed: false,
      rightGreen: direction === 'RIGHT',
    });
  }

  /**
   * Standard Turn Trigger (Used by manual test bench and general turns)
   */
  public triggerTurn(direction: 'LEFT' | 'RIGHT', pulses: number, patternLabel?: string) {
    this.clear();
    this.currentMode = patternLabel?.startsWith('MANUAL') ? 'MANUAL_TEST' : 'EARLY_WARNING';
    const label = patternLabel || `${direction}_TURN_${pulses}_PULSES`;
    this.currentPattern = label;

    const onState: LEDState = {
      leftRed: false,
      leftGreen: direction === 'LEFT',
      rightRed: false,
      rightGreen: direction === 'RIGHT',
    };

    const offState: LEDState = {
      leftRed: false,
      leftGreen: false,
      rightRed: false,
      rightGreen: false,
    };

    this.schedulePulses(pulses, () => onState, () => offState, label, this.onDuration, this.offDuration);
  }

  /**
   * U-Turn Warning:
   * Both Red LEDs flash together (4 pulses), plus the sub-directional Green LED
   */
  public triggerUTurn(subDirection: 'LEFT' | 'RIGHT' = 'LEFT', pulses = 4, patternLabel?: string) {
    this.clear();
    this.currentMode = 'U_TURN';
    const label = patternLabel || `U_TURN_${pulses}_PULSES`;
    this.currentPattern = label;

    const onState: LEDState = {
      leftRed: true,
      leftGreen: subDirection === 'LEFT',
      rightRed: true,
      rightGreen: subDirection === 'RIGHT',
    };

    const offState: LEDState = {
      leftRed: false,
      leftGreen: false,
      rightRed: false,
      rightGreen: false,
    };

    this.schedulePulses(pulses, () => onState, () => offState, label, this.onDuration, this.offDuration);
  }

  public isBusy(): boolean {
    return this.activeTimeouts.length > 0;
  }

  public isTurnWarningActive(): boolean {
    return (
      this.currentMode === 'EARLY_WARNING' ||
      this.currentMode === 'IMMEDIATE_WARNING' ||
      this.currentMode === 'MAINTAIN_TURN' ||
      this.currentMode === 'U_TURN' ||
      this.currentMode === 'MANUAL_TEST'
    );
  }

  public getCurrentMode(): SchedulerMode {
    return this.currentMode;
  }

  public getCurrentPattern(): string | null {
    return this.currentPattern;
  }

  public getCurrentState(): LEDState {
    return { ...this.currentLedState };
  }

  private emitState(state: LEDState) {
    this.currentLedState = { ...state };
    this.onStateChange(this.currentLedState);
  }

  private schedulePulses(
    pulseCount: number,
    getOnState: () => LEDState,
    getOffState: () => LEDState,
    patternName: string,
    onMs: number,
    offMs: number
  ) {
    let accumulatedTime = 0;

    for (let p = 0; p < pulseCount; p++) {
      // Schedule ON
      const onTimeout = setTimeout(() => {
        this.emitState(getOnState());
      }, accumulatedTime);
      this.activeTimeouts.push(onTimeout);

      accumulatedTime += onMs;

      // Schedule OFF
      const offTimeout = setTimeout(() => {
        this.emitState(getOffState());
      }, accumulatedTime);
      this.activeTimeouts.push(offTimeout);

      accumulatedTime += offMs;
    }

    // Schedule Completion
    const completeTimeout = setTimeout(() => {
      this.activeTimeouts = [];
      const finishedPattern = this.currentPattern;
      if (this.currentMode !== 'MAINTAIN_TURN') {
        this.currentPattern = null;
      }
      if (this.onPatternComplete && finishedPattern) {
        this.onPatternComplete(finishedPattern);
      }
    }, accumulatedTime);

    this.activeTimeouts.push(completeTimeout);
  }
}

