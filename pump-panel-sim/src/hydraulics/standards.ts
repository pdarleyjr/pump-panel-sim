/**
 * Standard hydraulics constants for fire service operations
 * Based on NFPA standards and common fireground practices
 */

/**
 * Standard nozzle operating pressures in PSI
 * 
 * These are the typical pressures required at the nozzle tip to achieve
 * optimal water stream performance for different nozzle types.
 * 
 * - Smooth bore nozzles require lower pressures (50-80 PSI)
 * - Fog/combination nozzles require higher pressures (100 PSI) for proper atomization
 * - Master streams operate at different pressures depending on type
 */
export const NOZZLE_PSI = {
  /** Smooth bore handline nozzle (typically 50 PSI) */
  HANDLINE_SMOOTH: 50,
  /** Fog/combination handline nozzle (typically 100 PSI) */
  HANDLINE_FOG: 100,
  /** Smooth bore master stream nozzle (typically 80 PSI) */
  MASTER_SMOOTH: 80,
  /** Fog/combination master stream nozzle (typically 100 PSI) */
  MASTER_FOG: 100,
} as const;

/**
 * Hazen-Williams C coefficients for common fire hose types
 * 
 * The C coefficient represents the smoothness/roughness of the hose interior.
 * Higher values indicate smoother interior surfaces and lower friction losses.
 * 
 * Typical ranges:
 * - New double-jacket hose: 150
 * - Aged double-jacket hose: 120-135
 * - Large diameter hose (LDH): 135-140
 * - Damaged or lined hose: 100-120
 */
export const HOSE_C = {
  /** Double-jacket 1.75 inch hose (C = 150) */
  DOUBLE_JACKET_1_75: 150,
  /** Double-jacket 2.5 inch hose (C = 150) */
  DOUBLE_JACKET_2_5: 150,
  /** Large diameter hose 4 inch (C = 140) */
  LDH_4: 140,
  /** Large diameter hose 5 inch (C = 140) */
  LDH_5: 140,
} as const;