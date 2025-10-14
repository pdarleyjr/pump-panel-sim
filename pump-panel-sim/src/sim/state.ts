/**
 * Central state management for fire pump simulator
 * Defines the core state structure and factory functions
 */

export type Governor = 'RPM' | 'PRESSURE';
export type WaterSource = 'tank' | 'hydrant' | 'draft' | 'relay';
export type NozzleType = 'smooth' | 'fog';

/**
 * Discharge line configuration and state
 */
export interface Discharge {
  id: string;
  open: number;              // 0-1 (valve position)
  diameterIn: number;        // hose diameter (1.75, 2.5, 3.0, 5.0)
  lengthFt: number;          // hose length
  nozzleType: NozzleType;
  nozzleNPsi: number;        // required nozzle pressure (50, 80, 100)
  foamPct: number;           // foam percentage 0-9.9 (0 = off)
}

/**
 * Intake line configuration and state
 */
export interface Intake {
  id: string;
  source: WaterSource;
  ldh: boolean;              // is this an LDH intake?
  psi: number;               // current intake pressure or vacuum
}

/**
 * Discharge Relief Valve (DRV) state
 */
export interface DRV {
  enabled: boolean;          // DRV engaged/disengaged
  setpointPsi: number;       // relief pressure setpoint
}

/**
 * Pump state and parameters
 */
export interface Pump {
  engaged: boolean;          // master pump ON/OFF
  governor: Governor;        // RPM or PRESSURE mode
  setpoint: number;          // RPM or PSI setpoint depending on mode
  rpm: number;               // actual engine RPM
  pdp: number;               // pump discharge pressure (computed)
  intakePsi: number;         // compound gauge (computed)
  foamTankGallons: number;   // remaining foam concentrate
  foamTankCapacityGallons: number; // foam tank capacity
  foamSystemEnabled: boolean; // foam system master ON/OFF
  drv: DRV;                  // discharge relief valve state
}

/**
 * Complete simulation state
 */
export interface SimState {
  pump: Pump;
  discharges: Record<string, Discharge>;
  intakes: Record<string, Intake>;
  elevationFt: number;
  tankToPumpOpen: boolean;
  tankFillRecircPct: number;
  primerActive: boolean;
  primed: boolean;
  isActivePriming: boolean;
  primingProgress: number;
}

/**
 * Create initial state factory
 */
export function createInitialState(): SimState {
  return {
    pump: {
      engaged: false,
      governor: 'PRESSURE',
      setpoint: 150,
      rpm: 0,
      pdp: 0,
      intakePsi: 0,
      foamTankGallons: 20,
      foamTankCapacityGallons: 20,
      foamSystemEnabled: false,
      drv: {
        enabled: false,
        setpointPsi: 200,
      },
    },
    discharges: {
      xlay1: { id: 'xlay1', open: 0, diameterIn: 1.75, lengthFt: 200, nozzleType: 'fog', nozzleNPsi: 100, foamPct: 0 },
      xlay2: { id: 'xlay2', open: 0, diameterIn: 1.75, lengthFt: 200, nozzleType: 'smooth', nozzleNPsi: 50, foamPct: 0 },
      xlay3: { id: 'xlay3', open: 0, diameterIn: 1.75, lengthFt: 200, nozzleType: 'fog', nozzleNPsi: 100, foamPct: 0 },
      trash: { id: 'trash', open: 0, diameterIn: 1.75, lengthFt: 100, nozzleType: 'fog', nozzleNPsi: 100, foamPct: 0 },
      deck: { id: 'deck', open: 0, diameterIn: 3.0, lengthFt: 25, nozzleType: 'smooth', nozzleNPsi: 80, foamPct: 0 },
      rear_ldh: { id: 'rear_ldh', open: 0, diameterIn: 5.0, lengthFt: 50, nozzleType: 'fog', nozzleNPsi: 100, foamPct: 0 },
    },
    intakes: {
      ldh_driver: { id: 'ldh_driver', source: 'hydrant', ldh: true, psi: 0 },
      ldh_officer: { id: 'ldh_officer', source: 'hydrant', ldh: true, psi: 0 },
    },
    elevationFt: 0,
    tankToPumpOpen: false,
    tankFillRecircPct: 0,
    primerActive: false,
    primed: false,
    isActivePriming: false,
    primingProgress: 0,
  };
}