/**
 * Test suite for NFPA 1901 safety interlocks
 * Verifies compliance with fire service training standards
 */

import { describe, it, expect } from 'vitest';
import {
  canAdjustThrottle,
  canOpenDischarge,
  canChangeFoam,
  canSwitchGovernor,
  getInterlockWarning,
  validateState,
} from './interlocks';
import type { SimState } from './state';
import { createInitialState } from './state';

describe('Pump Engagement Interlocks (NFPA 5.11)', () => {
  it('should prevent throttle adjustment when pump not engaged', () => {
    const state = createInitialState();
    state.pump.engaged = false;
    
    expect(canAdjustThrottle(state)).toBe(false);
    expect(getInterlockWarning('throttle', state)).toBe('Pump must be engaged to adjust throttle');
  });

  it('should allow throttle adjustment when pump engaged', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    
    expect(canAdjustThrottle(state)).toBe(true);
    expect(getInterlockWarning('throttle', state)).toBeNull();
  });

  it('should prevent discharge valve opening when pump not engaged', () => {
    const state = createInitialState();
    state.pump.engaged = false;
    
    expect(canOpenDischarge(state)).toBe(false);
    expect(getInterlockWarning('discharge', state)).toBe('Pump must be engaged to open discharges');
  });

  it('should allow discharge valve opening when pump engaged', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    
    expect(canOpenDischarge(state)).toBe(true);
    expect(getInterlockWarning('discharge', state)).toBeNull();
  });
});

describe('Discharge System Interlocks (NFPA 5.8)', () => {
  it('should warn if discharges open but pump not engaged', () => {
    const state = createInitialState();
    state.pump.engaged = false;
    state.discharges.xlay1.open = 0.5;
    
    const warnings = validateState(state);
    expect(warnings).toContain('Discharge valves open but pump not engaged');
  });

  it('should not warn if discharges open and pump engaged', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.discharges.xlay1.open = 0.5;
    
    const warnings = validateState(state);
    expect(warnings).not.toContain('Discharge valves open but pump not engaged');
  });
});

describe('Foam System Interlocks (NFPA 5.14)', () => {
  it('should prevent foam adjustment when pump not engaged', () => {
    const state = createInitialState();
    state.pump.engaged = false;
    state.discharges.xlay1.open = 0.5;
    
    expect(canChangeFoam(state, 'xlay1')).toBe(false);
  });

  it('should prevent foam adjustment when discharge closed', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.discharges.xlay1.open = 0;
    
    expect(canChangeFoam(state, 'xlay1')).toBe(false);
  });

  it('should allow foam adjustment when pump engaged and discharge open', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.discharges.xlay1.open = 0.5;
    
    expect(canChangeFoam(state, 'xlay1')).toBe(true);
  });

  it('should warn when foam enabled but tank empty', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.pump.foamTankGallons = 0;
    state.discharges.xlay1.open = 0.5;
    state.discharges.xlay1.foamPct = 0.6;
    
    const warnings = validateState(state);
    expect(warnings).toContain('Foam concentrate depleted');
  });

  it('should not warn when foam enabled with adequate concentrate', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.pump.foamTankGallons = 20;
    state.discharges.xlay1.open = 0.5;
    state.discharges.xlay1.foamPct = 0.6;
    
    const warnings = validateState(state);
    expect(warnings).not.toContain('Foam concentrate depleted');
  });
});

describe('Governor Mode Interlocks (NFPA 5.11)', () => {
  it('should allow switching to RPM mode when drafting', () => {
    const state = createInitialState();
    state.pump.governor = 'PRESSURE';
    state.intakes.ldh_driver.source = 'draft';
    
    expect(canSwitchGovernor(state)).toBe(true);
  });

  it('should allow switching to RPM mode at high pressure (>250 PSI)', () => {
    const state = createInitialState();
    state.pump.governor = 'PRESSURE';
    state.pump.pdp = 260;
    
    expect(canSwitchGovernor(state)).toBe(true);
  });

  it('should prevent switching to RPM mode in normal conditions', () => {
    const state = createInitialState();
    state.pump.governor = 'PRESSURE';
    state.intakes.ldh_driver.source = 'hydrant';
    state.pump.pdp = 150;
    
    expect(canSwitchGovernor(state)).toBe(false);
    expect(getInterlockWarning('governor', state)).toBe(
      'Can only switch to RPM mode when drafting or at high pressure (>250 PSI)'
    );
  });

  it('should always allow switching back to PRESSURE mode', () => {
    const state = createInitialState();
    state.pump.governor = 'RPM';
    
    expect(canSwitchGovernor(state)).toBe(true);
  });
});

