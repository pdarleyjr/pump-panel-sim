import { describe, it, expect } from 'vitest';
import { updateTemperatures, getTemperatureWarnings } from './overheating';
import type { PumpState } from './model';

describe('Overheating Module - Phase 2.4', () => {
  const baseState: Partial<PumpState> = {
    interlocks: { engaged: true, primed: true, emergencyStop: false },
    runtime: { rpm: 0, governor: 'PRESSURE' },
    pumpTempF: 70,
    engineTempF: 180,
    tankFillRecircPct: 0,
    totalFlowGpm: 0,
  };

  it('pump heats rapidly (5°F/sec) when engaged with inadequate flow (<10 GPM)', () => {
    const state = {
      ...baseState,
      pumpTempF: 70,
      totalFlowGpm: 5, // Less than 10 GPM threshold
      interlocks: { engaged: true, primed: true, emergencyStop: false },
    } as PumpState;
    
    const result = updateTemperatures(state, 10); // 10 seconds
    
    // Should heat at 5°F/sec: 70 + (5 * 10) = 120°F
    expect(result.pumpTempF).toBeCloseTo(120, 1);
  });

  it('pump cools (2°F/sec) with adequate discharge flow (≥10 GPM)', () => {
    const state = {
      ...baseState,
      pumpTempF: 200,
      totalFlowGpm: 100, // Adequate flow
      tankFillRecircPct: 0,
      interlocks: { engaged: true, primed: true, emergencyStop: false },
    } as PumpState;
    
    const result = updateTemperatures(state, 10); // 10 seconds
    
    // Should cool at 2°F/sec: 200 - (2 * 10) = 180°F
    expect(result.pumpTempF).toBeCloseTo(180, 1);
  });

  it('pump cools with recirculation even without discharge flow', () => {
    const state = {
      ...baseState,
      pumpTempF: 200,
      totalFlowGpm: 0, // No discharge flow
      tankFillRecircPct: 50, // 50% recirculation = 25 GPM
      interlocks: { engaged: true, primed: true, emergencyStop: false },
    } as PumpState;
    
    const result = updateTemperatures(state, 10); // 10 seconds
    
    // Recirculation flow: 50% of 50 GPM = 25 GPM (>10 GPM threshold)
    // Should cool at 2°F/sec: 200 - (2 * 10) = 180°F
    expect(result.pumpTempF).toBeCloseTo(180, 1);
  });

  it('pump cools slowly (1°F/sec) when disengaged', () => {
    const state = {
      ...baseState,
      pumpTempF: 200,
      interlocks: { engaged: false, primed: true, emergencyStop: false },
    } as PumpState;
    
    const result = updateTemperatures(state, 10); // 10 seconds
    
    // Should cool at 1°F/sec: 200 - (1 * 10) = 190°F
    expect(result.pumpTempF).toBeCloseTo(190, 1);
  });

  it('engine temperature adjusts based on RPM (180-220°F range)', () => {
    const state = {
      ...baseState,
      engineTempF: 180,
      runtime: { rpm: 3000, governor: 'PRESSURE' }, // Max RPM
    } as PumpState;
    
    const result = updateTemperatures(state, 10); // 10 seconds
    
    // Target at 3000 RPM: 180 + (3000/3000) * 40 = 220°F
    // Gradual adjustment: should move toward 220°F
    expect(result.engineTempF).toBeGreaterThan(180);
    expect(result.engineTempF).toBeLessThanOrEqual(220);
  });

  it('clamps pump temperature to 70-250°F range', () => {
    // Test lower bound
    const coldState = {
      ...baseState,
      pumpTempF: 70,
      interlocks: { engaged: false, primed: true, emergencyStop: false },
    } as PumpState;
    
    const coldResult = updateTemperatures(coldState, 100); // Long time
    expect(coldResult.pumpTempF).toBeGreaterThanOrEqual(70);
    
    // Test upper bound (should not exceed 250°F)
    const hotState = {
      ...baseState,
      pumpTempF: 245,
      totalFlowGpm: 0,
      interlocks: { engaged: true, primed: true, emergencyStop: false },
    } as PumpState;
    
    const hotResult = updateTemperatures(hotState, 10);
    expect(hotResult.pumpTempF).toBeLessThanOrEqual(250);
  });

  describe('Temperature Warning System', () => {
    it('generates yellow warning at 180°F (elevated)', () => {
      const temps = {
        pumpTempF: 185,
        engineTempF: 180,
        pumpOverheating: false,
        engineOverheating: false,
      };
      
      const warnings = getTemperatureWarnings(temps);
      expect(warnings.some(w => w.includes('elevated') && w.includes('185°F'))).toBe(true);
      expect(warnings.some(w => w.includes('Increase flow or enable recirculation'))).toBe(true);
    });

    it('generates orange warning at 200°F (overheating)', () => {
      const temps = {
        pumpTempF: 205,
        engineTempF: 180,
        pumpOverheating: true,
        engineOverheating: false,
      };
      
      const warnings = getTemperatureWarnings(temps);
      expect(warnings.some(w => w.includes('Overheating') && w.includes('205°F'))).toBe(true);
      expect(warnings.some(w => w.includes('Increase flow or enable recirculation'))).toBe(true);
    });

    it('generates red critical warning at 212°F (boiling)', () => {
      const temps = {
        pumpTempF: 215,
        engineTempF: 180,
        pumpOverheating: true,
        engineOverheating: false,
      };
      
      const warnings = getTemperatureWarnings(temps);
      expect(warnings.some(w => w.includes('CRITICAL') && w.includes('boiling'))).toBe(true);
      expect(warnings.some(w => w.includes('Steam damage risk'))).toBe(true);
      expect(warnings.some(w => w.includes('Increase flow or enable recirculation'))).toBe(true);
    });

    it('generates engine overheating warning at 230°F', () => {
      const temps = {
        pumpTempF: 150,
        engineTempF: 235,
        pumpOverheating: false,
        engineOverheating: true,
      };
      
      const warnings = getTemperatureWarnings(temps);
      expect(warnings.some(w => w.includes('Engine Overheating') && w.includes('235°F'))).toBe(true);
    });

    it('does not generate warnings when temperatures are normal', () => {
      const temps = {
        pumpTempF: 150,
        engineTempF: 190,
        pumpOverheating: false,
        engineOverheating: false,
      };
      
      const warnings = getTemperatureWarnings(temps);
      expect(warnings.length).toBe(0);
    });
  });
});