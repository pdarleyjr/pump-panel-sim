/**
 * Simulation engine for fire pump panel operations
 * Handles hydraulic calculations, foam consumption, and system state updates
 */

import type { SimState } from './state';
import type { DischargeId, LineConfig, FoamSystem, PumpState } from './model';
import { frictionLossPsi, pumpDischargePressure } from '../hydraulics/formulas';
import { NOZZLE_PSI } from '../hydraulics/standards';
import { applyDRV } from './drv';
import { intakeGauge, dischargeGauge } from './gauges';
import {
  updatePressureGovernor,
  updateRPMGovernor,
  getGovernorWarnings,
  shouldAutoSwitchMode,
  switchGovernorMode,
  setTargetRPM,
  setTargetPDP,
  createGovernor,
  type GovernorState
} from './governor';
import { calculateMaxPDP, checkRunoutCondition } from './pump-curves';
import { updateTemperatures, getTemperatureWarnings } from './overheating';

/**
 * Result of nozzle flow calculation
 */
export interface NozzleFlowResult {
  /** Flow rate in gallons per minute */
  gpm: number;
  /** Required nozzle pressure in PSI */
  pressurePsi: number;
}

/**
 * Result of line hydraulics calculation
 */
export interface LineHydraulicsResult {
  /** Actual flow through the line in GPM */
  flow: number;
  /** Friction loss in the hose in PSI */
  frictionLoss: number;
  /** Pressure at the nozzle in PSI */
  nozzlePressure: number;
  /** Required pump discharge pressure in PSI */
  requiredPDP: number;
}

/**
 * Diagnostic information from simulation step
 */
export interface SimulationDiagnostics {
  /** Total water flow in GPM */
  totalWaterGpm: number;
  /** Total foam flow in GPM (water flowing through foam lines) */
  totalFoamGpm: number;
  /** Foam concentrate consumed in GPM */
  foamConcentrateGpm: number;
  /** Hydraulics for each active discharge line */
  lineHydraulics: Map<DischargeId, LineHydraulicsResult>;
}

/**
 * Calculate nozzle flow from nozzle configuration and pressure
 * 
 * For smooth-bore nozzles, uses the formula: Q = 29.7 * d² * √P
 * where d is tip diameter in inches and P is pressure in PSI
 * 
 * For fog/automatic nozzles, uses the target GPM from configuration
 * 
 * @param nozzle - Nozzle configuration from LineConfig
 * @param pressurePsi - Pressure at the nozzle in PSI
 * @returns Nozzle flow result with GPM and required pressure
 */
export function calculateNozzleFlow(
  nozzle: LineConfig['nozzle'],
  pressurePsi: number
): NozzleFlowResult {
  let gpm: number;
  let requiredPressure: number;
  
  switch (nozzle.type) {
    case 'smooth':
      // Smooth-bore handline: Q = 29.7 * d² * √P
      if (!nozzle.tipIn) {
        throw new Error('Smooth-bore nozzle requires tipIn parameter');
      }
      gpm = 29.7 * Math.pow(nozzle.tipIn, 2) * Math.sqrt(pressurePsi);
      requiredPressure = NOZZLE_PSI.HANDLINE_SMOOTH;
      break;
      
    case 'fog':
      // Fog/automatic nozzle: use target GPM
      if (!nozzle.targetGpm) {
        throw new Error('Fog nozzle requires targetGpm parameter');
      }
      gpm = nozzle.targetGpm;
      requiredPressure = NOZZLE_PSI.HANDLINE_FOG;
      break;
      
    case 'master_smooth':
      // Master stream smooth-bore: Q = 29.7 * d² * √P
      if (!nozzle.tipIn) {
        throw new Error('Master smooth-bore nozzle requires tipIn parameter');
      }
      gpm = 29.7 * Math.pow(nozzle.tipIn, 2) * Math.sqrt(pressurePsi);
      requiredPressure = NOZZLE_PSI.MASTER_SMOOTH;
      break;
      
    case 'master_fog':
      // Master stream fog: use target GPM
      if (!nozzle.targetGpm) {
        throw new Error('Master fog nozzle requires targetGpm parameter');
      }
      gpm = nozzle.targetGpm;
      requiredPressure = NOZZLE_PSI.MASTER_FOG;
      break;
  }
  
  return { gpm, pressurePsi: requiredPressure };
}