describe('Priming System Interlocks (NFPA 5.9)', () => {
  it('should warn when drafting without primer active', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.intakes.ldh_driver.source = 'draft';
    state.primerActive = false;
    state.primed = false;
    
    const warnings = validateState(state);
    expect(warnings).toContain('Drafting without primer - pump may not flow');
  });

  it('should not warn when primer is active', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.intakes.ldh_driver.source = 'draft';
    state.primerActive = true;
    state.primed = false;
    
    const warnings = validateState(state);
    expect(warnings).not.toContain('Drafting without primer - pump may not flow');
  });

  it('should not warn when already primed', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.intakes.ldh_driver.source = 'draft';
    state.primerActive = false;
    state.primed = true;
    
    const warnings = validateState(state);
    expect(warnings).not.toContain('Drafting without primer - pump may not flow');
  });
});

describe('Intake System Interlocks (NFPA 5.7)', () => {
  it('should warn when no water source available', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.tankToPumpOpen = false;
    state.intakes.ldh_driver.source = 'tank';
    state.intakes.ldh_officer.source = 'tank';
    
    const warnings = validateState(state);
    expect(warnings).toContain('No water source available');
  });

  it('should not warn when tank-to-pump valve is open', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.tankToPumpOpen = true;
    state.intakes.ldh_driver.source = 'tank';
    
    const warnings = validateState(state);
    expect(warnings).not.toContain('No water source available');
  });

  it('should not warn when on hydrant supply', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.tankToPumpOpen = false;
    state.intakes.ldh_driver.source = 'hydrant';
    
    const warnings = validateState(state);
    expect(warnings).not.toContain('No water source available');
  });

  it('should not warn when on relay supply', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.tankToPumpOpen = false;
    state.intakes.ldh_driver.source = 'relay';
    
    const warnings = validateState(state);
    expect(warnings).not.toContain('No water source available');
  });
});

describe('Multiple Interlock Conditions', () => {
  it('should return multiple warnings when multiple conditions violated', () => {
    const state = createInitialState();
    state.pump.engaged = false;
    state.pump.foamTankGallons = 0;
    state.tankToPumpOpen = false;
    state.discharges.xlay1.open = 0.5;
    state.discharges.xlay1.foamPct = 0.6;
    
    const warnings = validateState(state);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings).toContain('Discharge valves open but pump not engaged');
    expect(warnings).toContain('Foam concentrate depleted');
  });

  it('should return empty array when all conditions are safe', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.tankToPumpOpen = true;
    state.pump.foamTankGallons = 20;
    state.primed = true;
    
    const warnings = validateState(state);
    expect(warnings).toEqual([]);
  });
});

describe('Safety Interlock Edge Cases', () => {
  it('should handle invalid discharge ID in foam check', () => {
    const state = createInitialState();
    
    expect(canChangeFoam(state, 'invalid_id')).toBe(false);
  });

  it('should handle zero foam percentage as no foam', () => {
    const state = createInitialState();
    state.pump.engaged = true;
    state.discharges.xlay1.open = 0.5;
    state.discharges.xlay1.foamPct = 0;
    
    const warnings = validateState(state);
    expect(warnings).not.toContain('Foam concentrate depleted');
  });

  it('should handle partially open discharge valves', () => {
    const state = createInitialState();
    state.pump.engaged = false;
    state.discharges.xlay1.open = 0.1; // 10% open
    
    const warnings = validateState(state);
    expect(warnings).toContain('Discharge valves open but pump not engaged');
  });

  it('should handle multiple open discharge lines', () => {
    const state = createInitialState();
    state.pump.engaged = false;
    state.discharges.xlay1.open = 0.5;
    state.discharges.xlay2.open = 0.7;
    state.discharges.trash.open = 0.3;
    
    const warnings = validateState(state);
    expect(warnings).toContain('Discharge valves open but pump not engaged');
  });
});

describe('NFPA 1901 Compliance Documentation', () => {
  it('should document interlock behavior for training purposes', () => {
    const state = createInitialState();
    
    // This test documents the expected interlock behavior per NFPA 1901
    // Section 5.11: Pump Operation Interlocks
    
    // 1. Pump must be engaged before any operations
    expect(canAdjustThrottle(state)).toBe(false);
    expect(canOpenDischarge(state)).toBe(false);
    
    // 2. Enable pump engagement
    state.pump.engaged = true;
    
    // 3. Now operations should be allowed
    expect(canAdjustThrottle(state)).toBe(true);
    expect(canOpenDischarge(state)).toBe(true);
    
    // 4. Foam requires both pump engaged AND discharge open
    state.discharges.xlay1.open = 0;
    expect(canChangeFoam(state, 'xlay1')).toBe(false);
    
    state.discharges.xlay1.open = 0.5;
    expect(canChangeFoam(state, 'xlay1')).toBe(true);
    
    // 5. Governor mode restrictions
    state.pump.governor = 'PRESSURE';
    state.pump.pdp = 150;
    state.intakes.ldh_driver.source = 'hydrant';
    
    // Cannot switch to RPM mode in normal conditions
    expect(canSwitchGovernor(state)).toBe(false);
    
    // Can switch when pressure is high
    state.pump.pdp = 260;
    expect(canSwitchGovernor(state)).toBe(true);
    
    // Can switch when drafting
    state.pump.pdp = 150;
    state.intakes.ldh_driver.source = 'draft';
    expect(canSwitchGovernor(state)).toBe(true);
  });
});