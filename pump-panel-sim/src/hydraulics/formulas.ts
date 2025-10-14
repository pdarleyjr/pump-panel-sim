/**
 * Fire pump hydraulics calculations
 * Based on Hazen-Williams formula and fireground equations
 */

export interface HoseSpec {
  id: string;
  diameterIn: number;
  lengthFt: number;
  C: number;
}

/**
 * Clamp value to range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate friction loss per 100 ft using Hazen-Williams formula
 * Standard fire service formula with proper coefficient for GPM units
 *
 * @param Q_gpm - Flow in gallons per minute (clamped 0-2000)
 * @param d_in - Inside diameter in inches (clamped 1.0-6.0)
 * @param C - Hazen-Williams coefficient (clamped 80-180)
 * @returns Friction loss in PSI per 100 ft
 */
export function hazenWilliamsFLpsiPer100ft(Q_gpm: number, d_in: number, C: number): number {
  // Clamp inputs to realistic ranges
  Q_gpm = clamp(Q_gpm, 0, 2000);
  d_in = clamp(d_in, 1.0, 6.0);
  C = clamp(C, 80, 180);

  // Hazen-Williams formula: Convert Q in GPM to proper units
  // Standard form: h_f = 0.2083 * (100/C)^1.85 * Q^1.85 / d^4.87
  // Where h_f is head loss in feet per 100 ft, Q is in GPM
  // Convert to PSI: multiply by 0.433 PSI/ft
  const headLoss = 0.2083 * Math.pow(100 / C, 1.85) * Math.pow(Q_gpm, 1.85) / Math.pow(d_in, 4.87);
  return headLoss * 0.433;
}

/**
 * Calculate total friction loss for hose
 * 
 * @param hose - Hose specification
 * @param Q_gpm - Flow in gallons per minute
 * @returns Total friction loss in PSI
 */
export function frictionLossPsi(hose: HoseSpec, Q_gpm: number): number {
  const per100 = hazenWilliamsFLpsiPer100ft(Q_gpm, hose.diameterIn, hose.C);
  return per100 * (hose.lengthFt / 100);
}

/**
 * Calculate required pump discharge pressure
 * Formula: PDP = NP + FL + APP + ELEV
 * 
 * @param params - Calculation parameters
 * @returns Required pump discharge pressure in PSI
 */
export function pumpDischargePressure({
  nozzlePressurePsi,
  hoseLossPsi,
  applianceLossPsi,
  elevationFt
}: {
  nozzlePressurePsi: number;
  hoseLossPsi: number;
  applianceLossPsi: number;
  elevationFt: number;
}): number {
  // Clamp nozzle pressure to realistic range
  nozzlePressurePsi = clamp(nozzlePressurePsi, 0, 200);
  applianceLossPsi = clamp(applianceLossPsi, 0, 50);
  
  // Elevation: 0.433 PSI per foot of water column (standard)
  const elevationPsi = 0.433 * elevationFt;
  
  return nozzlePressurePsi + hoseLossPsi + applianceLossPsi + elevationPsi;
}

/**
 * Calculate smooth-bore nozzle flow
 * Formula: Q = 29.7 * d^2 * sqrt(NP)
 *
 * @param tipDiameterIn - Tip diameter in inches
 * @param nozzlePressurePsi - Nozzle pressure in PSI
 * @returns Flow in GPM
 */
export function smoothBoreFlow(tipDiameterIn: number, nozzlePressurePsi: number): number {
  tipDiameterIn = clamp(tipDiameterIn, 0.5, 2.0);
  nozzlePressurePsi = clamp(nozzlePressurePsi, 0, 200);
  
  return 29.7 * Math.pow(tipDiameterIn, 2) * Math.sqrt(nozzlePressurePsi);
}

/**
 * Hazen-Williams friction loss formula (simplified signature)
 * Convenience wrapper for hazenWilliamsFLpsiPer100ft with total length
 *
 * @param gpm Flow rate in gallons per minute
 * @param diameterIn Inside diameter in inches
 * @param lengthFt Hose length in feet
 * @param c C-factor (hose condition: 150 new, 120-140 older)
 * @returns Total friction loss in PSI
 */
export function hazenWilliamsFL(gpm: number, diameterIn: number, lengthFt: number, c = 150): number {
  if (gpm <= 0 || diameterIn <= 0) return 0;
  // Use consolidated formula
  const flPer100 = hazenWilliamsFLpsiPer100ft(gpm, diameterIn, c);
  return flPer100 * (lengthFt / 100);
}

/**
 * Calculate required Pump Discharge Pressure
 * PDP = NP + FL + APP + ELEV
 */
export function calculatePDP(params: {
  nozzlePressure: number;
  frictionLoss: number;
  applianceLoss: number;
  elevationFt: number;
}): number {
  const { nozzlePressure, frictionLoss, applianceLoss, elevationFt } = params;
  const elevationPsi = 0.433 * elevationFt; // 0.433 PSI per foot of water column (standard)
  return nozzlePressure + frictionLoss + applianceLoss + elevationPsi;
}

/**
 * Estimate flow from nozzle pressure and type
 * Q = 29.7 * d^2 * sqrt(NP) for smooth bore
 * Q = target GPM for fog nozzles (automatic)
 */
export function estimateFlow(nozzleType: 'smooth' | 'fog', tipInches: number, nozzlePsi: number): number {
  if (nozzleType === 'smooth') {
    // Smooth bore: Q = 29.7 * d^2 * sqrt(NP)
    return 29.7 * Math.pow(tipInches, 2) * Math.sqrt(nozzlePsi);
  }
  // Fog nozzles maintain target GPM (simplified - return based on nozzle pressure target)
  if (nozzlePsi === 50) return 95;   // 1.75" handline
  if (nozzlePsi === 100) return 150; // 1.75" fog or 2.5"
  if (nozzlePsi === 80) return 1000; // Master stream
  return 150; // default
}