/**
 * Discharge Relief Valve (DRV) simulation
 * Automatically bypasses flow when pressure exceeds setpoint to protect the system
 */

import type { PumpState } from './model';

/**
 * Result of DRV calculation
 */
export interface DRVResult {
  /** Adjusted pump discharge pressure after relief */
  adjustedPDP: number;
  /** Bypass flow rate in GPM */
  bypassGpm: number;
}

/**
 * Apply DRV (Discharge Relief Valve) behavior
 * When PDP exceeds setpoint, bypass flow to reduce pressure
 * 
 * The DRV protects the system from dangerous pressure surges by automatically
 * opening a bypass valve that routes water back to the intake or tank.
 * 
 * @param state - Current pump state
 * @param currentPDP - Current pump discharge pressure in PSI
 * @returns Adjusted pressure and bypass flow rate
 */
export function applyDRV(
  state: PumpState,
  currentPDP: number
): DRVResult {
  // DRV only operates when enabled and pump is engaged
  if (!state.drv.enabled || !state.interlocks.engaged) {
    return { adjustedPDP: currentPDP, bypassGpm: 0 };
  }
  
  // Calculate overpressure (how much pressure exceeds setpoint)
  const overpressure = currentPDP - state.drv.setpointPsi;
  
  // No relief needed if pressure is below setpoint
  if (overpressure <= 0) {
    return { adjustedPDP: currentPDP, bypassGpm: 0 };
  }
  
  // Calculate bypass flow (approximately 2 GPM per PSI overpressure, max 500 GPM)
  // This is a simplified model; actual DRV behavior depends on valve design
  const bypassGpm = Math.min(overpressure * 2.0, 500);
  
  // Reduce pressure by 85% of overpressure (realistic relief behavior)
  // The DRV doesn't completely eliminate overpressure instantly due to
  // mechanical response time and flow dynamics
  const adjustedPDP = Math.max(
    state.drv.setpointPsi,
    currentPDP - overpressure * 0.85
  );
  
  return { adjustedPDP, bypassGpm };
}

/**
 * Calculate DRV response time
 * Models the time it takes for the DRV to fully respond to pressure changes
 * 
 * @param currentBypass - Current bypass flow in GPM
 * @param targetBypass - Target bypass flow in GPM
 * @param deltaTime - Time step in seconds
 * @returns New bypass flow after response delay
 */
export function calculateDRVResponse(
  currentBypass: number,
  targetBypass: number,
  deltaTime: number
): number {
  // DRV response rate: approximately 100 GPM per second
  const responseRate = 100; // GPM/sec
  const maxChange = responseRate * deltaTime;
  
  const difference = targetBypass - currentBypass;
  
  if (Math.abs(difference) <= maxChange) {
    return targetBypass;
  }
  
  return currentBypass + Math.sign(difference) * maxChange;
}

/**
 * Check if DRV is actively relieving pressure
 * 
 * @param state - Current pump state
 * @returns True if DRV is currently bypassing flow
 */
export function isDRVActive(state: PumpState): boolean {
  return state.drv.enabled && state.drv.bypassGpm > 0;
}

/**
 * Get DRV status description for UI display
 * 
 * @param state - Current pump state
 * @param currentPDP - Current pump discharge pressure
 * @returns Status string
 */
export function getDRVStatus(state: PumpState, currentPDP: number): string {
  if (!state.drv.enabled) {
    return 'DRV Disabled';
  }
  
  if (!state.interlocks.engaged) {
    return 'DRV Standby (Pump Off)';
  }
  
  const overpressure = currentPDP - state.drv.setpointPsi;
  
  if (overpressure <= 0) {
    return `DRV Armed (${state.drv.setpointPsi} PSI)`;
  }
  
  if (state.drv.bypassGpm > 0) {
    return `DRV Active (Bypass: ${Math.round(state.drv.bypassGpm)} GPM)`;
  }
  
  return `DRV Engaging...`;
}