/**
 * Calculate hydraulics for a single discharge line
 * 
 * This function determines the actual flow, friction losses, and required
 * pump discharge pressure for a discharge line based on:
 * - Line configuration (hose size, length, nozzle type)
 * - Valve position (0-100%)
 * - Pump discharge pressure
 * - Whether foam is enabled on this line
 * 
 * @param lineConfig - Configuration for the discharge line
 * @param valvePct - Valve position (0-100% open)
 * @param pumpPressure - Pump discharge pressure in PSI
 * @param foamEnabled - Whether foam is enabled on this line
 * @returns Line hydraulics result
 */
export function calculateLineHydraulics(
  lineConfig: LineConfig,
  valvePct: number,
  pumpPressure: number,
  foamEnabled: boolean
): LineHydraulicsResult {
  // Note: foamEnabled parameter reserved for future foam-specific calculations
  void foamEnabled;
  
  // If valve is closed, no flow
  if (valvePct === 0) {
    return {
      flow: 0,
      frictionLoss: 0,
      nozzlePressure: 0,
      requiredPDP: 0,
    };
  }
  
  // Calculate flow based on nozzle type and available pressure
  const nozzleFlow = calculateNozzleFlow(lineConfig.nozzle, pumpPressure);
  
  // Adjust flow based on valve position (simplified model)
  // In reality, valve position affects pressure/flow relationship non-linearly
  const actualFlow = nozzleFlow.gpm * (valvePct / 100);
  
  // Calculate friction loss through the hose
  const frictionLoss = frictionLossPsi(
    {
      id: lineConfig.id,
      diameterIn: lineConfig.hose.diameterIn,
      lengthFt: lineConfig.hose.lengthFt,
      C: lineConfig.hose.C,
    },
    actualFlow
  );
  
  // Calculate nozzle pressure (pump pressure minus friction loss)
  const nozzlePressure = Math.max(0, pumpPressure - frictionLoss);
  
  // Calculate required PDP for optimal nozzle performance
  const requiredPDP = pumpDischargePressure({
    nozzlePressurePsi: nozzleFlow.pressurePsi, // Required nozzle pressure
    hoseLossPsi: frictionLoss,                  // Friction loss in hose
    applianceLossPsi: 0,                        // No appliance loss (simplified)
    elevationFt: 0                              // No elevation change (simplified)
  });
  
  return {
    flow: actualFlow,
    frictionLoss,
    nozzlePressure,
    requiredPDP,
  };
}

/**
 /**
  * Update foam concentrate consumption based on foam flow and time
  *
  * Calculates the amount of foam concentrate consumed and updates
  * the foam tank level. Will not allow tank to go below zero.
  * Only consumes foam if foam system is enabled.
  *
  * @param foamSystem - Current foam system state
  * @param totalFoamGPM - Total water flow through foam-enabled lines (GPM)
  * @param deltaTimeSeconds - Time elapsed since last update (seconds)
  * @param foamSystemEnabled - Whether foam system master is enabled
  * @returns Updated foam system state
  */
 export function updateFoamConsumption(
   foamSystem: FoamSystem,
   totalFoamGPM: number,
   deltaTimeSeconds: number,
   foamSystemEnabled: boolean = true
 ): FoamSystem {
   // Only consume foam if system is enabled and there's foam flow
   if (!foamSystemEnabled || totalFoamGPM === 0 || foamSystem.tankGallons <= 0) {
     return foamSystem;
   }
   
   // Calculate foam concentrate consumption
   // Formula: concentrate (gal) = (percent/100) * water_flow (GPM) * time (min)
   const concentrateGPM = (foamSystem.percent / 100) * totalFoamGPM;
   const concentrateUsed = concentrateGPM * (deltaTimeSeconds / 60);
   
   // Update tank level (don't allow negative)
   const newTankGallons = Math.max(0, foamSystem.tankGallons - concentrateUsed);
   
   return {
     ...foamSystem,
     tankGallons: newTankGallons,
   };
 }

/**
* Get nozzle pressure requirement for nozzle type
*/
function getNozzlePressureForType(nozzleType: string): number {
  switch (nozzleType) {
    case 'smooth': return NOZZLE_PSI.HANDLINE_SMOOTH;  // 50 PSI
    case 'fog': return NOZZLE_PSI.HANDLINE_FOG;        // 100 PSI
    case 'master_smooth': return NOZZLE_PSI.MASTER_SMOOTH; // 80 PSI
    case 'master_fog': return NOZZLE_PSI.MASTER_FOG;   // 100 PSI
    default: return 100;
  }
}

