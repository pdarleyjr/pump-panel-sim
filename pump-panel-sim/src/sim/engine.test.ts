/**
 * Tests for the pump panel simulation engine
 */

import { describe, it, expect } from 'vitest';
import {
  calculateNozzleFlow,
  calculateLineHydraulics,
  updateFoamConsumption,
  simulateStep,
} from './engine';
import type { LineConfig, FoamSystem } from './model';
import { createInitialPumpState } from './pierce-puc';
import { HOSE_C, NOZZLE_PSI } from '../hydraulics/standards';

describe('calculateNozzleFlow', () => {
  it('should calculate flow for smooth-bore nozzle with 1" tip at 50 PSI', () => {
    const nozzle: LineConfig['nozzle'] = {
      type: 'smooth',
      tipIn: 1.0,
    };
    
    const result = calculateNozzleFlow(nozzle, 50);
    
    // Q = 29.7 * d² * √P
    // Q = 29.7 * 1.0² * √50
    // Q = 29.7 * 1.0 * 7.071
    // Q ≈ 210 GPM
    expect(result.gpm).toBeCloseTo(210, 0);
    expect(result.pressurePsi).toBe(NOZZLE_PSI.HANDLINE_SMOOTH);
  });
  
  it('should calculate flow for smooth-bore nozzle with 1.125" tip at 50 PSI', () => {
    const nozzle: LineConfig['nozzle'] = {
      type: 'smooth',
      tipIn: 1.125,
    };
    
    const result = calculateNozzleFlow(nozzle, 50);
    
    // Q = 29.7 * (1.125)² * √50
    // Q = 29.7 * 1.266 * 7.071
    // Q ≈ 266 GPM
    expect(result.gpm).toBeCloseTo(266, 0);
    expect(result.pressurePsi).toBe(NOZZLE_PSI.HANDLINE_SMOOTH);
  });
  
  it('should use target GPM for fog nozzle', () => {
    const nozzle: LineConfig['nozzle'] = {
      type: 'fog',
      targetGpm: 150,
    };
    
    const result = calculateNozzleFlow(nozzle, 100);
    
    expect(result.gpm).toBe(150);
    expect(result.pressurePsi).toBe(NOZZLE_PSI.HANDLINE_FOG);
  });
  
  it('should calculate flow for master smooth-bore with 1.375" tip at 80 PSI', () => {
    const nozzle: LineConfig['nozzle'] = {
      type: 'master_smooth',
      tipIn: 1.375,
    };
    
    const result = calculateNozzleFlow(nozzle, 80);
    
    // Q = 29.7 * (1.375)² * √80
    // Q = 29.7 * 1.891 * 8.944
    // Q ≈ 502 GPM
    expect(result.gpm).toBeCloseTo(502, 0);
    expect(result.pressurePsi).toBe(NOZZLE_PSI.MASTER_SMOOTH);
  });
  
  it('should use target GPM for master fog nozzle', () => {
    const nozzle: LineConfig['nozzle'] = {
      type: 'master_fog',
      targetGpm: 1000,
    };
    
    const result = calculateNozzleFlow(nozzle, 100);
    
    expect(result.gpm).toBe(1000);
    expect(result.pressurePsi).toBe(NOZZLE_PSI.MASTER_FOG);
  });
  
  it('should throw error for smooth-bore without tip size', () => {
    const nozzle: LineConfig['nozzle'] = {
      type: 'smooth',
    };
    
    expect(() => calculateNozzleFlow(nozzle, 50)).toThrow(
      'Smooth-bore nozzle requires tipIn parameter'
    );
  });
  
  it('should throw error for fog nozzle without target GPM', () => {
    const nozzle: LineConfig['nozzle'] = {
      type: 'fog',
    };
    
    expect(() => calculateNozzleFlow(nozzle, 100)).toThrow(
      'Fog nozzle requires targetGpm parameter'
    );
  });
});

