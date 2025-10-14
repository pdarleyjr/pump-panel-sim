/**
 * Utility functions for the pump panel simulation
 * Provides human-readable labels and common calculations
 */

import type { DischargeId, IntakeId } from './model';

/**
 * Get human-readable label for a discharge line ID
 * 
 * @param id - Discharge line identifier
 * @returns Human-readable label for the discharge line
 */
export function getDischargeLabel(id: DischargeId): string {
  const labels: Record<DischargeId, string> = {
    xlay1: 'XLAY 1',
    xlay2: 'XLAY 2',
    xlay3: 'XLAY 3',
    trash: 'TRASH',
    d2_5_a: '2.5" A',
    d2_5_b: '2.5" B',
    d2_5_c: '2.5" C',
    d2_5_d: '2.5" D',
    deck: 'DECK GUN',
    rear_ldh: 'REAR LDH',
  };
  
  return labels[id];
}

/**
 * Get human-readable label for an intake line ID
 * 
 * @param id - Intake line identifier
 * @returns Human-readable label for the intake line
 */
export function getIntakeLabel(id: IntakeId): string {
  const labels: Record<IntakeId, string> = {
    ldh_driver: 'LDH DRIVER',
    ldh_officer: 'LDH OFFICER',
    rear_ldh: 'REAR LDH',
  };
  
  return labels[id];
}

/**
 * Calculate GPM for a smooth-bore nozzle
 * 
 * Uses the standard fire service formula: Q = 29.7 * d² * √P
 * where:
 * - Q is flow in gallons per minute (GPM)
 * - d is nozzle tip diameter in inches
 * - P is nozzle pressure in PSI
 * 
 * This formula is derived from fluid dynamics principles and is widely
 * used in the fire service for smooth-bore nozzle calculations.
 * 
 * @param tipDiameterInches - Nozzle tip diameter in inches
 * @param pressurePsi - Nozzle pressure in PSI
 * @returns Flow rate in gallons per minute (GPM)
 * 
 * @example
 * // Calculate flow for a 1" smooth-bore tip at 50 PSI
 * const gpm = getSmoothBoreGPM(1.0, 50);
 * // Returns approximately 210 GPM
 */
export function getSmoothBoreGPM(
  tipDiameterInches: number,
  pressurePsi: number
): number {
  return 29.7 * Math.pow(tipDiameterInches, 2) * Math.sqrt(pressurePsi);
}