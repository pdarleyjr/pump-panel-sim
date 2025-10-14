/**
 * Governor system for fire pump engine control
 * Implements RPM and PRESSURE modes with PID control
 */

import type { PumpState } from './model';

export type GovernorMode = 'RPM' | 'PRESSURE';

/**
 * Governor state including mode, targets, and PID controller state
 */
export interface GovernorState {
  /** Current operating mode */
  mode: GovernorMode;
  
  /** Target RPM for RPM mode */
  targetRPM: number;
  
  /** Target PDP for PRESSURE mode */
  targetPDP: number;
  
  /** PID controller internal state */
  pidState: {
    /** Previous error term */
    ePrev: number;
    /** Integral accumulator */
    integral: number;
  };
}

/**
 * Create initial governor state
 * 
 * @returns Initial governor state with defaults
 */
export function createGovernor(): GovernorState {
  return {
    mode: 'PRESSURE',
    targetRPM: 1500,
    targetPDP: 150,
    pidState: { ePrev: 0, integral: 0 }
  };
}

/**
 * PID controller for PRESSURE mode
 * Automatically adjusts engine RPM to maintain target discharge pressure
 * 
 * @param state - Current pump state
 * @param governor - Governor state
 * @param dt - Time step in seconds
 * @returns New engine RPM
 */
export function updatePressureGovernor(
  state: PumpState,
  governor: GovernorState,
  dt: number
): number {
  if (governor.mode !== 'PRESSURE') return state.runtime.rpm;
  
  // PID tuning parameters for pressure control
  // These are tuned for smooth, stable pressure regulation
  const Kp = 0.6;   // Proportional gain
  const Ki = 0.08;  // Integral gain
  const Kd = 0.02;  // Derivative gain
  
  // Calculate error (target - actual)
  const error = governor.targetPDP - (state.dischargePsi || 0);
  
  // Integral term with anti-windup
  governor.pidState.integral += error * dt;
  // Clamp integral to prevent windup
  governor.pidState.integral = Math.max(-1000, Math.min(1000, governor.pidState.integral));
  
  // Derivative term
  const derivative = (error - governor.pidState.ePrev) / dt;
  governor.pidState.ePrev = error;
  
  // PID output: change in RPM
  const deltaRPM = Kp * error + Ki * governor.pidState.integral + Kd * derivative;
  
  // Apply change to current RPM
  const newRPM = state.runtime.rpm + deltaRPM;
  
  // Clamp RPM to realistic engine limits
  // Idle: 700 RPM, Max governed: 2200 RPM
  return Math.max(700, Math.min(2200, newRPM));
}

/**
 * RPM mode simply maintains set RPM
 * Operator manually controls engine speed
 * 
 * @param state - Current pump state (unused, for consistency)
 * @param governor - Governor state
 * @returns Target RPM
 */
export function updateRPMGovernor(
  state: PumpState,
  governor: GovernorState
): number {
  void state; // Unused parameter
  if (governor.mode !== 'RPM') return state.runtime.rpm;
  return governor.targetRPM;
}

/**
 * Switch governor mode and reset PID state
 * 
 * @param governor - Current governor state
 * @param newMode - New mode to switch to
 * @returns Updated governor state
 */
export function switchGovernorMode(
  governor: GovernorState,
  newMode: GovernorMode
): GovernorState {
  return {
    ...governor,
    mode: newMode,
    pidState: { ePrev: 0, integral: 0 } // Reset PID state on mode change
  };
}

/**
 * Set target RPM for RPM mode
 * 
 * @param governor - Current governor state
 * @param targetRPM - New target RPM (700-2200)
 * @returns Updated governor state
 */
export function setTargetRPM(
  governor: GovernorState,
  targetRPM: number
): GovernorState {
  // Clamp to valid range
  const clampedRPM = Math.max(700, Math.min(2200, targetRPM));
  
  return {
    ...governor,
    targetRPM: clampedRPM
  };
}

/**
 * Set target PDP for PRESSURE mode
 * 
 * @param governor - Current governor state
 * @param targetPDP - New target PDP in PSI (50-250)
 * @returns Updated governor state
 */
export function setTargetPDP(
  governor: GovernorState,
  targetPDP: number
): GovernorState {
  // Clamp to valid range
  const clampedPDP = Math.max(50, Math.min(250, targetPDP));
  
  return {
    ...governor,
    targetPDP: clampedPDP
  };
}

/**
 * Get governor status description for UI
 * 
 * @param state - Current pump state
 * @param governor - Governor state
 * @returns Status description string
 */
export function getGovernorStatus(
  state: PumpState,
  governor: GovernorState
): string {
  if (!state.interlocks.engaged) {
    return 'Governor Standby';
  }
  
  if (governor.mode === 'RPM') {
    return `RPM Mode: ${Math.round(state.runtime.rpm)} / ${governor.targetRPM} RPM`;
  }
  
  if (governor.mode === 'PRESSURE') {
    const currentPDP = state.dischargePsi || 0;
    return `Pressure Mode: ${Math.round(currentPDP)} / ${governor.targetPDP} PSI`;
  }
  
  return 'Unknown Mode';
}