describe('calculateLineHydraulics', () => {
  it('should return zero flow when valve is closed', () => {
    const lineConfig: LineConfig = {
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
    };
    
    const result = calculateLineHydraulics(lineConfig, 0, 150, false);
    
    expect(result.flow).toBe(0);
    expect(result.frictionLoss).toBe(0);
    expect(result.nozzlePressure).toBe(0);
    expect(result.requiredPDP).toBe(0);
  });
  
  it('should calculate hydraulics for 1.75" fog line at 100% valve', () => {
    const lineConfig: LineConfig = {
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
    };
    
    const pumpPressure = 150;
    const result = calculateLineHydraulics(lineConfig, 100, pumpPressure, false);
    
    // Flow should be target GPM at 100% valve
    expect(result.flow).toBe(150);
    
    // Friction loss should be positive
    expect(result.frictionLoss).toBeGreaterThan(0);
    expect(result.frictionLoss).toBeLessThan(65); // Reasonable for 1.75" x 200ft at 150 GPM
    
    // Nozzle pressure should be pump pressure minus friction loss
    expect(result.nozzlePressure).toBeCloseTo(
      pumpPressure - result.frictionLoss,
      1
    );
    
    // Required PDP should be nozzle pressure plus friction loss
    expect(result.requiredPDP).toBeGreaterThan(100);
  });
  
  it('should calculate hydraulics for 2.5" smooth-bore at 50% valve', () => {
    const lineConfig: LineConfig = {
      id: 'd2_5_a',
      hose: {
        diameterIn: 2.5,
        lengthFt: 200,
        C: HOSE_C.DOUBLE_JACKET_2_5,
      },
      nozzle: {
        type: 'smooth',
        tipIn: 1.0,
      },
      foamCapable: false,
    };
    
    const pumpPressure = 100;
    const result = calculateLineHydraulics(lineConfig, 50, pumpPressure, false);
    
    // Flow should be 50% of calculated smooth-bore flow
    // At 100 PSI: Q = 29.7 * 1² * √100 = 297 GPM
    // At 50% valve: ~148 GPM
    expect(result.flow).toBeCloseTo(148.5, 0);
    
    // Friction loss should be lower for 2.5" hose
    expect(result.frictionLoss).toBeGreaterThan(0);
    expect(result.frictionLoss).toBeLessThan(30);
  });
});

describe('updateFoamConsumption', () => {
  it('should consume foam concentrate based on flow and time', () => {
    const foamSystem: FoamSystem = {
      enabledLines: new Set(['xlay1']),
      percent: 0.6, // 0.6% foam
      tankGallons: 30,
    };
    
    // 150 GPM foam flow for 60 seconds (1 minute)
    const totalFoamGPM = 150;
    const deltaTimeSeconds = 60;
    
    const result = updateFoamConsumption(foamSystem, totalFoamGPM, deltaTimeSeconds);
    
    // Concentrate used = (0.6/100) * 150 GPM * 1 minute = 0.9 gallons
    const expectedRemaining = 30 - 0.9;
    expect(result.tankGallons).toBeCloseTo(expectedRemaining, 2);
    expect(result.percent).toBe(0.6);
  });
  
  it('should consume foam concentrate over multiple minutes', () => {
    const foamSystem: FoamSystem = {
      enabledLines: new Set(['xlay1', 'xlay2']),
      percent: 1.0, // 1% foam (Class B)
      tankGallons: 20,
    };
    
    // 300 GPM foam flow for 120 seconds (2 minutes)
    const totalFoamGPM = 300;
    const deltaTimeSeconds = 120;
    
    const result = updateFoamConsumption(foamSystem, totalFoamGPM, deltaTimeSeconds);
    
    // Concentrate used = (1.0/100) * 300 GPM * 2 minutes = 6 gallons
    const expectedRemaining = 20 - 6;
    expect(result.tankGallons).toBeCloseTo(expectedRemaining, 2);
  });
  
  it('should not allow foam tank to go negative', () => {
    const foamSystem: FoamSystem = {
      enabledLines: new Set(['xlay1']),
      percent: 0.6,
      tankGallons: 0.5, // Very low
    };
    
    // High flow that would consume more than available
    const totalFoamGPM = 500;
    const deltaTimeSeconds = 60;
    
    const result = updateFoamConsumption(foamSystem, totalFoamGPM, deltaTimeSeconds);
    
    // Tank should be empty but not negative
    expect(result.tankGallons).toBe(0);
  });
  
  it('should handle zero foam flow', () => {
    const foamSystem: FoamSystem = {
      enabledLines: new Set(),
      percent: 0.6,
      tankGallons: 30,
    };
    
    const result = updateFoamConsumption(foamSystem, 0, 60);
    
    // No consumption if no foam flow
    expect(result.tankGallons).toBe(30);
  });
});

