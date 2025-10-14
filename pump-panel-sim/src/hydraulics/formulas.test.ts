import { describe, it, expect } from 'vitest';
import {
  hazenWilliamsFLpsiPer100ft,
  frictionLossPsi,
  pumpDischargePressure,
  type HoseSpec,
} from './formulas';
import { HOSE_C, NOZZLE_PSI } from './standards';

describe('hazenWilliamsFLpsiPer100ft', () => {
  it('should compute friction loss per 100 ft for 1.75" hose at 150 gpm with C=150', () => {
    const Q_gpm = 150;
    const d_in = 1.75;
    const C = 150;

    const lossPerHundred = hazenWilliamsFLpsiPer100ft(Q_gpm, d_in, C);

    // Expected to be between 15-40 psi per 100 ft for these parameters
    expect(lossPerHundred).toBeGreaterThan(15);
    expect(lossPerHundred).toBeLessThan(40);
  });

  it('should compute higher friction loss for smaller diameter hose', () => {
    const Q_gpm = 150;
    const C = 150;

    const loss_1_75 = hazenWilliamsFLpsiPer100ft(Q_gpm, 1.75, C);
    const loss_2_5 = hazenWilliamsFLpsiPer100ft(Q_gpm, 2.5, C);

    // Smaller diameter should have higher friction loss
    expect(loss_1_75).toBeGreaterThan(loss_2_5);
  });

  it('should compute higher friction loss for higher flow rates', () => {
    const d_in = 1.75;
    const C = 150;

    const loss_100gpm = hazenWilliamsFLpsiPer100ft(100, d_in, C);
    const loss_200gpm = hazenWilliamsFLpsiPer100ft(200, d_in, C);

    // Higher flow should have higher friction loss
    expect(loss_200gpm).toBeGreaterThan(loss_100gpm);
  });

  it('should compute higher friction loss for lower C coefficient (rougher hose)', () => {
    const Q_gpm = 150;
    const d_in = 1.75;

    const loss_C150 = hazenWilliamsFLpsiPer100ft(Q_gpm, d_in, 150);
    const loss_C100 = hazenWilliamsFLpsiPer100ft(Q_gpm, d_in, 100);

    // Lower C (rougher) should have higher friction loss
    expect(loss_C100).toBeGreaterThan(loss_C150);
  });
});

describe('frictionLossPsi', () => {
  it('should calculate total friction loss for a 200 ft hose', () => {
    const hose: HoseSpec = {
      id: 'test-hose-1',
      diameterIn: 1.75,
      lengthFt: 200,
      C: HOSE_C.DOUBLE_JACKET_1_75,
    };
    const Q_gpm = 150;

    const totalLoss = frictionLossPsi(hose, Q_gpm);

    // For 200 ft, expect roughly 2x the loss per 100 ft
    const lossPerHundred = hazenWilliamsFLpsiPer100ft(Q_gpm, hose.diameterIn, hose.C);
    const expectedLoss = lossPerHundred * 2;

    expect(totalLoss).toBeCloseTo(expectedLoss, 1);
  });

  it('should calculate higher friction loss for longer hose', () => {
    const Q_gpm = 150;
    
    const hose100: HoseSpec = {
      id: 'test-hose-100',
      diameterIn: 2.5,
      lengthFt: 100,
      C: HOSE_C.DOUBLE_JACKET_2_5,
    };

    const hose300: HoseSpec = {
      id: 'test-hose-300',
      diameterIn: 2.5,
      lengthFt: 300,
      C: HOSE_C.DOUBLE_JACKET_2_5,
    };

    const loss100 = frictionLossPsi(hose100, Q_gpm);
    const loss300 = frictionLossPsi(hose300, Q_gpm);

    // 300 ft should have ~3x the loss of 100 ft
    expect(loss300).toBeCloseTo(loss100 * 3, 1);
  });

  it('should calculate realistic friction loss for standard attack line', () => {
    // Standard 1.75" attack line, 200 ft, 150 gpm
    const hose: HoseSpec = {
      id: 'attack-line',
      diameterIn: 1.75,
      lengthFt: 200,
      C: HOSE_C.DOUBLE_JACKET_1_75,
    };
    const Q_gpm = 150;

    const totalLoss = frictionLossPsi(hose, Q_gpm);

    // Expect reasonable friction loss for this configuration (30-80 psi range)
    expect(totalLoss).toBeGreaterThan(30);
    expect(totalLoss).toBeLessThan(80);
  });
});

