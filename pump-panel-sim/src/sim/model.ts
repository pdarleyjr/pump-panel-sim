/**
 * Core data models for fire pump panel simulation
 * Defines types and interfaces for pumps, valves, discharge lines, and foam systems
 */

/**
 * Union type for all discharge line identifiers
 */
export type DischargeId =
  | 'xlay1'      // Cross-lay 1 (1¾")
  | 'xlay2'      // Cross-lay 2 (1¾")
  | 'xlay3'      // Cross-lay 3 (1¾")
  | 'trash'      // Trash line (1¾")
  | 'd2_5_a'     // 2.5" line A
  | 'd2_5_b'     // 2.5" line B
  | 'd2_5_c'     // 2.5" line C
  | 'd2_5_d'     // 2.5" line D
  | 'deck'       // Deck gun (master stream)
  | 'rear_ldh';  // Rear LDH combined intake/discharge

/**
 * Union type for intake line identifiers
 */
export type IntakeId =
  | 'ldh_driver'   // Driver side LDH intake
  | 'ldh_officer'  // Officer side LDH intake
  | 'rear_ldh';    // Rear LDH intake (dual-purpose)

/**
 * Union type for nozzle types
 */
export type NozzleType =
  | 'smooth'         // Smooth-bore handline nozzle
  | 'fog'            // Fog/automatic handline nozzle
  | 'master_smooth'  // Smooth-bore master stream
  | 'master_fog';    // Fog master stream

/**
 * Union type for water sources
 */
export type WaterSource =
  | 'tank'     // Onboard water tank
  | 'hydrant'  // Fire hydrant
  | 'draft'    // Static water source (pond, lake, etc.)
  | 'relay';   // Relay pumping from another apparatus

/**
 * Configuration for a discharge line including hose and nozzle specifications
 */
export interface LineConfig {
  /** Unique identifier for this discharge line */
  id: DischargeId;
  
  /** Hose specifications */
  hose: {
    /** Internal diameter in inches */
    diameterIn: number;
    /** Length in feet */
    lengthFt: number;
    /** Hazen-Williams C coefficient (roughness factor) */
    C: number;
  };
  
  /** Nozzle specifications */
  nozzle: {
    /** Type of nozzle */
    type: NozzleType;
    /** Tip diameter in inches (for smooth-bore nozzles) */
    tipIn?: number;
    /** Target flow in GPM (for fog/automatic nozzles) */
    targetGpm?: number;
  };
  
  /** Whether this line is capable of foam proportioning */
  foamCapable: boolean;
}

/**
 * Foam proportioning system configuration
 * Models a Husky 12 style foam system
 */
export interface FoamSystem {
  /** Set of discharge lines with foam enabled */
  enabledLines: Set<DischargeId>;
  
  /** Foam percentage (0.1 to 1.0+ %) */
  percent: number;
  
  /** Remaining foam concentrate in gallons */
  tankGallons: number;
  
  /** Foam tank capacity in gallons */
  tankCapacityGallons: number;
  
  /** Foam system master ON/OFF switch */
  enabled: boolean;
}

/**
 * Pump interlock states that control operation
 */
export interface PumpInterlocks {
  /** Main pump ON/OFF */
  engaged: boolean;
  /** Pump is primed with water */
  primed: boolean;
  /** E-stop activated */
  emergencyStop: boolean;
}

/**
 * Pump runtime parameters
 */
export interface PumpRuntime {
  /** Engine RPM (0-3000) */
  rpm: number;
  /** Governor mode */
  governor: 'RPM' | 'PRESSURE';
}

/**
 * DRV (Discharge Relief Valve) state
 */
export interface DRVState {
  /** DRV system active */
  enabled: boolean;
  /** Relief pressure threshold */
  setpointPsi: number;
  /** Current bypass flow */
  bypassGpm: number;
}

/**
 * Complete state of the pump panel system
 */
export interface PumpState {
  /** Engine throttle percentage (0-100%) */
  throttle: number;
  
  /** Current water source */
  waterSource: WaterSource;
  
  /** Intake pressures for each intake line (PSI) */
  intakePsi: Record<IntakeId, number>;
  
  /** Discharge valve positions (0-100% open) */
  dischargeValvePct: Record<DischargeId, number>;
  
  /** Configuration for each discharge line */
  lineConfigs: Record<DischargeId, LineConfig>;
  
  /** Foam system state */
  foam: FoamSystem;
  
  /** Onboard water tank capacity in gallons */
  tankGallons: number;
  
  /** Engine RPM */
  engineRpm: number;
  
  /** Pump interlock states */
  interlocks: PumpInterlocks;
  
  /** Pump runtime parameters */
  runtime: PumpRuntime;
  
  /** DRV (Discharge Relief Valve) state */
  drv: DRVState;
  
  /** Master discharge gauge reading (Pump Discharge Pressure) in PSI */
  dischargePsi: number;
  
  /** Master intake gauge reading (positive PSI for hydrant/tank) */
  intakePressurePsi: number;
  
  /** Master intake gauge vacuum reading (negative inHg for draft) */
  intakeVacuumInHg: number;
  
  /** Total flow from all discharge lines in GPM */
  totalFlowGpm: number;
  
  // Tank and cooling controls
  /** Tank-to-Pump valve state */
  tankToPumpOpen: boolean;
  /** Tank Fill/Recirc valve percentage (0-100) for cooling */
  tankFillRecircPct: number;
  
  // Priming system (for drafting)
  /** Primer button currently pressed */
  primerActive: boolean;
  /** Seconds left in prime cycle (15 sec total) */
  primerTimeRemaining: number;
  
  // Temperature monitoring
  /** Pump casing temperature (60-300°F range) */
  pumpTempF: number;
  /** Engine temperature (140-250°F range) */
  engineTempF: number;
  
  // Active warnings
  /** Active warning messages */
  warnings: Set<string>;
  
  // Cavitation state
  /** Whether the pump is currently cavitating (starved for water) */
  isCavitating: boolean;
  
  // Overpressure tracking (Phase 2.3)
  /** Duration in seconds that discharge pressure has been above 400 PSI */
  overpressureDurationSec: number;
  /** Array of discharge line IDs that have burst due to overpressure */
  burstLines: Set<DischargeId>;
}