/**
 * Calculate smooth bore flow using rule of thumb: GPM ≈ 29.7 × d² × √NP
 * Where d is tip diameter in inches, NP is nozzle pressure
 */
function calculateSmoothBoreFlow(tipDiameterIn: number, nozzlePsi: number): number {
  return 29.7 * Math.pow(tipDiameterIn, 2) * Math.sqrt(nozzlePsi);
}

// Global governor state (will be moved to PumpState in future refactor)
let globalGovernorState: GovernorState | null = null;

/**
 * Perform a simulation step for the pump panel system
 *
 * This is the main simulation function that:
 * 1. Checks pump interlocks
 * 2. Calculates hydraulics for all active discharge lines
 * 3. Applies DRV logic if enabled
 * 4. Determines total flow and foam consumption
 * 5. Updates foam tank level and runtime parameters
 * 6. Uses PID controller for smooth governor operation
 * 7. Returns updated state and diagnostics
 *
 * @param currentState - Current pump state
 * @param deltaTimeSeconds - Time step in seconds
 * @returns Object with updated state and diagnostics
 */
export function simulateStep(
  currentState: PumpState,
  deltaTimeSeconds: number
): { state: PumpState; diagnostics: SimulationDiagnostics } {
  // Initialize governor state if needed
  if (!globalGovernorState) {
    globalGovernorState = createGovernor();
    globalGovernorState.mode = currentState.runtime.governor;
  }
  
  // Sync governor mode with state
  if (globalGovernorState.mode !== currentState.runtime.governor) {
    globalGovernorState = switchGovernorMode(globalGovernorState, currentState.runtime.governor);
  }
  // Check interlocks - if pump not engaged or emergency stop active, zero all flows
  if (!currentState.interlocks.engaged || currentState.interlocks.emergencyStop) {
    const lineHydraulics = new Map<DischargeId, LineHydraulicsResult>();
    
    // Return state with zero flows and idle engine
    const updatedState: PumpState = {
      ...currentState,
      runtime: {
        ...currentState.runtime,
        rpm: currentState.interlocks.emergencyStop ? 0 : 800, // E-stop kills engine
      },
      drv: {
        ...currentState.drv,
        bypassGpm: 0,
      },
    };
    
    const diagnostics: SimulationDiagnostics = {
      totalWaterGpm: 0,
      totalFoamGpm: 0,
      foamConcentrateGpm: 0,
      lineHydraulics,
    };
    
    return { state: updatedState, diagnostics };
  }
  
  // STEP 1: Calculate required PDP from all open discharge lines (nozzle-back)
  let requiredPDP = 0;
  const openLines: Array<{ id: DischargeId; flowGpm: number; requiredPDP: number }> = [];
  
  for (const lineId of Object.keys(currentState.dischargeValvePct) as DischargeId[]) {
    const valvePct = currentState.dischargeValvePct[lineId];
    
    if (valvePct > 0 && currentState.interlocks.engaged) {
      const lineConfig = currentState.lineConfigs[lineId];
      
      // Get nozzle pressure requirement
      const nozzlePressure = getNozzlePressureForType(lineConfig.nozzle.type);
      
      // Calculate flow for this line based on nozzle and pressure
      const expectedFlow = lineConfig.nozzle.targetGpm ||
                           calculateSmoothBoreFlow(lineConfig.nozzle.tipIn || 1.0, nozzlePressure);
      
      // Calculate friction loss for this hose
      const frictionLoss = frictionLossPsi(lineConfig.hose, expectedFlow * (valvePct / 100));
      
      // TODO: Add appliance loss if applicable (10-25 PSI for wyes, etc.)
      const applianceLoss = 0;
      
      // TODO: Add elevation loss if applicable (0.434 PSI/ft)
      const elevationLoss = 0;
      
      // Required PDP for this line
      const linePDP = nozzlePressure + frictionLoss + applianceLoss + elevationLoss;
      
      // Track line info
      openLines.push({
        id: lineId,
        flowGpm: expectedFlow * (valvePct / 100),
        requiredPDP: linePDP
      });
      
      // Highest line requirement becomes overall required PDP
      requiredPDP = Math.max(requiredPDP, linePDP);
    }
  }
  
  // Total flow is sum of all open lines
  const totalFlowGpm = openLines.reduce((sum, line) => sum + line.flowGpm, 0);
  
  // STEP 2: Determine intake pressure based on water source
  let intakePsi = 0;
  
  switch (currentState.waterSource) {
    case 'tank':
      // Tank-to-Pump valve must be open to get tank pressure
      // If tank is empty, no pressure available
      if (currentState.tankGallons <= 0) {
        intakePsi = 0;  // No water = no pressure
      } else {
        intakePsi = currentState.tankToPumpOpen ? 45 : 0;  // 45 PSI baseline when open
      }
      break;
      
    case 'hydrant':
      // Use hydrant residual pressure (from state or default 50 PSI)
      intakePsi = currentState.intakePressurePsi || 50;
      break;
      case 'draft':
        // Drafting shows vacuum (negative pressure)
        // If primed, pump can pull against vacuum; if not, can't pump
        if (currentState.interlocks.primed) {
          intakePsi = -12;  // Typical vacuum when primed and flowing (~5 inHg)
        } else {
          intakePsi = -22;  // High vacuum when not primed (~10 inHg, can't pump)
        }
        break;
      break;
      
    case 'relay':
      // Upstream pump provides positive pressure
      intakePsi = currentState.intakePressurePsi || 20;
      break;
  }
  
  // STEP 3: Determine actual RPM and achievable PDP based on governor mode with PID control
  let actualRpm = currentState.runtime.rpm;
  let achievedPDP = 0;
  
  if (currentState.runtime.governor === 'PRESSURE') {
    // PRESSURE MODE: Governor adjusts RPM using PID control to meet target PDP
    const targetPDP = Math.min(requiredPDP, 400);  // 400 PSI safety clamp
    
    // Update governor target
    globalGovernorState = setTargetPDP(globalGovernorState, targetPDP);
    
    // Use PID controller to gradually adjust RPM
    actualRpm = updatePressureGovernor(
      {
        ...currentState,
        dischargePsi: currentState.dischargePsi || 0
      },
      globalGovernorState,
      deltaTimeSeconds
    );
    
    // Calculate what PDP is actually achieved at this RPM
    achievedPDP = calculateMaxPDP(totalFlowGpm, actualRpm, intakePsi);
    achievedPDP = Math.min(achievedPDP, 400);  // Safety clamp
    
  } else {
    // RPM MODE: Operator controls RPM directly via throttle, governor maintains it
    const targetRpm = 700 + (currentState.throttle / 100) * 1500; // 700-2200 RPM range
    
    // Update governor target
    globalGovernorState = setTargetRPM(globalGovernorState, targetRpm);
    
    // In RPM mode, governor simply maintains the set RPM
    actualRpm = updateRPMGovernor(currentState, globalGovernorState);
    
    // Calculate achieved PDP at this fixed RPM
    achievedPDP = calculateMaxPDP(totalFlowGpm, actualRpm, intakePsi);
    achievedPDP = Math.min(achievedPDP, 400);  // Still clamp at 400 PSI
  }
  
  // STEP 3.5: Detect cavitation and apply performance degradation
  // Cavitation occurs when intake pressure is too low (<5 PSI) with high RPM (>2000)
  const isCavitating = (intakePsi < 5) && (actualRpm > 2000);
  
  // Apply 20% performance degradation during cavitation
  if (isCavitating) {
    achievedPDP *= 0.8;  // 20% reduction in pump discharge pressure
  }
  
  // STEP 4: Block flow if drafting and not primed
  let actualTotalFlowGpm = totalFlowGpm;
  if (currentState.waterSource === 'draft' && !currentState.interlocks.primed) {
    // Can't pump air - zero all flows
    openLines.forEach(line => line.flowGpm = 0);
    actualTotalFlowGpm = 0;
    achievedPDP = 0;
    // Show vacuum building on compound gauge (handled in gauges.ts)
  }
  
  // STEP 5: Apply DRV (discharge relief valve)
  const { adjustedPDP, bypassGpm } = applyDRV(currentState, achievedPDP);
  let pumpPressure = adjustedPDP;
  
  // STEP 5.5: Track overpressure and handle hose burst (Phase 2.3)
  let overpressureDuration = currentState.overpressureDurationSec || 0;
  const burstLines = new Set(currentState.burstLines || []);
  let overpressureWarning: string | null = null;
  
  // Track overpressure duration when discharge pressure exceeds 400 PSI
  if (achievedPDP > 400) {
    overpressureDuration += deltaTimeSeconds;
    
    // Critical overpressure warning with countdown
    const timeUntilBurst = Math.max(0, 5 - overpressureDuration);
    if (timeUntilBurst > 0) {
      overpressureWarning = `⚠️ OVERPRESSURE: Hose burst in ${timeUntilBurst.toFixed(1)}s`;
    }
    
    // Trigger hose burst after 5 seconds of sustained overpressure
    if (overpressureDuration >= 5 && openLines.length > 0) {
      // Find the line with highest flow rate (most stressed)
      const highestFlowLine = openLines.reduce((max, line) =>
        line.flowGpm > max.flowGpm ? line : max
      );
      
      // Only burst if not already burst
      if (!burstLines.has(highestFlowLine.id)) {
        burstLines.add(highestFlowLine.id);
        overpressureWarning = `⚠️ HOSE ${highestFlowLine.id.toUpperCase()} BURST - Replace before continuing`;
        
        // Close the burst line valve immediately
        currentState = {
          ...currentState,
          dischargeValvePct: {
            ...currentState.dischargeValvePct,
            [highestFlowLine.id]: 0
          }
        };
        
        // Reset overpressure duration after burst
        overpressureDuration = 0;
      }
    }
  } else {
    // Reset overpressure duration when pressure returns to normal
    overpressureDuration = 0;
  }
  
  // Add high pressure warning at 350 PSI (yellow warning)
  if (achievedPDP > 350 && achievedPDP <= 400) {
    overpressureWarning = '⚠️ High discharge pressure';
  }
  
  // STEP 6: Calculate recirculation flow and tank filling/depletion
  let recircFlowGpm = 0;
  let tankFillRateGpm = 0;
  let updatedTankGallons = currentState.tankGallons;
  
  // Tank depletion (Phase 2.5)
  if (currentState.waterSource === 'tank' && currentState.interlocks.engaged && actualTotalFlowGpm > 0) {
    // Deplete tank water based on actual flow
    const waterUsedGallons = actualTotalFlowGpm * (deltaTimeSeconds / 60);
    updatedTankGallons = Math.max(0, currentState.tankGallons - waterUsedGallons);
  }
  
  // Tank filling from hydrant (Phase 1.7 - existing functionality)
  if (currentState.tankFillRecircPct > 0) {
    // Calculate recirculation flow (0-50 GPM based on percentage)
    recircFlowGpm = (currentState.tankFillRecircPct / 100) * 50;
    
    // Tank filling only works when on hydrant source
    if (currentState.waterSource === 'hydrant') {
      // Calculate tank fill rate (0-100 GPM based on percentage)
      tankFillRateGpm = (currentState.tankFillRecircPct / 100) * 100;
      
      // Fill tank (convert GPM to gallons per frame)
      const tankCapacityGallons = 500; // Standard tank capacity
      const gallonsAdded = tankFillRateGpm * (deltaTimeSeconds / 60);
      updatedTankGallons = Math.min(tankCapacityGallons, updatedTankGallons + gallonsAdded);
    }
  }
  
  // Add recirculation flow to total for cooling purposes (doesn't affect discharge pressure)
  const totalFlowWithRecirc = actualTotalFlowGpm + recircFlowGpm;

  // STEP 7: Update temperatures and check for overheating
  const temps = updateTemperatures(
    { ...currentState, totalFlowGpm: totalFlowWithRecirc, runtimeRpm: actualRpm },
    deltaTimeSeconds
  );
  
  // STEP 8: Get governor warnings
  const governorWarnings = getGovernorWarnings(
    currentState.runtime.governor === 'PRESSURE'
      ? { mode: 'PRESSURE', targetRPM: 0, targetPDP: requiredPDP, pidState: { ePrev: 0, integral: 0 } }
      : { mode: 'RPM', targetRPM: actualRpm, targetPDP: 0, pidState: { ePrev: 0, integral: 0 } },
    achievedPDP,
    currentState.waterSource
  );
  
  // STEP 9: Check for auto-switch conditions
  const autoSwitch = shouldAutoSwitchMode(
    currentState.runtime.governor,
    achievedPDP,
    currentState.waterSource
  );
  
  let updatedGovernorMode = currentState.runtime.governor;
  if (autoSwitch.shouldSwitch && autoSwitch.newMode) {
    updatedGovernorMode = autoSwitch.newMode;
    
    // Add warning about auto-switch
    if (autoSwitch.reason) {
      governorWarnings.push(autoSwitch.reason);
    }
  }
  
  // STEP 10: Apply cavitation degradation if overheating while drafting
  if (temps.pumpOverheating && currentState.waterSource === 'draft') {
    achievedPDP *= 0.85;  // 15% performance loss from cavitation
    pumpPressure *= 0.85;
  }
  
  // STEP 11: Update primer countdown and vacuum simulation
  let primerTimeRemaining = currentState.primerTimeRemaining;
  let primerVacuumInHg = 0;
  
  if (currentState.primerActive && primerTimeRemaining > 0) {
    primerTimeRemaining = Math.max(0, primerTimeRemaining - deltaTimeSeconds);
    
    // Simulate vacuum building during priming (0 to -25 inHg over 15 seconds)
    const primingProgress = 1 - (primerTimeRemaining / 15);
    primerVacuumInHg = -25 * primingProgress; // Gradually increase vacuum
    
    // If primer cycle completes, set primed flag
    if (primerTimeRemaining === 0 && !currentState.interlocks.primed) {
      currentState = {
        ...currentState,
        interlocks: { ...currentState.interlocks, primed: true }
      };
    }
  }
  
  // Apply primer vacuum to intake gauge when drafting and priming
  if (currentState.waterSource === 'draft' && currentState.primerActive) {
    intakePsi = primerVacuumInHg / 2.036; // Convert inHg to PSI for display
  }
  
  // Track foam flow
  let totalFoamGpm = 0;
  const lineHydraulics = new Map<DischargeId, LineHydraulicsResult>();
  
  for (const line of openLines) {
    const lineConfig = currentState.lineConfigs[line.id];
    const foamEnabled = currentState.foam.enabledLines.has(line.id);
    
    // Calculate line hydraulics for diagnostics
    const frictionLoss = frictionLossPsi(lineConfig.hose, line.flowGpm);
    const nozzlePressure = Math.max(0, pumpPressure - frictionLoss);
    
    lineHydraulics.set(line.id, {
      flow: line.flowGpm,
      frictionLoss,
      nozzlePressure,
      requiredPDP: line.requiredPDP,
    });
    
    // Track foam flow if enabled on this line
    if (foamEnabled && lineConfig.foamCapable) {
      totalFoamGpm += line.flowGpm;
    }
  }
  
  // STEP 12: Update foam consumption (if foam system enabled OR any lines have foam enabled)
  const hasEnabledFoamLines = currentState.foam.enabledLines.size > 0;
  const foamSystemEnabled = (currentState.foam.enabled || hasEnabledFoamLines) && currentState.interlocks.engaged && totalFoamGpm > 0;
  
  const updatedFoam = updateFoamConsumption(
    currentState.foam,
    totalFoamGpm,
    deltaTimeSeconds,
    foamSystemEnabled
  );
  
  // Calculate foam concentrate consumption rate
  const foamConcentrateGpm = currentState.foam.enabled ? (updatedFoam.percent / 100) * totalFoamGpm : 0;
  
  // Calculate gauge readings for display
  const intakeGaugeData = intakeGauge(
    currentState.waterSource,
    intakePsi,
    currentState.tankToPumpOpen,
    currentState.interlocks.primed
  );

  const dischargeGaugeData = dischargeGauge(achievedPDP);

  // Combine all warnings including gauge warnings
  const allWarnings = new Set<string>([
    ...getTemperatureWarnings(temps),
    ...governorWarnings
  ]);
  
  // Add warning if tank-to-pump valve is closed when pump is engaged
  if (!currentState.tankToPumpOpen && currentState.interlocks.engaged) {
    allWarnings.add('Open Tank-to-Pump valve');
  }
  // Add warning if trying to draft without priming
  if (currentState.waterSource === 'draft' &&
      !currentState.interlocks.primed &&
      !currentState.primerActive &&
      currentState.interlocks.engaged &&
      actualTotalFlowGpm > 0) {
    allWarnings.add('Prime pump to flow from draft');
  }
  
  // Add cavitation warning
  if (isCavitating) {
    allWarnings.add('⚠️ CAVITATION DETECTED: Pump starved');
  }
  
  // Add runout warning (Phase 6.1)
  const runoutWarning = checkRunoutCondition(actualTotalFlowGpm);
  if (runoutWarning) {
    allWarnings.add(runoutWarning);
  }
  
  // Add overpressure warning (Phase 2.3)
  if (overpressureWarning) {
    allWarnings.add(overpressureWarning);
  }
  
  // Add tank water level warnings (Phase 2.5)
  if (currentState.waterSource === 'tank') {
    if (updatedTankGallons <= 0) {
      allWarnings.add('🚨 WATER TANK EMPTY - Switch water source');
    } else if (updatedTankGallons < 50) {
      allWarnings.add(`⚠️ Tank critically low: ${Math.round(updatedTankGallons)} gal remaining`);
    } else if (updatedTankGallons < 100) {
      allWarnings.add(`Tank water low: ${Math.round(updatedTankGallons)} gal remaining`);
    }
  }
  
  // Add recirculation/tank fill status messages
  if (recircFlowGpm > 0) {
    if (tankFillRateGpm > 0) {
      allWarnings.add(`TANK FILL: ${Math.round(tankFillRateGpm)} GPM`);
    } else {
      allWarnings.add(`RECIRC: ${Math.round(recircFlowGpm)} GPM`);
    }
  }
  
  // Add gauge warnings to overall warnings
  if (intakeGaugeData.warning) {
    allWarnings.add(intakeGaugeData.warning);
  }
  if (dischargeGaugeData.warning) {
    allWarnings.add(dischargeGaugeData.warning);
  }
  
  // Create updated state
  const updatedState: PumpState = {
    ...currentState,
    foam: updatedFoam,
    runtime: {
      ...currentState.runtime,
      rpm: actualRpm,
      governor: updatedGovernorMode,
    },
    drv: {
      ...currentState.drv,
      bypassGpm,
    },
    dischargePsi: dischargeGaugeData.psi,
    intakePressurePsi: intakeGaugeData.psi || 0,
    intakeVacuumInHg: intakeGaugeData.vacuumInHg || 0,
    totalFlowGpm: actualTotalFlowGpm,
    tankGallons: updatedTankGallons,
    pumpTempF: temps.pumpTempF,
    engineTempF: temps.engineTempF,
    warnings: allWarnings,
    primerTimeRemaining,
    isCavitating,
    overpressureDurationSec: overpressureDuration,
    burstLines,
  };
  
  // Create diagnostics
  const diagnostics: SimulationDiagnostics = {
    totalWaterGpm: actualTotalFlowGpm,
    totalFoamGpm,
    foamConcentrateGpm,
    lineHydraulics,
  };
  
  return { state: updatedState, diagnostics };
}

