/**
 * Hydraulics solver for fire pump simulation
 * Computes flow rates, friction losses, and required pump discharge pressure
 */

import type { SimState, Discharge } from './state';
import { hazenWilliamsFL, calculatePDP, estimateFlow } from '../hydraulics/formulas';

export interface SolverResult {
  totalGPM: number;
  requiredPDP: number;
  intakePsi: number;
  dischargeFlows: Record<string, number>;
  warnings: string[];
}

/**
 * Solve hydraulics for the entire pump system
 * Calculates flows, friction losses, and required pressures
 * 
 * @param state Current simulation state
 * @returns Solver result with computed values
 */
export function solveHydraulics(state: SimState): SolverResult {
  const warnings: string[] = [];
  const dischargeFlows: Record<string, number> = {};
  
  // If pump not engaged, nothing flows
  if (!state.pump.engaged) {
    return {
      totalGPM: 0,
      requiredPDP: 0,
      intakePsi: state.tankToPumpOpen ? 45 : 0,
      dischargeFlows: {},
      warnings: ['Pump not engaged'],
    };
  }

  let totalGPM = 0;
  let maxRequiredPDP = 0;

  // Calculate flow and required PDP for each open discharge
  Object.values(state.discharges).forEach((discharge: Discharge) => {
    if (discharge.open <= 0) {
      dischargeFlows[discharge.id] = 0;
      return;
    }

    // Estimate flow based on nozzle (simplified - use fixed tip sizes)
    const tipInches = discharge.diameterIn === 1.75 ? 0.875 : 
                      discharge.diameterIn === 2.5 ? 1.125 : 1.375;
    const flow = estimateFlow(discharge.nozzleType, tipInches, discharge.nozzleNPsi) * discharge.open;
    
    dischargeFlows[discharge.id] = flow;
    totalGPM += flow;

    // Calculate friction loss for this line
    const frictionLoss = hazenWilliamsFL(flow, discharge.diameterIn, discharge.lengthFt, 150);
    
    // Calculate required PDP for this line
    const pdp = calculatePDP({
      nozzlePressure: discharge.nozzleNPsi,
      frictionLoss,
      applianceLoss: 10, // simplified - 10 psi for appliances
      elevationFt: state.elevationFt,
    });

    maxRequiredPDP = Math.max(maxRequiredPDP, pdp);

    // Foam consumption
    if (discharge.foamPct > 0 && flow > 0) {
      const foamGPM = (flow * discharge.foamPct) / 100;
      // Note: actual foam tank depletion happens in the simulation loop
      if (state.pump.foamTankGallons < 5) {
        warnings.push(`Low foam: ${state.pump.foamTankGallons.toFixed(1)} gal`);
      }
    }
  });

  // Determine intake pressure based on water source
  let intakePsi = 0;
  const primaryIntake = Object.values(state.intakes)[0];
  
  if (state.tankToPumpOpen) {
    intakePsi = 45; // Tank-to-pump provides ~40-50 psi baseline
  } else if (primaryIntake.source === 'hydrant') {
    intakePsi = 60; // Typical hydrant pressure (residual)
  } else if (primaryIntake.source === 'draft') {
    intakePsi = state.primerActive ? -10 : -20; // Vacuum in inches Hg (simplified)
    warnings.push('Drafting - ensure primer active');
  } else if (primaryIntake.source === 'relay') {
    intakePsi = 30; // Upstream pump pressure
  }

  return {
    totalGPM,
    requiredPDP: maxRequiredPDP,
    intakePsi,
    dischargeFlows,
    warnings,
  };
}