describe('pumpDischargePressure', () => {
  it('should verify PDP calculation with known values', () => {
    const nozzlePressure = NOZZLE_PSI.HANDLINE_FOG; // 100 psi
    const hoseLoss = 50; // 50 psi friction loss
    const applianceLoss = 10; // 10 psi appliance loss
    const elevation = 0; // No elevation change

    const pdp = pumpDischargePressure({
      nozzlePressurePsi: nozzlePressure,
      hoseLossPsi: hoseLoss,
      applianceLossPsi: applianceLoss,
      elevationFt: elevation
    });

    // PDP = 100 + 50 + 10 + 0 = 160 psi
    expect(pdp).toBe(160);
  });

  it('should include elevation component in PDP calculation', () => {
    const nozzlePressure = NOZZLE_PSI.HANDLINE_SMOOTH; // 50 psi
    const hoseLoss = 30; // 30 psi friction loss
    const applianceLoss = 0; // No appliance loss
    const elevation = 20; // 20 feet elevation gain

    const pdp = pumpDischargePressure({
      nozzlePressurePsi: nozzlePressure,
      hoseLossPsi: hoseLoss,
      applianceLossPsi: applianceLoss,
      elevationFt: elevation
    });

    // PDP = 50 + 30 + 0 + (20 * 0.434) = 80 + 8.68 = 88.68 psi
    expect(pdp).toBeCloseTo(88.68, 1);
  });

  it('should handle negative elevation (downhill)', () => {
    const nozzlePressure = 100;
    const hoseLoss = 40;
    const applianceLoss = 5;
    const elevation = -10; // 10 feet downhill

    const pdp = pumpDischargePressure({
      nozzlePressurePsi: nozzlePressure,
      hoseLossPsi: hoseLoss,
      applianceLossPsi: applianceLoss,
      elevationFt: elevation
    });

    // PDP = 100 + 40 + 5 + (-10 * 0.434) = 145 - 4.34 = 140.66 psi
    expect(pdp).toBeCloseTo(140.66, 1);
  });

  it('should calculate realistic PDP for standard handline operation', () => {
    // Scenario: 1.75" handline, 200 ft, 150 gpm, fog nozzle, 10 ft elevation
    const hose: HoseSpec = {
      id: 'handline',
      diameterIn: 1.75,
      lengthFt: 200,
      C: HOSE_C.DOUBLE_JACKET_1_75,
    };
    const Q_gpm = 150;
    const elevation = 10;

    const hoseLoss = frictionLossPsi(hose, Q_gpm);
    const pdp = pumpDischargePressure({
      nozzlePressurePsi: NOZZLE_PSI.HANDLINE_FOG,
      hoseLossPsi: hoseLoss,
      applianceLossPsi: 0, // No appliances
      elevationFt: elevation
    });

    // PDP should be reasonable for this operation (typically 120-200 psi)
    expect(pdp).toBeGreaterThan(120);
    expect(pdp).toBeLessThan(200);
  });

  it('should calculate realistic PDP for master stream operation', () => {
    // Scenario: 2.5" supply line, 100 ft, 500 gpm, smooth bore master stream
    const hose: HoseSpec = {
      id: 'supply',
      diameterIn: 2.5,
      lengthFt: 100,
      C: HOSE_C.DOUBLE_JACKET_2_5,
    };
    const Q_gpm = 500;
    const elevation = 0;

    const hoseLoss = frictionLossPsi(hose, Q_gpm);
    const pdp = pumpDischargePressure({
      nozzlePressurePsi: NOZZLE_PSI.MASTER_SMOOTH,
      hoseLossPsi: hoseLoss,
      applianceLossPsi: 25, // Appliance loss for deck gun
      elevationFt: elevation
    });

    // PDP should be reasonable for master stream (typically 100-250 psi)
    expect(pdp).toBeGreaterThan(100);
    expect(pdp).toBeLessThan(250);
  });
  
  it('should use standardized elevation coefficient of 0.433 PSI/ft', () => {
    const nozzlePressure = 100;
    const hoseLoss = 0;
    const applianceLoss = 0;
    const elevation = 100; // 100 feet elevation gain
    
    const pdp = pumpDischargePressure({
      nozzlePressurePsi: nozzlePressure,
      hoseLossPsi: hoseLoss,
      applianceLossPsi: applianceLoss,
      elevationFt: elevation
    });
    
    // Should use 0.433 PSI/ft: 100 + (100 * 0.433) = 143.3 PSI
    expect(pdp).toBeCloseTo(143.3, 1);
  });
});