/**
 * Calculate RPM needed to achieve target pressure (simplified governor model)
 * Uses centrifugal pump law: P ∝ RPM^2, so RPM ∝ sqrt(P)
 */
function calculateRPMForPressure(targetPDP: number, setpoint: number): number {
  // Simplified: RPM scales with square root of pressure (centrifugal pump law)
  // P ∝ RPM^2, so RPM ∝ sqrt(P)
  const baseRPM = 2000; // idle
  const maxRPM = 3000;
  const rpm = baseRPM + Math.sqrt(targetPDP / 150) * (maxRPM - baseRPM);
  return Math.min(maxRPM, rpm);
}

/**
 * Stub for temperature updates (Phase 2.4)
 * Will update pump and engine temperatures based on flow and RPM
 *
 * @param state Current simulation state
 * @param deltaTime Time elapsed since last update in seconds
 * @returns Temperature-related state updates
 */
function updateTemperaturesStub(state: SimState, deltaTime: number): Partial<SimState> {
  // TODO: Implement in Phase 2.4
  // Will track pumpTempF and engineTempF based on:
  // - Flow rate (cooling effect)
  // - RPM (heat generation)
  // - Time running
  return {};
}

/**
 * Update tank water level based on usage (Phase 2.5)
 * Depletes tank water when using tank as water source
 *
 * @param state Current simulation state
 * @param deltaTime Time elapsed since last update in seconds
 * @returns Tank-related state updates
 */
