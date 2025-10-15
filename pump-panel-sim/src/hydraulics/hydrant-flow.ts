/**
 * Hydrant flow calculations for Pierce PUC
 * Analyzes static vs residual pressure to estimate available water supply
 */

/**
 * Calculate available flow from hydrant based on pressure readings
 * Uses the flow formula: Q2 = Q1 * sqrt((P1 - P2) / (P1 - P3))
 * 
 * Where:
 * - Q1 = test flow
 * - P1 = static pressure
 * - P2 = residual at test flow
 * - P3 = desired residual
 * 
 * @param staticPSI Static pressure (no flow)
 * @param residualPSI Residual pressure during test flow
 * @param testFlowGPM Flow rate during pressure test
 * @returns Available flow estimates at different operating pressures
 */
export function calculateAvailableFlow(
  staticPSI: number,
  residualPSI: number,
  testFlowGPM: number
): {
  availableAt150PSI: number;
  availableAt250PSI: number;
  pressureDrop: number;
} {
  const pressureDrop = staticPSI - residualPSI;
  
  // Calculate available flow at 20 PSI residual (common target)
  const availableAt20PSI = testFlowGPM * Math.sqrt(
    (staticPSI - 20) / (staticPSI - residualPSI)
  );
  
  // Estimate available at different operating pressures
  // Rule of thumb: Higher discharge pressure = less available flow
  const availableAt150PSI = availableAt20PSI * 0.8; // 80% at 150 PSI
  const availableAt250PSI = availableAt20PSI * 0.6; // 60% at 250 PSI
  
  return {
    availableAt150PSI,
    availableAt250PSI,
    pressureDrop,
  };
}

/**
 * Get training guidance based on hydrant flow conditions
 * Provides educational feedback on supply adequacy
 * 
 * @param staticPSI Static pressure (no flow)
 * @param residualPSI Residual pressure during test flow
 * @returns Guidance message for training overlay
 */
export function getHydrantFlowGuidance(
  staticPSI: number,
  residualPSI: number
): string {
  const drop = staticPSI - residualPSI;
  const dropPercent = (drop / staticPSI) * 100;
  
  if (dropPercent > 25) {
    return `HIGH PRESSURE DROP (${dropPercent.toFixed(0)}%): Hydrant may be undersized. Consider reducing flow or using additional supply.`;
  } else if (dropPercent > 10) {
    return `MODERATE PRESSURE DROP (${dropPercent.toFixed(0)}%): Monitor closely. Additional flow may be limited.`;
  } else {
    return `GOOD SUPPLY: Low pressure drop (${dropPercent.toFixed(0)}%). Hydrant can provide additional flow if needed.`;
  }
}