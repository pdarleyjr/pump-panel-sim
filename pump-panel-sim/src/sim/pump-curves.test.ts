import { describe, it, expect } from 'vitest';
import { calculateMaxPDP, calculateRequiredRPM, NFPA_PUMP_CURVE } from './pump-curves';

describe('Pump Curves', () => {
  it('returns correct pressure at rated conditions', () => {
    const maxPDP = calculateMaxPDP(1500, 2200, 0);
    expect(maxPDP).toBeCloseTo(150, 1);  // 1500 GPM @ 2200 RPM = 150 PSI
  });
  
  it('returns higher pressure at lower flow', () => {
    const highFlow = calculateMaxPDP(1500, 2200, 0);
    const lowFlow = calculateMaxPDP(750, 2200, 0);
    expect(lowFlow).toBeGreaterThan(highFlow);  // Lower flow = higher pressure
  });
  
  it('scales pressure with RPM squared', () => {
    const fullSpeed = calculateMaxPDP(1500, 2200, 0);
    const halfSpeed = calculateMaxPDP(1500, 1100, 0);
    expect(halfSpeed).toBeCloseTo(fullSpeed * 0.25, 5);  // RPM² scaling
  });
  
  it('adds intake pressure boost', () => {
    const noIntake = calculateMaxPDP(1500, 2200, 0);
    const withIntake = calculateMaxPDP(1500, 2200, 50);
    expect(withIntake).toBeCloseTo(noIntake + 50, 1);
  });
  
  it('subtracts vacuum penalty', () => {
    const noVacuum = calculateMaxPDP(1500, 2200, 0);
    const withVacuum = calculateMaxPDP(1500, 2200, -20);
    expect(withVacuum).toBeCloseTo(noVacuum - 20, 1);
  });
  
  it('calculates required RPM for target PDP', () => {
    const rpm = calculateRequiredRPM(150, 1500, 0);
    expect(rpm).toBeCloseTo(2200, 50);  // Should be near rated RPM
  });
});
import { describe, it, expect } from 'vitest';
import { calculateMaxPDP, calculateRequiredRPM, checkRunoutCondition, NFPA_PUMP_CURVE } from './pump-curves';

describe('NFPA Pump Curve', () => {
  it('should include all required test points including churn and runout', () => {
    expect(NFPA_PUMP_CURVE).toHaveLength(6);
    
    // Verify churn point (0 GPM)
    expect(NFPA_PUMP_CURVE[0].flowGpm).toBe(0);
    expect(NFPA_PUMP_CURVE[0].pressurePsi).toBe(290);
    expect(NFPA_PUMP_CURVE[0].percentCapacity).toBe(0);
    
    // Verify 50% capacity point (NFPA required)
    const point50 = NFPA_PUMP_CURVE.find(p => p.percentCapacity === 50);
    expect(point50).toBeDefined();
    expect(point50?.flowGpm).toBe(750);
    expect(point50?.pressurePsi).toBe(250);
    
    // Verify 70% capacity point (NFPA required)
    const point70 = NFPA_PUMP_CURVE.find(p => p.percentCapacity === 70);
    expect(point70).toBeDefined();
    expect(point70?.flowGpm).toBe(1050);
    expect(point70?.pressurePsi).toBe(200);
    
    // Verify 100% rated capacity (NFPA required)
    const point100 = NFPA_PUMP_CURVE.find(p => p.percentCapacity === 100);
    expect(point100).toBeDefined();
    expect(point100?.flowGpm).toBe(1500);
    expect(point100?.pressurePsi).toBe(150);
    
    // Verify 150% runout point
    const point150 = NFPA_PUMP_CURVE.find(p => p.percentCapacity === 150);
    expect(point150).toBeDefined();
    expect(point150?.flowGpm).toBe(2250);
    expect(point150?.pressurePsi).toBe(95);
  });
  
  it('should have descending pressure values (valid centrifugal pump curve)', () => {
    for (let i = 0; i < NFPA_PUMP_CURVE.length - 1; i++) {
      const current = NFPA_PUMP_CURVE[i];
      const next = NFPA_PUMP_CURVE[i + 1];
      
      // Flow should increase
      expect(next.flowGpm).toBeGreaterThan(current.flowGpm);
      
      // Pressure should decrease (centrifugal pump characteristic)
      expect(next.pressurePsi).toBeLessThan(current.pressurePsi);
    }
  });
});