describe('simulateStep', () => {
  it('should handle basic simulation with one line open', () => {
    const state = createInitialPumpState();
    
    // Engage pump interlocks
    state.interlocks.engaged = true;
    state.interlocks.primed = true;
    state.interlocks.emergencyStop = false;
    
    // Open xlay1 valve to 100%
    state.dischargeValvePct.xlay1 = 100;
    state.throttle = 100; // 100% throttle
    
    const { state: newState, diagnostics } = simulateStep(state, 1.0);
    
    // Should have flow through xlay1
    expect(diagnostics.totalWaterGpm).toBeGreaterThan(0);
    expect(diagnostics.lineHydraulics.has('xlay1')).toBe(true);
    
    const xlay1Hydraulics = diagnostics.lineHydraulics.get('xlay1')!;
    expect(xlay1Hydraulics.flow).toBeGreaterThan(0);
    
    // No foam consumption (foam not enabled)
    expect(diagnostics.totalFoamGpm).toBe(0);
    expect(diagnostics.foamConcentrateGpm).toBe(0);
    expect(newState.foam.tankGallons).toBe(30); // Unchanged
  });
  
  it('should handle multiple lines with foam enabled', () => {
    const state = createInitialPumpState();
    
    // Engage pump interlocks
    state.interlocks.engaged = true;
    state.interlocks.primed = true;
    state.interlocks.emergencyStop = false;
    
    // Open two cross-lays
    state.dischargeValvePct.xlay1 = 100;
    state.dischargeValvePct.xlay2 = 100;
    state.throttle = 100;
    
    // Enable foam on xlay1
    state.foam.enabledLines.add('xlay1');
    
    const { state: newState, diagnostics } = simulateStep(state, 60); // 60 seconds
    
    // Should have flow through both lines
    expect(diagnostics.lineHydraulics.has('xlay1')).toBe(true);
    expect(diagnostics.lineHydraulics.has('xlay2')).toBe(true);
    
    const xlay1Hydraulics = diagnostics.lineHydraulics.get('xlay1')!;
    const xlay2Hydraulics = diagnostics.lineHydraulics.get('xlay2')!;
    
    // Total water flow should be sum of both lines
    const expectedTotal = xlay1Hydraulics.flow + xlay2Hydraulics.flow;
    expect(diagnostics.totalWaterGpm).toBeCloseTo(expectedTotal, 0);
    
    // Foam flow should only be from xlay1
    expect(diagnostics.totalFoamGpm).toBeCloseTo(xlay1Hydraulics.flow, 0);
    
    // Foam should be consumed
    expect(newState.foam.tankGallons).toBeLessThan(30);
    expect(diagnostics.foamConcentrateGpm).toBeGreaterThan(0);
  });
  
  it('should handle closed valves correctly', () => {
    const state = createInitialPumpState();
    
    // All valves closed (default state)
    state.throttle = 100;
    
    const { diagnostics } = simulateStep(state, 1.0);
    
    // No flow through any lines
    expect(diagnostics.totalWaterGpm).toBe(0);
    expect(diagnostics.totalFoamGpm).toBe(0);
    expect(diagnostics.lineHydraulics.size).toBe(0);
  });
  
  it('should handle foam on non-foam-capable line', () => {
    const state = createInitialPumpState();
    
    // Engage pump interlocks
    state.interlocks.engaged = true;
    state.interlocks.primed = true;
    state.interlocks.emergencyStop = false;
    
    // Open d2_5_a (NOT foam capable)
    state.dischargeValvePct.d2_5_a = 100;
    state.throttle = 100;
    
    // Try to enable foam on it (shouldn't work)
    state.foam.enabledLines.add('d2_5_a');
    
    const { diagnostics } = simulateStep(state, 60);
    
    // Should have water flow
    expect(diagnostics.totalWaterGpm).toBeGreaterThan(0);
    
    // But no foam flow (line not foam-capable)
    expect(diagnostics.totalFoamGpm).toBe(0);
    expect(diagnostics.foamConcentrateGpm).toBe(0);
  });
  
  it('should preserve pump state properties', () => {
    const state = createInitialPumpState();
    state.throttle = 75;
    state.waterSource = 'hydrant';
    state.engineRpm = 2000;
    
    const { state: newState } = simulateStep(state, 1.0);
    
    // These properties should be preserved
    expect(newState.throttle).toBe(75);
    expect(newState.waterSource).toBe('hydrant');
    expect(newState.engineRpm).toBe(2000);
  });
});

