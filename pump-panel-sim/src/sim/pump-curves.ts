/**
 * Pump performance curves for Pierce PUC single-stage centrifugal pump
 * Based on NFPA pump acceptance test requirements
 * 
 * Blueprint ref: Lines 30-38, 96-146
 * 
 * Standard rating: 1500 GPM @ 150 PSI @ 100% capacity
 * 70% capacity: 1050 GPM @ 200 PSI
 * 50% capacity: 750 GPM @ 250 PSI
 */

export interface PumpCapacity {
  flowGpm: number;
  pressurePsi: number;
  percentCapacity: number;
}

/**
 /**
  * NFPA pump acceptance test points for 1500 GPM rated pump
  * Extended with churn pressure and runout points for complete curve modeling
  */
 export const NFPA_PUMP_CURVE: PumpCapacity[] = [
   { flowGpm: 0, pressurePsi: 290, percentCapacity: 0 },      // Churn (shutoff) pressure
   { flowGpm: 750, pressurePsi: 250, percentCapacity: 50 },   // 50% capacity (NFPA test point)
   { flowGpm: 1050, pressurePsi: 200, percentCapacity: 70 },  // 70% capacity (NFPA test point)
   { flowGpm: 1500, pressurePsi: 150, percentCapacity: 100 }, // Rated capacity (NFPA test point)
   { flowGpm: 1875, pressurePsi: 125, percentCapacity: 125 }, // 125% capacity
   { flowGpm: 2250, pressurePsi: 95, percentCapacity: 150 },  // 150% capacity (runout)
 ];
/**
 /**
  * Calculate maximum achievable pressure at a given flow rate
  * Uses NFPA pump curve interpolation with runout protection
  *
  * @param flowGpm Current total discharge flow
  * @param rpm Current pump RPM (affects curve scaling)
  * @param intakePsi Intake pressure (positive helps, negative hurts)
  * @returns Maximum PDP achievable in PSI
  */
 export function calculateMaxPDP(
   flowGpm: number,
   rpm: number,
   intakePsi: number
 ): number {
   // Normalize RPM to rated speed (2200 RPM for this pump)
   const ratedRpm = 2200;
   const rpmFactor = rpm / ratedRpm;
   
   // Scale flow by RPM factor for curve lookup
   const effectiveFlow = flowGpm / Math.max(rpmFactor, 0.1);
   
   // Find appropriate curve segment for interpolation
   let maxPressure = 0;
   const lastPoint = NFPA_PUMP_CURVE[NFPA_PUMP_CURVE.length - 1];
   const firstPoint = NFPA_PUMP_CURVE[0];
   
   if (effectiveFlow >= lastPoint.flowGpm) {
     // At or beyond runout (150% capacity) - use runout point
     maxPressure = lastPoint.pressurePsi;
   } else if (effectiveFlow <= firstPoint.flowGpm) {
     // At or below churn (0 GPM) - use churn point
     maxPressure = firstPoint.pressurePsi;
   } else {
     // Interpolate between curve points
     for (let i = 0; i < NFPA_PUMP_CURVE.length - 1; i++) {
       const p1 = NFPA_PUMP_CURVE[i];
       const p2 = NFPA_PUMP_CURVE[i + 1];
       
       if (effectiveFlow >= p1.flowGpm && effectiveFlow <= p2.flowGpm) {
         // Linear interpolation
         const flowRange = p2.flowGpm - p1.flowGpm;
         const pressureRange = p2.pressurePsi - p1.pressurePsi;
         const flowOffset = effectiveFlow - p1.flowGpm;
         
         maxPressure = p1.pressurePsi + (flowOffset / flowRange) * pressureRange;
         break;
       }
     }
   }
   
   // Scale pressure by RPM factor (centrifugal pump law: P ∝ RPM²)
   const rpmPressureFactor = Math.pow(rpmFactor, 2);
   maxPressure *= rpmPressureFactor;
   
   // Intake pressure boost/penalty
   // Positive intake (hydrant/tank) adds to achievable pressure
   // Negative intake (vacuum) reduces achievable pressure
   maxPressure += intakePsi;
   
   return Math.max(0, maxPressure);
 }
 
 /**
  * Check if pump is operating in runout condition
  * Runout occurs at or above 150% rated capacity (2250 GPM for 1500 GPM pump)
  *
  * @param flowGpm Current total discharge flow
  * @returns Warning message if in runout, null otherwise
  */
 export function checkRunoutCondition(flowGpm: number): string | null {
   const ratedCapacity = 1500; // GPM
   const maxRecommendedFlow = ratedCapacity * 1.5; // 2250 GPM (150%)
   
   if (flowGpm >= maxRecommendedFlow) {
     return `⚠️ RUNOUT: Flow ${Math.round(flowGpm)} GPM exceeds max ${maxRecommendedFlow} GPM`;
   } else if (flowGpm > ratedCapacity * 1.25) {
     return `High flow: ${Math.round(flowGpm)} GPM (${Math.round((flowGpm/ratedCapacity)*100)}% capacity)`;
   }
   
   return null;
 }
/**
 * Calculate RPM needed to achieve target PDP at given flow
 * Inverse of calculateMaxPDP
 *
 * @param targetPDP Desired pump discharge pressure
 * @param flowGpm Current total discharge flow
 * @param intakePsi Intake pressure
 * @returns Required RPM to achieve target PDP
 */
export function calculateRequiredRPM(
  targetPDP: number,
  flowGpm: number,
  intakePsi: number
): number {
  const ratedRpm = 2200;
  
  // Remove intake pressure boost to get pressure needed from pump
  const pumpPressureNeeded = targetPDP - intakePsi;
  
  // Find base pressure at this flow from curve (at rated RPM)
  let basePressure = 150; // Default to 100% point
  const lastPoint = NFPA_PUMP_CURVE[NFPA_PUMP_CURVE.length - 1];
  const firstPoint = NFPA_PUMP_CURVE[0];
  
  if (flowGpm >= lastPoint.flowGpm) {
    basePressure = lastPoint.pressurePsi;
  } else if (flowGpm <= firstPoint.flowGpm) {
    basePressure = firstPoint.pressurePsi;
  } else {
    // Interpolate between curve points
    for (let i = 0; i < NFPA_PUMP_CURVE.length - 1; i++) {
      const p1 = NFPA_PUMP_CURVE[i];
      const p2 = NFPA_PUMP_CURVE[i + 1];
      
      if (flowGpm >= p1.flowGpm && flowGpm <= p2.flowGpm) {
        const flowRange = p2.flowGpm - p1.flowGpm;
        const pressureRange = p2.pressurePsi - p1.pressurePsi;
        const flowOffset = flowGpm - p1.flowGpm;
        
        basePressure = p1.pressurePsi + (flowOffset / flowRange) * pressureRange;
        break;
      }
    }
  }
  
  // Calculate required RPM factor (P ∝ RPM²)
  const rpmFactor = Math.sqrt(pumpPressureNeeded / basePressure);
  const requiredRpm = ratedRpm * rpmFactor;
  
  // Clamp to realistic range
  return Math.max(600, Math.min(3000, requiredRpm));
}