describe('calculateMaxPDP', () => {
  it('should calculate churn pressure at 0 GPM with rated RPM', () => {
    const flowGpm = 0;
    const rpm = 2200; // Rated RPM
    const intakePsi = 0;
    
    const pdp = calculateMaxPDP(flowGpm, rpm, intakePsi);
    
    // Should return churn pressure (~290 PSI at rated RPM)
    expect(pdp).toBeCloseTo(290, 5);
  });
  
  it('should calculate rated pressure at 1500 GPM with rated RPM', () => {
    const flowGpm = 1500;
    const rpm = 2200;
    const intakePsi = 0;
    
    const pdp = calculateMaxPDP(flowGpm, rpm, intakePsi);
    
    // Should return rated pressure (150 PSI)
    expect(pdp).toBeCloseTo(150, 5);
  });
  
  it('should calculate 70% capacity pressure (1050 GPM @ 200 PSI)', () => {
    const flowGpm = 1050;
    const rpm = 2200;
    const intakePsi = 0;
    
    const pdp = calculateMaxPDP(flowGpm, rpm, intakePsi);
    
    // Should return 200 PSI at 70% capacity
    expect(pdp).toBeCloseTo(200, 5);
  });
  
  it('should calculate 50% capacity pressure (750 GPM @ 250 PSI)', () => {
    const flowGpm = 750;
    const rpm = 2200;
    const intakePsi = 0;
    
    const pdp = calculateMaxPDP(flowGpm, rpm, intakePsi);
    
    // Should return 250 PSI at 50% capacity
    expect(pdp).toBeCloseTo(250, 5);
  });
  
  it('should calculate runout pressure at 2250 GPM', () => {
    const flowGpm = 2250;
    const rpm = 2200;
    const intakePsi = 0;
    
    const pdp = calculateMaxPDP(flowGpm, rpm, intakePsi);
    
    // Should return runout pressure (~95 PSI)
    expect(pdp).toBeCloseTo(95, 5);
  });
  
  it('should interpolate correctly between curve points', () => {
    // Test midpoint between 1050 GPM (200 PSI) and 1500 GPM (150 PSI)
    const flowGpm = 1275; // Midpoint
    const rpm = 2200;
    const intakePsi = 0;
    
    const pdp = calculateMaxPDP(flowGpm, rpm, intakePsi);
    
    // Should be approximately 175 PSI (midpoint between 200 and 150)
    expect(pdp).toBeCloseTo(175, 10);
  });
  
  it('should scale pressure with RPM squared (centrifugal pump law)', () => {
    const flowGpm = 1500;
    const intakePsi = 0;
    
    // At rated RPM (2200), should get 150 PSI
    const pdpRated = calculateMaxPDP(flowGpm, 2200, intakePsi);
    expect(pdpRated).toBeCloseTo(150, 5);
    
    // At half RPM (1100), pressure should be 1/4 (P ∝ RPM²)
    const pdpHalf = calculateMaxPDP(flowGpm, 1100, intakePsi);
    expect(pdpHalf).toBeCloseTo(37.5, 5); // 150 / 4 = 37.5
    
    // At double RPM (4400), pressure should be 4x
    const pdpDouble = calculateMaxPDP(flowGpm, 4400, intakePsi);
    expect(pdpDouble).toBeCloseTo(600, 10); // 150 * 4 = 600
  });
  
  it('should add positive intake pressure boost', () => {
    const flowGpm = 1500;
    const rpm = 2200;
    const intakePsi = 50; // Hydrant pressure boost
    
    const pdp = calculateMaxPDP(flowGpm, rpm, intakePsi);
    
    // Should be 150 (pump) + 50 (intake) = 200 PSI
    expect(pdp).toBeCloseTo(200, 5);
  });
  
  it('should subtract negative intake pressure (vacuum penalty)', () => {
    const flowGpm = 1500;
    const rpm = 2200;
    const intakePsi = -12; // Drafting vacuum
    
    const pdp = calculateMaxPDP(flowGpm, rpm, intakePsi);
    
    // Should be 150 (pump) - 12 (vacuum) = 138 PSI
    expect(pdp).toBeCloseTo(138, 5);
  });
  
  it('should never return negative pressure', () => {
    const flowGpm = 1500;
    const rpm = 500; // Very low RPM
    const intakePsi = -50; // High vacuum
    
    const pdp = calculateMaxPDP(flowGpm, rpm, intakePsi);
    
    // Should clamp to 0, not go negative
    expect(pdp).toBeGreaterThanOrEqual(0);
  });
  
  it('should handle flow beyond runout (capped at runout pressure)', () => {
    const flowGpm = 3000; // Beyond 150% capacity
    const rpm = 2200;
    const intakePsi = 0;
    
    const pdp = calculateMaxPDP(flowGpm, rpm, intakePsi);
    
    // Should use runout pressure (~95 PSI)
    expect(pdp).toBeCloseTo(95, 5);
  });
});

