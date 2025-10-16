/**
 * FRAR-style interlocks for fire pump operations
 * Implements safety rules and operational constraints
 */

import type { SimState } from './state';

/**
 * Pierce PUC: Validate proper changeover sequence from tank to external intake
 * 
 * Proper procedure:
 * 1. Open gated intake valve
 * 2. Wait for pressure stabilization
 * 3. Close tank-to-pump valve
 * 4. Verify intake pressure maintained
 * 
 * @param state Current simulation state
 * @returns Validation result with any faults detected
 */
export function validateChangeoverSequence(state: SimState): {
  valid: boolean;
  faults: string[];
} {
  const faults: string[] = [];
  
  // Check if both valves open simultaneously (forbidden)
  const hasGatedIntake = Object.values(state.intakes).some(i => i.source === 'hydrant' || i.source === 'relay');
  if (state.tankToPumpOpen && hasGatedIntake && state.pump.engaged) {
    faults.push('CHANGEOVER FAULT: Both tank and intake valves open simultaneously');
  }
  
  // Check if no water source available
  if (!state.tankToPumpOpen && !hasGatedIntake && state.pump.engaged) {
    const isDrafting = Object.values(state.intakes).some(i => i.source === 'draft');
    if (!isDrafting) {
      faults.push('NO WATER SOURCE: All intake valves closed');
    }
  }
  
  // Check pressure drop during changeover (inadequate intake)
  if (state.pump.engaged && state.pump.pdp > 0 && state.pump.intakePsi < 10) {
    faults.push('PRESSURE DROP: Inadequate intake during changeover');
  }
  
  return {
    valid: faults.length === 0,
    faults,
  };
}

/**
 * Check if throttle adjustment is allowed
 * Throttle can only be adjusted when pump is engaged
 */
export function canAdjustThrottle(state: SimState): boolean {
  return state.pump.engaged;
}

/**
 * Check if discharge valves can be opened
 * Discharges can only be opened when pump is engaged
 */
export function canOpenDischarge(state: SimState): boolean {
  return state.pump.engaged;
}

/**
 * Check if foam percentage can be changed on a discharge line
 * Foam can only be adjusted when pump is engaged and valve is open
 */
export function canChangeFoam(state: SimState, dischargeId: string): boolean {
  const discharge = state.discharges[dischargeId];
  if (!discharge) return false;
  return state.pump.engaged && discharge.open > 0;
}

/**
 * Check if governor mode can be switched
 * Can only switch to RPM mode when drafting or high pressure
 */
export function canSwitchGovernor(state: SimState): boolean {
  // Can only switch to RPM mode when drafting or high pressure
  if (state.pump.governor === 'PRESSURE') {
    const isDrafting = Object.values(state.intakes).some(i => i.source === 'draft');
    const isHighPressure = state.pump.pdp > 250;
    return isDrafting || isHighPressure;
  }
  return true; // Can always switch back to PRESSURE
}

/**
 * Get interlock warning message for a specific action
 * Returns null if action is allowed
 */
export function getInterlockWarning(action: string, state: SimState): string | null {
  switch (action) {
    case 'throttle':
      if (!canAdjustThrottle(state)) {
        return 'Pump must be engaged to adjust throttle';
      }
      break;
      
    case 'discharge':
      if (!canOpenDischarge(state)) {
        return 'Pump must be engaged to open discharges';
      }
      break;
      
    case 'governor':
      if (!canSwitchGovernor(state)) {
        return 'Can only switch to RPM mode when drafting or at high pressure (>250 PSI)';
      }
      break;
  }
  
  return null;
}

/**
 * Validate state for common safety violations
 * Returns array of warning messages
 */
export function validateState(state: SimState): string[] {
  const warnings: string[] = [];
  
  // Check if discharges are open but pump not engaged
  const openDischarges = Object.values(state.discharges).filter(d => d.open > 0);
  if (openDischarges.length > 0 && !state.pump.engaged) {
    warnings.push('Discharge valves open but pump not engaged');
  }
  
  // Check if foam is enabled but tank is empty
  const foamInUse = Object.values(state.discharges).some(d => d.foamPct > 0 && d.open > 0);
  if (foamInUse && state.pump.foamTankGallons <= 0) {
    warnings.push('Foam concentrate depleted');
  }
  
  // Check if drafting but primer not active (and not already primed)
  const isDrafting = Object.values(state.intakes).some(i => i.source === 'draft');
  if (isDrafting && !state.primerActive && !state.primed && state.pump.engaged) {
    warnings.push('Drafting without primer - pump may not flow');
  }
  
  // Check if tank-to-pump is closed and no other water source
  const hasHydrant = Object.values(state.intakes).some(i => i.source === 'hydrant');
  const hasRelay = Object.values(state.intakes).some(i => i.source === 'relay');
  if (!state.tankToPumpOpen && !hasHydrant && !hasRelay && !isDrafting && state.pump.engaged) {
    warnings.push('No water source available');
  }
  
  return warnings;
}