/**
 * Check if governor is maintaining target within tolerance
 * 
 * @param state - Current pump state
 * @param governor - Governor state
 * @param tolerance - Acceptable deviation (default 5% for RPM, 5 PSI for pressure)
 * @returns True if within tolerance
 */
export function isGovernorOnTarget(
  state: PumpState,
  governor: GovernorState,
  tolerance?: number
): boolean {
  if (!state.interlocks.engaged) return false;
  
  if (governor.mode === 'RPM') {
    const tol = tolerance ?? governor.targetRPM * 0.05; // 5% tolerance
    return Math.abs(state.runtime.rpm - governor.targetRPM) <= tol;
  }
  
  if (governor.mode === 'PRESSURE') {
    const tol = tolerance ?? 5; // 5 PSI tolerance
    const currentPDP = state.dischargePsi || 0;
    return Math.abs(currentPDP - governor.targetPDP) <= tol;
  }
  
  return false;
}

/**
 * Validate governor mode selection based on operating conditions
 *
 * Blueprint ref: Line 18, 237
 * - PSI mode: Normal operations (provides surge protection)
 * - RPM mode: Only for drafting OR PDP > 250 PSI
 */
export interface ModeValidation {
  valid: boolean;
  warning?: string;
  autoSwitch?: 'PRESSURE' | 'RPM';
}

export function validateGovernorMode(
  requestedMode: GovernorMode,
  waterSource: 'tank' | 'hydrant' | 'draft' | 'relay',
  currentPDP: number
): ModeValidation {
  // RPM mode restrictions
  if (requestedMode === 'RPM') {
    // RPM mode allowed for drafting
    if (waterSource === 'draft') {
      return {
        valid: true,
        warning: 'RPM MODE: No surge protection. Monitor pressure closely.'
      };
    }
    
    // RPM mode allowed for high pressure ops (>250 PSI)
    if (currentPDP > 250) {
      return {
        valid: true,
        warning: 'RPM MODE: High pressure operation. No surge protection.'
      };
    }
    
    // Otherwise, RPM mode not recommended
    return {
      valid: false,
      warning: 'RPM mode only for drafting or PDP > 250 PSI. Use PSI mode for surge protection.',
      autoSwitch: 'PRESSURE'
    };
  }
  
  // PSI mode restrictions
  if (requestedMode === 'PRESSURE') {
    // PSI mode NOT recommended above 250 PSI (governor may hunt)
    if (currentPDP > 250) {
      return {
        valid: false,
        warning: 'PDP > 250 PSI: Switch to RPM mode to prevent governor hunting.',
        autoSwitch: 'RPM'
      };
    }
    
    // PSI mode is default for normal operations
    return {
      valid: true
    };
  }
  
  return { valid: true };
}

/**
 * Get operational warnings for current governor state
 *
 * Blueprint ref: Lines 217-219
 */
export function getGovernorWarnings(
  governor: GovernorState,
  currentPDP: number,
  waterSource: 'tank' | 'hydrant' | 'draft' | 'relay'
): string[] {
  const warnings: string[] = [];
  
  // RPM mode warning
  if (governor.mode === 'RPM') {
    warnings.push('NO SURGE PROTECTION');
    
    // Additional context
    if (waterSource !== 'draft' && currentPDP <= 250) {
      warnings.push('Consider switching to PSI mode');
    }
  }
  
  // High PDP in PSI mode
  if (governor.mode === 'PRESSURE' && currentPDP > 250) {
    warnings.push('HIGH PRESSURE: Switch to RPM mode');
  }
  
  // Overpressure warning
  if (currentPDP > 400) {
    warnings.push('DANGER: OVERPRESSURE (400 PSI MAX)');
  } else if (currentPDP > 350) {
    warnings.push('CAUTION: Approaching 400 PSI limit');
  }
  
  // High setpoint warning
  if (governor.mode === 'PRESSURE' && governor.targetPDP > 250) {
    warnings.push('High setpoint: Monitor closely');
  }
  
  return warnings;
}

/**
 * Check if mode should auto-switch based on conditions
 *
 * Blueprint ref: Line 237
 */
export function shouldAutoSwitchMode(
  currentMode: GovernorMode,
  currentPDP: number,
  waterSource: 'tank' | 'hydrant' | 'draft' | 'relay'
): { shouldSwitch: boolean; newMode?: GovernorMode; reason?: string } {
  // Auto-switch to RPM when PDP exceeds 250 PSI in PSI mode
  if (currentMode === 'PRESSURE' && currentPDP > 250) {
    return {
      shouldSwitch: true,
      newMode: 'RPM',
      reason: 'PDP > 250 PSI: Automatic switch to RPM mode to prevent governor hunting'
    };
  }
  
  // Auto-switch to PSI when PDP drops below 240 PSI in RPM mode
  // (if not drafting)
  if (currentMode === 'RPM' && currentPDP < 240 && waterSource !== 'draft') {
    return {
      shouldSwitch: true,
      newMode: 'PRESSURE',
      reason: 'PDP < 240 PSI: Automatic switch to PSI mode for surge protection'
    };
  }
  
  return { shouldSwitch: false };
}