import { describe, it, expect } from 'vitest';
import {
  validateGovernorMode,
  getGovernorWarnings,
  shouldAutoSwitchMode,
  type GovernorState
} from './governor';

describe('Governor Mode Validation', () => {
  it('allows RPM mode for drafting', () => {
    const result = validateGovernorMode('RPM', 'draft', 150);
    expect(result.valid).toBe(true);
    expect(result.warning).toContain('No surge protection');
  });
  
  it('allows RPM mode for PDP > 250 PSI', () => {
    const result = validateGovernorMode('RPM', 'hydrant', 280);
    expect(result.valid).toBe(true);
    expect(result.warning).toContain('High pressure');
  });
  
  it('rejects RPM mode for normal operations', () => {
    const result = validateGovernorMode('RPM', 'hydrant', 150);
    expect(result.valid).toBe(false);
    expect(result.autoSwitch).toBe('PRESSURE');
  });
  
  it('allows PSI mode for normal operations', () => {
    const result = validateGovernorMode('PRESSURE', 'hydrant', 150);
    expect(result.valid).toBe(true);
    expect(result.warning).toBeUndefined();
  });
  
  it('rejects PSI mode for PDP > 250 PSI', () => {
    const result = validateGovernorMode('PRESSURE', 'hydrant', 280);
    expect(result.valid).toBe(false);
    expect(result.autoSwitch).toBe('RPM');
  });
});

describe('Governor Warnings', () => {
  const baseGovernor: GovernorState = {
    mode: 'PRESSURE',
    targetRPM: 1500,
    targetPDP: 150,
    pidState: {
      ePrev: 0,
      integral: 0
    }
  };
  
  it('warns about no surge protection in RPM mode', () => {
    const governor = { ...baseGovernor, mode: 'RPM' as const };
    const warnings = getGovernorWarnings(governor, 150, 'hydrant');
    
    expect(warnings).toContain('NO SURGE PROTECTION');
  });
  
  it('warns about high pressure in PSI mode', () => {
    const warnings = getGovernorWarnings(baseGovernor, 280, 'hydrant');
    
    expect(warnings.some(w => w.includes('HIGH PRESSURE'))).toBe(true);
  });
  
  it('warns about overpressure at 400 PSI', () => {
    const warnings = getGovernorWarnings(baseGovernor, 405, 'hydrant');
    
    expect(warnings.some(w => w.includes('OVERPRESSURE'))).toBe(true);
  });
  
  it('warns when approaching 400 PSI limit', () => {
    const warnings = getGovernorWarnings(baseGovernor, 375, 'hydrant');
    
    expect(warnings.some(w => w.includes('Approaching 400 PSI'))).toBe(true);
  });
});

describe('Auto-Switch Logic', () => {
  it('switches to RPM when PDP > 250 PSI in PSI mode', () => {
    const result = shouldAutoSwitchMode('PRESSURE', 280, 'hydrant');
    
    expect(result.shouldSwitch).toBe(true);
    expect(result.newMode).toBe('RPM');
    expect(result.reason).toContain('250 PSI');
  });
  
  it('switches to PSI when PDP < 240 PSI in RPM mode (not drafting)', () => {
    const result = shouldAutoSwitchMode('RPM', 220, 'hydrant');
    
    expect(result.shouldSwitch).toBe(true);
    expect(result.newMode).toBe('PRESSURE');
  });
  
  it('does not auto-switch when drafting', () => {
    const result = shouldAutoSwitchMode('RPM', 220, 'draft');
    
    expect(result.shouldSwitch).toBe(false);
  });
  
  it('does not switch when conditions are appropriate', () => {
    const result = shouldAutoSwitchMode('PRESSURE', 150, 'hydrant');
    
    expect(result.shouldSwitch).toBe(false);
  });
});