function updateTankWater(state: SimState, deltaTime: number): Partial<SimState> {
  // Only deplete tank water if all conditions are met:
  // 1. Water source is 'tank'
  // 2. Pump is engaged
  // 3. Tank has water remaining
  // 4. There is actual flow
  
  // Check if we need to calculate tank depletion at all
  if (!state.pump.engaged) {
    return {};
  }
  
  // We need to estimate total flow from discharge valves
  // This is a simplified calculation for time-based updates
  let estimatedTotalFlow = 0;
  
  Object.values(state.discharges).forEach(discharge => {
    if (discharge.open > 0) {
      // Rough estimate: 100 GPM per 100% valve opening for typical lines
      // This will be refined by the full hydraulics solver
      const baseFlow = discharge.diameterIn <= 2.5 ? 100 : 250; // Smaller vs larger lines
      estimatedTotalFlow += discharge.open * baseFlow;
    }
  });
  
  // No flow means no tank depletion
  if (estimatedTotalFlow === 0) {
    return {};
  }
  
  // Now we can check water source (after we know there's flow)
  // The water source check needs to be done on the pump's intake configuration
  // For now, we'll return empty - the main simulateStep will handle tank depletion
  return {};
}

/**
 * Update time-based state properties
 * Called by TICK action every 100ms to update foam consumption, temperature, tank water, etc.
 * Only returns properties that have changed due to time-based updates.
 *
 * @param state Current simulation state
 * @param deltaTime Time elapsed since last update in seconds
 * @returns Partial state with time-based updates only
 */
