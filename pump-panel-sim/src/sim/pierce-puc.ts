/**
 * Pierce PUC (Pump Up and Control) single-stage pump configuration
 * Defines default discharge line configurations and initial pump state
 */

import type { DischargeId, IntakeId, LineConfig, PumpState } from './model';
import { HOSE_C } from '../hydraulics/standards';

/**
 * Default discharge line configurations for Pierce PUC apparatus
 * Based on typical Pierce pumper specifications
 */
export const defaultLines: Record<DischargeId, LineConfig> = {
  xlay1: {
    id: 'xlay1',
    hose: {
      diameterIn: 1.75,
      lengthFt: 200,
      C: HOSE_C.DOUBLE_JACKET_1_75,
    },
    nozzle: {
      type: 'fog',
      targetGpm: 150,
    },
    foamCapable: true,
  },
  
  xlay2: {
    id: 'xlay2',
    hose: {
      diameterIn: 1.75,
      lengthFt: 200,
      C: HOSE_C.DOUBLE_JACKET_1_75,
    },
    nozzle: {
      type: 'smooth',
      tipIn: 0.875, // 7/8" tip
    },
    foamCapable: true,
  },
  
  xlay3: {
    id: 'xlay3',
    hose: {
      diameterIn: 1.75,
      lengthFt: 200,
      C: HOSE_C.DOUBLE_JACKET_1_75,
    },
    nozzle: {
      type: 'fog',
      targetGpm: 150,
    },
    foamCapable: true,
  },
  
  trash: {
    id: 'trash',
    hose: {
      diameterIn: 1.75,
      lengthFt: 100,
      C: HOSE_C.DOUBLE_JACKET_1_75,
    },
    nozzle: {
      type: 'fog',
      targetGpm: 95,
    },
    foamCapable: true,
  },
  
  d2_5_a: {
    id: 'd2_5_a',
    hose: {
      diameterIn: 2.5,
      lengthFt: 200,
      C: HOSE_C.DOUBLE_JACKET_2_5,
    },
    nozzle: {
      type: 'smooth',
      tipIn: 1.0, // 1" tip
    },
    foamCapable: false,
  },
  
  d2_5_b: {
    id: 'd2_5_b',
    hose: {
      diameterIn: 2.5,
      lengthFt: 200,
      C: HOSE_C.DOUBLE_JACKET_2_5,
    },
    nozzle: {
      type: 'fog',
      targetGpm: 250,
    },
    foamCapable: false,
  },
  
  d2_5_c: {
    id: 'd2_5_c',
    hose: {
      diameterIn: 2.5,
      lengthFt: 200,
      C: HOSE_C.DOUBLE_JACKET_2_5,
    },
    nozzle: {
      type: 'smooth',
      tipIn: 1.125, // 1-1/8" tip
    },
    foamCapable: false,
  },
  
  d2_5_d: {
    id: 'd2_5_d',
    hose: {
      diameterIn: 2.5,
      lengthFt: 200,
      C: HOSE_C.DOUBLE_JACKET_2_5,
    },
    nozzle: {
      type: 'smooth',
      tipIn: 1.125, // 1-1/8" tip
    },
    foamCapable: true, // Driver rear 2.5" with foam capability
  },
  
  deck: {
    id: 'deck',
    hose: {
      diameterIn: 3.0,
      lengthFt: 25,
      C: 150, // Double-jacket large diameter
    },
    nozzle: {
      type: 'master_smooth',
      tipIn: 1.375, // 1-3/8" tip
    },
    foamCapable: false,
  },
  
  rear_ldh: {
    id: 'rear_ldh',
    hose: {
      diameterIn: 5.0,
      lengthFt: 50,
      C: HOSE_C.LDH_5,
    },
    nozzle: {
      type: 'master_fog',
      targetGpm: 1000,
    },
    foamCapable: false,
  },
};

/**
 * Create initial pump state with default configurations
 * 
 * @returns Initial PumpState with all systems at safe starting values
 */
export function createInitialPumpState(): PumpState {
  const intakeIds: IntakeId[] = ['ldh_driver', 'ldh_officer', 'rear_ldh'];
  const dischargeIds: DischargeId[] = [
    'xlay1', 'xlay2', 'xlay3', 'trash',
    'd2_5_a', 'd2_5_b', 'd2_5_c', 'd2_5_d',
    'deck', 'rear_ldh'
  ];
  
  // Initialize all intake pressures to 0
  const intakePsi: Record<IntakeId, number> = {} as Record<IntakeId, number>;
  for (const id of intakeIds) {
    intakePsi[id] = 0;
  }
  
  // Initialize all discharge valves to closed (0%)
  const dischargeValvePct: Record<DischargeId, number> = {} as Record<DischargeId, number>;
  for (const id of dischargeIds) {
    dischargeValvePct[id] = 0;
  }
  
  return {
    throttle: 0,
    waterSource: 'tank',
    intakePsi,
    dischargeValvePct,
    lineConfigs: defaultLines,
    foam: {
      enabledLines: new Set<DischargeId>(),
      percent: 0.6, // 0.6% foam concentrate (Class A typical)
      tankGallons: 30, // 30 gallons of concentrate
      tankCapacityGallons: 30, // 30 gallon capacity
      enabled: false, // Foam system OFF by default
    },
    tankGallons: 500, // 500 gallon water tank (typical for Pierce pumper)
    engineRpm: 800, // Idle RPM
    interlocks: {
      engaged: false, // Pump not engaged by default (MUST be OFF initially)
      primed: true, // Assume primed from tank
      emergencyStop: false,
    },
    runtime: {
      rpm: 0, // Engine off initially (not engaged)
      governor: 'PRESSURE', // Default to PRESSURE mode
    },
    drv: {
      enabled: true, // DRV enabled by default for safety
      setpointPsi: 275, // 275 PSI relief setpoint (50 PSI above max operating pressure)
      bypassGpm: 0, // No bypass flow initially
    },
    dischargePsi: 0, // No discharge pressure initially
    intakePressurePsi: 0, // No intake pressure initially
    intakeVacuumInHg: 0, // No vacuum initially
    totalFlowGpm: 0, // No flow initially
    
    // NEW: Tank and cooling controls
    tankToPumpOpen: false, // Closed for startup (must be opened manually)
    tankFillRecircPct: 0, // Closed initially (open to ~33% for cooling)
    
    // NEW: Priming system
    primerActive: false, // Not priming
    primerTimeRemaining: 0, // No active prime cycle
    
    // NEW: Temperature monitoring (Phase 2.4)
    pumpTempF: 70, // Ambient temperature start (70°F)
    engineTempF: 180, // Normal operating temperature (180°F)
    
    // NEW: Active warnings
    warnings: new Set<string>(), // No warnings initially
    
    // NEW: Cavitation state
    isCavitating: false, // Not cavitating initially
    
    // NEW: Overpressure tracking (Phase 2.3)
    overpressureDurationSec: 0, // No overpressure initially
    burstLines: new Set<DischargeId>(), // No burst lines initially
  };
}