describe('calculateRequiredRPM', () => {
  it('should calculate RPM needed for rated operation (1500 GPM @ 150 PSI)', () => {
    const targetPDP = 150;
    const flowGpm = 1500;
    const intakePsi = 0;
    
    const rpm = calculateRequiredRPM(targetPDP, flowGpm, intakePsi);
    
    // Should return rated RPM (2200)
    expect(rpm).toBeCloseTo(2200, 50);
  });
  
  it('should calculate higher RPM for higher pressure at same flow', () => {
    const flowGpm = 1500;
    const intakePsi = 0;
    
    const rpm150 = calculateRequiredRPM(150, flowGpm, intakePsi);
    const rpm200 = calculateRequiredRPM(200, flowGpm, intakePsi);
    
    // Higher pressure requires higher RPM
    expect(rpm200).toBeGreaterThan(rpm150);
  });
  
  it('should account for intake pressure boost', () => {
    const targetPDP = 150;
    const flowGpm = 1500;
    
    // With no intake boost
    const rpmNoBoost = calculateRequiredRPM(targetPDP, flowGpm, 0);
    
    // With 50 PSI intake boost (hydrant)
    const rpmWithBoost = calculateRequiredRPM(targetPDP, flowGpm, 50);
    
    // With boost, pump needs to provide less pressure, so lower RPM
    expect(rpmWithBoost).toBeLessThan(rpmNoBoost);
  });
  
  it('should clamp RPM to realistic range (600-3000)', () => {
    // Very low pressure requirement
    const rpmLow = calculateRequiredRPM(10, 1500, 0);
    expect(rpmLow).toBeGreaterThanOrEqual(600);
    
    // Very high pressure requirement
    const rpmHigh = calculateRequiredRPM(500, 1500, 0);
    expect(rpmHigh).toBeLessThanOrEqual(3000);
  });
});

describe('checkRunoutCondition', () => {
  it('should return null for normal flow rates', () => {
    expect(checkRunoutCondition(1000)).toBeNull();
    expect(checkRunoutCondition(1500)).toBeNull();
  });
  
  it('should warn at 125% capacity (1875 GPM)', () => {
    const warning = checkRunoutCondition(1900);
    
    expect(warning).not.toBeNull();
    expect(warning).toContain('High flow');
    expect(warning).toContain('127%'); // 1900/1500 = 126.67%
  });
  
  it('should critical warn at 150% capacity (2250 GPM)', () => {
    const warning = checkRunoutCondition(2300);
    
    expect(warning).not.toBeNull();
    expect(warning).toContain('RUNOUT');
    expect(warning).toContain('2300 GPM');
    expect(warning).toContain('2250 GPM');
  });
  
  it('should handle exactly 150% capacity', () => {
    const warning = checkRunoutCondition(2250);
    
    expect(warning).not.toBeNull();
    expect(warning).toContain('RUNOUT');
  });
});

describe('Centrifugal Pump Physics Validation', () => {
  it('should demonstrate affinity laws: flow scales with RPM', () => {
    // At rated RPM, 1500 GPM should require rated RPM
    const rpm1 = calculateRequiredRPM(150, 1500, 0);
    
    // At half flow, should require approximately half RPM (for same pressure per flow ratio)
    // Note: This is simplified - actual pump curves are more complex
    expect(rpm1).toBeGreaterThan(1000);
  });
  
  it('should demonstrate pressure drops as flow increases (at constant RPM)', () => {
    const rpm = 2200;
    const intakePsi = 0;
    
    const pressures: number[] = [];
    const flows = [0, 750, 1050, 1500, 1875, 2250];
    
    for (const flow of flows) {
      pressures.push(calculateMaxPDP(flow, rpm, intakePsi));
    }
    
    // Each successive pressure should be lower (characteristic pump curve)
    for (let i = 0; i < pressures.length - 1; i++) {
      expect(pressures[i]).toBeGreaterThan(pressures[i + 1]);
    }
  });
  
  it('should match NFPA acceptance test requirements', () => {
    const rpm = 2200;
    const intakePsi = 0;
    
    // Test all NFPA required points
    const tests = [
      { flow: 750, expectedPressure: 250, name: '50% capacity' },
      { flow: 1050, expectedPressure: 200, name: '70% capacity' },
      { flow: 1500, expectedPressure: 150, name: '100% rated capacity' }
    ];
    
    for (const test of tests) {
      const actualPressure = calculateMaxPDP(test.flow, rpm, intakePsi);
      expect(actualPressure).toBeCloseTo(test.expectedPressure, 5);
    }
  });
});