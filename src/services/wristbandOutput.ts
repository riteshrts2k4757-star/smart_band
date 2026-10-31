import { TurnDirection, PulseCount } from '../types/navigation';
import { LedScheduler } from '../utils/ledScheduler';

export type WristbandPattern = 
  | 'LEFT_TURN'
  | 'RIGHT_TURN'
  | 'STRAIGHT'
  | 'U_TURN'
  | 'ARRIVAL'
  | 'OFF_ROUTE'
  | 'IDLE';

export interface WristbandCommand {
  pattern: WristbandPattern;
  direction?: TurnDirection;
  pulseCount: PulseCount;
  onDurationMs: number;
  offDurationMs: number;
  vibrate: boolean;
  timestamp: number;
}

/**
 * Standard Interface for Haptic Wristband Output
 * Allows seamless swapping between web UI simulation and future ESP32 BLE hardware.
 */
export interface IWristbandOutput {
  sendTurn(direction: 'LEFT' | 'RIGHT', pulses: PulseCount, onMs?: number, offMs?: number): void;
  sendStraight(): void;
  sendUTurn(subDirection?: 'LEFT' | 'RIGHT', pulses?: PulseCount): void;
  sendArrival(): void;
  sendOffRoute(): void;
  stopAll(): void;
  isBusy(): boolean;
}

/**
 * Web Simulator Implementation of Wristband Output
 * Controls the browser LED matrix and haptic motor vibration animations.
 */
export class SimulatorWristbandOutput implements IWristbandOutput {
  private ledScheduler: LedScheduler;
  private onCommandDispatched?: (cmd: WristbandCommand) => void;

  constructor(
    ledScheduler: LedScheduler,
    onCommandDispatched?: (cmd: WristbandCommand) => void
  ) {
    this.ledScheduler = ledScheduler;
    this.onCommandDispatched = onCommandDispatched;
  }

  public sendTurn(direction: 'LEFT' | 'RIGHT', pulses: PulseCount, onMs = 250, offMs = 200): void {
    this.ledScheduler.triggerTurn(direction, pulses);
    this.notify({
      pattern: direction === 'LEFT' ? 'LEFT_TURN' : 'RIGHT_TURN',
      direction,
      pulseCount: pulses,
      onDurationMs: onMs,
      offDurationMs: offMs,
      vibrate: true,
      timestamp: Date.now()
    });
  }

  public sendStraight(): void {
    this.ledScheduler.setStraight();
    this.notify({
      pattern: 'STRAIGHT',
      direction: 'STRAIGHT',
      pulseCount: 1,
      onDurationMs: 0,
      offDurationMs: 0,
      vibrate: false,
      timestamp: Date.now()
    });
  }

  public sendUTurn(subDirection: 'LEFT' | 'RIGHT' = 'LEFT', pulses: PulseCount = 4): void {
    this.ledScheduler.triggerUTurn(subDirection, pulses);
    this.notify({
      pattern: 'U_TURN',
      direction: 'U-TURN',
      pulseCount: pulses,
      onDurationMs: 250,
      offDurationMs: 200,
      vibrate: true,
      timestamp: Date.now()
    });
  }

  public sendArrival(): void {
    this.ledScheduler.setArrival();
    this.notify({
      pattern: 'ARRIVAL',
      direction: 'ARRIVED',
      pulseCount: 1,
      onDurationMs: 0,
      offDurationMs: 0,
      vibrate: true,
      timestamp: Date.now()
    });
  }

  public sendOffRoute(): void {
    this.ledScheduler.setOffRoute(3);
    this.notify({
      pattern: 'OFF_ROUTE',
      pulseCount: 3,
      onDurationMs: 200,
      offDurationMs: 150,
      vibrate: true,
      timestamp: Date.now()
    });
  }

  public stopAll(): void {
    this.ledScheduler.turnOffAll();
    this.notify({
      pattern: 'IDLE',
      pulseCount: 1,
      onDurationMs: 0,
      offDurationMs: 0,
      vibrate: false,
      timestamp: Date.now()
    });
  }

  public isBusy(): boolean {
    return this.ledScheduler.isBusy();
  }

  private notify(cmd: WristbandCommand) {
    if (this.onCommandDispatched) {
      this.onCommandDispatched(cmd);
    }
  }
}

/**
 * Future Physical ESP32 BLE Driver Placeholder
 * Ready for Web Bluetooth API integration (navigator.bluetooth.requestDevice)
 */
export class Esp32BleWristbandOutput implements IWristbandOutput {
  private serviceUuid = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  private charUuid = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
  private connectedDevice: any = null;

  public async connect(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      try {
        // @ts-ignore
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ namePrefix: 'NAVIBAND' }],
          optionalServices: [this.serviceUuid]
        });
        this.connectedDevice = device;
        return true;
      } catch (err) {
        console.warn('ESP32 BLE connection cancelled or not supported:', err);
        return false;
      }
    }
    return false;
  }

  public sendTurn(direction: 'LEFT' | 'RIGHT', pulses: PulseCount): void {
    const payload = new Uint8Array([direction === 'LEFT' ? 0x01 : 0x02, pulses]);
    this.sendBlePacket(payload);
  }

  public sendStraight(): void {
    const payload = new Uint8Array([0x03, 0x01]);
    this.sendBlePacket(payload);
  }

  public sendUTurn(_subDirection?: 'LEFT' | 'RIGHT', pulses: PulseCount = 4): void {
    const payload = new Uint8Array([0x04, pulses]);
    this.sendBlePacket(payload);
  }

  public sendArrival(): void {
    const payload = new Uint8Array([0x05, 0x01]);
    this.sendBlePacket(payload);
  }

  public sendOffRoute(): void {
    const payload = new Uint8Array([0x06, 0x03]);
    this.sendBlePacket(payload);
  }

  public stopAll(): void {
    const payload = new Uint8Array([0x00, 0x00]);
    this.sendBlePacket(payload);
  }

  public isBusy(): boolean {
    return false;
  }

  private sendBlePacket(_packet: Uint8Array) {
    // Transmit to ESP32 GATT characteristic once connected
  }
}

