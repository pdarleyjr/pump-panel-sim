/**
 * Compound gauge system for fire pump panel
 * Handles master intake gauge (PSI/inHg) and discharge gauge behavior
 * 
 * Blueprint ref: Lines 12, 15, 19, 152, 159-160, 236, 238
 */

/**
 * Calculate intake gauge reading (compound gauge: PSI or vacuum)
 * 
 * Blueprint ref: Lines 15, 236, 238
 */
export function intakeGauge(
  source: 'tank' | 'hydrant' | 'draft' | 'relay',
  intakePsi: number,
  tankToPumpOpen: boolean,
  primed: boolean
): { psi?: number; vacuumInHg?: number; warning?: string } {
  switch (source) {
    case 'tank':
      // Tank-to-Pump baseline: 40-50 PSI when open at idle
      // This verifies apparatus-specific tank pressure
      if (tankToPumpOpen) {
        // If pump engaged but not flowing, show baseline pressure
        const baselinePsi = 45; // Typical tank baseline (40-50 PSI range)
        return { 
          psi: Math.max(baselinePsi, intakePsi),
          warning: intakePsi < 40 ? 'Low tank pressure' : undefined
        };
      } else {
        // Tank-to-Pump closed, no pressure
        return { psi: 0, warning: 'Open Tank-to-Pump valve' };
      }
      
    case 'hydrant':
      // Hydrant residual pressure (typically 50-80 PSI)
      if (intakePsi < 20) {
        return { 
          psi: intakePsi,
          warning: 'LOW RESIDUAL: Check water supply'
        };
      }
      return { psi: intakePsi };
      
    case 'draft':
      // Drafting shows vacuum (negative pressure)
      if (!primed) {
        // Not primed: high vacuum as primer evacuates air
        const vacuumInHg = Math.abs(intakePsi) * 2.036; // Convert PSI to inHg (1 PSI ≈ 2.036 inHg)
        return {
          vacuumInHg,
          warning: vacuumInHg > 20 ? 'PRIMING: Vacuum building' : 'Prime pump to flow'
        };
      } else {
        // Primed: slight vacuum during flow
        const vacuumInHg = Math.abs(intakePsi) * 2.036;
        if (vacuumInHg > 20) {
          return {
            vacuumInHg,
            warning: 'MAX LIFT EXCEEDED: Reduce height or increase water level'
          };
        }
        return { vacuumInHg };
      }
      
    case 'relay':
      // Relay: upstream pump provides positive pressure
      return { 
        psi: intakePsi,
        warning: intakePsi < 10 ? 'Low relay pressure' : undefined
      };
      
    default:
      return { psi: 0 };
  }
}

/**
 * Calculate discharge gauge reading (PDP)
 * 
 * Blueprint ref: Lines 19, 152
 */
export function dischargeGauge(
  pdp: number
): { psi: number; warning?: string } {
  // 400 PSI absolute maximum
  if (pdp > 400) {
    return {
      psi: 400, // Clamp display
      warning: 'DANGER: OVERPRESSURE (400 PSI MAX)'
    };
  }
  
  // Approaching limit
  if (pdp > 350) {
    return {
      psi: pdp,
      warning: 'CAUTION: Approaching 400 PSI limit'
    };
  }
  
  // High pressure zone
  if (pdp > 250) {
    return {
      psi: pdp,
      warning: 'HIGH PRESSURE: Use RPM mode'
    };
  }
  
  // Normal operation
  return { psi: pdp };
}

/**
 * Get comprehensive pump status for display
 * 
 * Blueprint ref: Lines 12, 159-160
 */
export interface PumpStatus {
  mode: 'PSI' | 'RPM';
  setpoint: number;
  setpointUnit: 'PSI' | 'RPM';
  actualPDP: number;
  actualRPM: number;
  intakePsi: number;
  intakeVacuumInHg?: number;
  totalFlowGpm: number;
  warnings: string[];
}

export function getPumpStatus(state: any): PumpStatus {
  const intakeData = intakeGauge(
    state.waterSource,
    state.intakePressurePsi || 0,
    state.tankToPumpOpen || false,
    state.interlocks.primed || false
  );
  
  const dischargeData = dischargeGauge(state.dischargePsi || 0);
  
  // Combine all warnings
  const warnings: string[] = [];
  if (intakeData.warning) warnings.push(intakeData.warning);
  if (dischargeData.warning) warnings.push(dischargeData.warning);
  if (state.warnings) {
    warnings.push(...Array.from(state.warnings));
  }
  
  // Determine mode from governor
  const mode = state.runtime?.governor === 'PRESSURE' ? 'PSI' : 'RPM';
  
  // Get setpoint based on mode
  let setpoint = 0;
  if (mode === 'PSI') {
    // For PSI mode, setpoint would be target PDP (not directly in state, use current)
    setpoint = state.dischargePsi || 0;
  } else {
    // For RPM mode, setpoint is target RPM
    setpoint = state.runtime?.rpm || state.runtimeRpm || 0;
  }
  
  return {
    mode,
    setpoint,
    setpointUnit: mode === 'PSI' ? 'PSI' : 'RPM',
    actualPDP: state.dischargePsi || 0,
    actualRPM: state.runtime?.rpm || state.runtimeRpm || 0,
    intakePsi: intakeData.psi || 0,
    intakeVacuumInHg: intakeData.vacuumInHg,
    totalFlowGpm: state.totalFlowGpm || 0,
    warnings: warnings.filter((w, i, arr) => arr.indexOf(w) === i) // Remove duplicates
  };
}

// Legacy compatibility functions (can be deprecated later)

/**
 * Master intake gauge behavior:
 * - Hydrant: positive PSI (shows supply pressure)
 * - Draft: negative inHg (shows vacuum, max ~22 inHg)
 * - Tank: positive PSI (from tank to pump line)
 */
export interface IntakeGaugeReading {
  psi?: number;
  inHg?: number;
  warning?: string;
}

/**
 * Discharge gauge shows PDP (Pump Discharge Pressure)
 */
export interface DischargeGaugeReading {
  psi: number;
  warning?: string;
}

/**
 * Check if intake vacuum is within safe operating limits
 * 
 * @param reading - Intake gauge reading
 * @returns True if within safe limits
 */
export function isIntakeVacuumSafe(reading: IntakeGaugeReading): boolean {
  if (reading.inHg !== undefined) {
    // Max safe vacuum is typically 20 inHg
    return reading.inHg <= 20;
  }
  return true;
}

/**
 * Check if discharge pressure is within safe operating limits
 * 
 * @param reading - Discharge gauge reading
 * @returns True if within safe limits
 */
export function isDischargePressureSafe(reading: DischargeGaugeReading): boolean {
  // Max safe discharge is 250 PSI for most fire pumps
  return reading.psi <= 250;
}

/**
 * Format gauge reading for display
 * 
 * @param reading - Intake gauge reading
 * @returns Formatted string for display
 */
export function formatIntakeReading(reading: IntakeGaugeReading): string {
  if (reading.psi !== undefined) {
    return `${Math.round(reading.psi)} PSI`;
  }
  if (reading.inHg !== undefined) {
    return `${reading.inHg.toFixed(1)}" Hg`;
  }
  return '0 PSI';
}

/**
 * Format discharge gauge reading for display
 * 
 * @param reading - Discharge gauge reading
 * @returns Formatted string for display
 */
export function formatDischargeReading(reading: DischargeGaugeReading): string {
  return `${Math.round(reading.psi)} PSI`;
}