import { describe, it, expect } from 'vitest';
import { intakeGauge, dischargeGauge, getPumpStatus } from './gauges';

describe('Intake Gauge', () => {
  it('shows 40-50 PSI baseline when Tank-to-Pump open at idle', () => {
    const result = intakeGauge('tank', 0, true, true);
    
    expect(result.psi).toBeGreaterThanOrEqual(40);
    expect(result.psi).toBeLessThanOrEqual(50);
  });
  
  it('shows zero when Tank-to-Pump closed', () => {
    const result = intakeGauge('tank', 45, false, true);
    
    expect(result.psi).toBe(0);
    expect(result.warning).toContain('Open Tank-to-Pump');
  });
  
  it('warns about low residual pressure from hydrant', () => {
    const result = intakeGauge('hydrant', 15, false, true);
    
    expect(result.warning).toContain('LOW RESIDUAL');
  });
  
  it('shows vacuum in inHg when drafting unprimed', () => {
    const result = intakeGauge('draft', -22, false, false);
    
    expect(result.vacuumInHg).toBeGreaterThan(40); // -22 PSI ≈ 44.8 inHg
    expect(result.warning).toContain('PRIMING');
  });
  
  it('shows slight vacuum when drafting primed', () => {
    const result = intakeGauge('draft', -5, false, true);
    
    expect(result.vacuumInHg).toBeGreaterThan(0);
    expect(result.vacuumInHg).toBeLessThan(15);
  });
  
  it('warns about max lift exceeded', () => {
    const result = intakeGauge('draft', -25, false, true);
    
    expect(result.warning).toContain('MAX LIFT EXCEEDED');
  });
});

describe('Discharge Gauge', () => {
  it('shows normal pressure without warning', () => {
    const result = dischargeGauge(150);
    
    expect(result.psi).toBe(150);
    expect(result.warning).toBeUndefined();
  });
  
  it('warns about high pressure above 250 PSI', () => {
    const result = dischargeGauge(280);
    
    expect(result.warning).toContain('HIGH PRESSURE');
  });
  
  it('warns when approaching 400 PSI limit', () => {
    const result = dischargeGauge(375);
    
    expect(result.warning).toContain('Approaching 400 PSI');
  });
  
  it('clamps display at 400 PSI and shows danger warning', () => {
    const result = dischargeGauge(450);
    
    expect(result.psi).toBe(400);
    expect(result.warning).toContain('OVERPRESSURE');
  });
});

describe('Pump Status', () => {
  const mockState = {
    runtime: { governor: 'PRESSURE' as const, rpm: 1800 },
    waterSource: 'hydrant' as const,
    tankToPumpOpen: false,
    interlocks: { engaged: true, primed: true },
    dischargePsi: 148,
    intakePressurePsi: 50,
    runtimeRpm: 1820,
    totalFlowGpm: 500,
    warnings: new Set(['Test warning'])
  };
  
  it('returns comprehensive pump status', () => {
    const status = getPumpStatus(mockState);
    
    expect(status.mode).toBe('PSI');
    expect(status.setpoint).toBe(148);
    expect(status.setpointUnit).toBe('PSI');
    expect(status.actualPDP).toBe(148);
    expect(status.actualRPM).toBe(1800);
    expect(status.intakePsi).toBe(50);
    expect(status.totalFlowGpm).toBe(500);
  });
  
  it('includes vacuum when drafting', () => {
    const draftState = {
      ...mockState,
      waterSource: 'draft' as const,
      intakePressurePsi: -10
    };
    
    const status = getPumpStatus(draftState);
    
    expect(status.intakeVacuumInHg).toBeGreaterThan(0);
  });
  
  it('aggregates warnings from multiple sources', () => {
    const warningState = {
      ...mockState,
      dischargePsi: 375, // Triggers discharge warning
      warnings: new Set(['Warning 1', 'Warning 2'])
    };
    
    const status = getPumpStatus(warningState);
    
    expect(status.warnings.length).toBeGreaterThan(2);
  });
});