export function updateTimeBasedState(state: SimState, deltaTime: number): Partial<SimState> {
  const updates: Partial<SimState> = {};
  
  // Only perform updates if pump is engaged
  if (!state.pump.engaged) {
    return updates;
  }
  
  // Calculate foam consumption if foam system is enabled
  if (state.pump.foamSystemEnabled) {
    // Calculate total foam flow (water flowing through foam-enabled lines)
    let totalFoamGpm = 0;
    
    Object.values(state.discharges).forEach(discharge => {
      if (discharge.foamPct > 0 && discharge.open > 0) {
        // Estimate flow based on valve position and hose size
        // This is a simplified calculation; full hydraulics are in solver
        const estimatedFlow = discharge.open * 100; // Simplified GPM estimate
        totalFoamGpm += estimatedFlow;
      }
    });
    
    if (totalFoamGpm > 0 && state.pump.foamTankGallons > 0) {
      // Calculate foam concentrate consumption
      // Average foam percentage across all foam lines (simplified)
      let avgFoamPct = 0;
      let foamLineCount = 0;
      
      Object.values(state.discharges).forEach(discharge => {
        if (discharge.foamPct > 0 && discharge.open > 0) {
          avgFoamPct += discharge.foamPct;
          foamLineCount++;
        }
      });
      
      if (foamLineCount > 0) {
        avgFoamPct = avgFoamPct / foamLineCount;
        
        // Formula: concentrate (gal) = (percent/100) * water_flow (GPM) * time (min)
        const concentrateGPM = (avgFoamPct / 100) * totalFoamGpm;
        const concentrateUsed = concentrateGPM * (deltaTime / 60);
        
        // Update tank level (don't allow negative)
        const newTankGallons = Math.max(0, state.pump.foamTankGallons - concentrateUsed);
        
        updates.pump = {
          ...state.pump,
          foamTankGallons: newTankGallons,
        };
      }
    }
  }
  
  // Call stub functions for future features
  // These will be implemented in later phases
  const tempUpdates = updateTemperaturesStub(state, deltaTime);
  const tankUpdates = updateTankWater(state, deltaTime);
  
  // Merge all updates
  return { ...updates, ...tempUpdates, ...tankUpdates };
}