describe('Nozzle-Back PDP Calculation', () => {
  it('calculates required PDP from open discharge lines', () => {
    const state = createInitialPumpState();
    state.interlocks.engaged = true;
    state.waterSource = 'hydrant';
    state.tankToPumpOpen = true;
    state.dischargeValvePct.xlay1 = 100;  // Open cross-lay 1 (fog nozzle, 100 PSI)
    
    const { state: result } = simulateStep(state, 1.0);
    
    // Should calculate PDP from nozzle requirement (100 PSI) + friction loss
    expect(result.dischargePsi).toBeGreaterThan(100);
    expect(result.totalFlowGpm).toBeGreaterThan(0);
  });
  
  it('blocks flow when drafting unprimed', () => {
    const state = createInitialPumpState();
    state.interlocks.engaged = true;
    state.interlocks.primed = false;
    state.waterSource = 'draft';
    state.dischargeValvePct.xlay1 = 100;
    
    const { state: result } = simulateStep(state, 1.0);
    
    expect(result.totalFlowGpm).toBe(0);  // Can't pump air
    expect(result.intakePressurePsi).toBe(0);  // Negative converted to vacuum reading
    expect(result.intakeVacuumInHg).toBeGreaterThan(0);  // Shows vacuum
  });
  
  it('applies 400 PSI safety clamp', () => {
    const state = createInitialPumpState();
    state.interlocks.engaged = true;
    state.runtime.governor = 'PRESSURE';
    state.throttle = 100;
    state.dischargeValvePct.xlay1 = 100;
    state.waterSource = 'hydrant';
    state.tankToPumpOpen = true;
    
    const { state: result } = simulateStep(state, 1.0);
    
    expect(result.dischargePsi).toBeLessThanOrEqual(400);
  });
  
  it('integrates overheating effects', () => {
    const state = createInitialPumpState();
    state.interlocks.engaged = true;
    state.pumpTempF = 80;
    state.waterSource = 'tank';
    state.tankToPumpOpen = true;
    
    // Run with no flow for extended time (120 sec to reach 200°F+ threshold)
    // Heat rate: 0.3°F/sec (operating) + 0.8°F/sec (stagnant) = 1.1°F/sec
    // 80°F + (1.1 * 120) = 212°F (above 200°F threshold)
    let currentState = state;
    for (let i = 0; i < 120; i++) {
      const { state: newState } = simulateStep(currentState, 1.0);
      currentState = newState;
    }
    
    expect(currentState.pumpTempF).toBeGreaterThan(200);  // Should exceed overheating threshold
    expect(Array.from(currentState.warnings)).toContain('PUMP OVERHEATING');
  });
});