/**
 * NEW ARCHITECTURE: Update simulation using the simplified state and solver
 * This is the new data flow:
 * User input → dispatch(action) → state reducer → hydraulics solver → updated state → render
 *
 * @param state Current simulation state (simplified structure)
 * @param deltaTime Time elapsed since last update in seconds
 * @returns Updated state
 */
export function updateSimulation(state: any, deltaTime: number): any {
  // Import at function level to avoid circular dependencies during transition
  const { solveHydraulics } = require('./solver');
  
  // Run hydraulics solver
  const result = solveHydraulics(state);
  
  // Update pump state with computed values
  const newState = {
    ...state,
    pump: {
      ...state.pump,
      pdp: result.requiredPDP,
      intakePsi: result.intakePsi,
      // RPM updates based on governor mode
      rpm: state.pump.governor === 'RPM'
        ? state.pump.setpoint
        : calculateRPMForPressure(result.requiredPDP, state.pump.setpoint),
    },
  };

  // Deplete foam tank if foam is flowing and foam system is enabled
  let foamUsed = 0;
  if (newState.pump.foamSystemEnabled && newState.pump.engaged && newState.pump.foamTankGallons > 0) {
    Object.entries(result.dischargeFlows).forEach(([id, flow]) => {
      const discharge = newState.discharges[id];
      if (discharge && discharge.foamPct > 0) {
        foamUsed += (flow * discharge.foamPct / 100) * (deltaTime / 60); // gallons per frame
      }
    });
    
    if (foamUsed > 0) {
      newState.pump.foamTankGallons = Math.max(0, newState.pump.foamTankGallons - foamUsed);
    }
  }

  return newState;
}