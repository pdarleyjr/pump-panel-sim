import type { PumpState } from './model';

/**
 * Temperature state for pump and engine
 */
export interface TemperatureState {
  pumpTempF: number;                    // Pump casing temperature
  engineTempF: number;                  // Engine coolant temperature
  pumpOverheating: boolean;             // Pump > 200°F
  engineOverheating: boolean;           // Engine > 230°F
}

/**
 * Update pump and engine temperatures based on operating conditions
 *
 * Phase 2.4: Temperature Tracking Implementation
 * - Pump heats rapidly (5°F/sec) when engaged with inadequate flow (<10 GPM)
 * - Pump cools with adequate flow (≥10 GPM) or recirculation
 * - Engine temperature tracks RPM load (180-220°F range)
 * - Recirculation provides effective cooling
 */
export function updateTemperatures(
  state: PumpState,
  deltaTime: number // seconds since last update
): TemperatureState {
  let pumpTemp = state.pumpTempF;
  let engineTemp = state.engineTempF;
  
  // Calculate total discharge flow for cooling calculations
  const totalDischargeFlowGpm = state.totalFlowGpm || 0;
  
  // Calculate recirculation flow (0-50 GPM based on percentage)
  const recircFlowGpm = (state.tankFillRecircPct / 100) * 50;
  
  // Combined cooling flow (discharge + recirculation)
  const coolingFlowGpm = totalDischargeFlowGpm + recircFlowGpm;
  
  // Pump temperature dynamics
  if (state.interlocks.engaged) {
    // Check total cooling flow (discharge + recirculation)
    if (coolingFlowGpm >= 10) {
      // COOLING: Adequate cooling with flow
      pumpTemp -= 2 * deltaTime; // 2°F per second
    } else {
      // HEATING: Inadequate flow - rapid heating
      pumpTemp += 5 * deltaTime; // 5°F per second
    }
  } else {
    // NATURAL COOLING: When pump is off
    pumpTemp -= 1 * deltaTime; // Slow ambient cooling
  }
  
  // Clamp pump temperature to realistic range (70°F ambient to 250°F critical)
  pumpTemp = Math.max(70, Math.min(250, pumpTemp));
  
  // Engine temperature dynamics
  const rpm = state.runtime?.rpm || 0;
  
  // Engine target temperature based on RPM load (180-220°F range)
  const targetTemp = 180 + (rpm / 3000) * 40; // 180°F at idle, 220°F at max RPM
  
  // Gradual adjustment toward target temperature
  const tempDiff = targetTemp - engineTemp;
  engineTemp += tempDiff * 0.1 * deltaTime; // Gradual adjustment
  
  // Clamp engine temperature to realistic range
  engineTemp = Math.max(140, Math.min(250, engineTemp));
  
  // Determine overheating status
  const pumpOverheating = pumpTemp > 200;      // Pump danger zone
  const engineOverheating = engineTemp > 230;  // Engine danger zone
  
  return {
    pumpTempF: pumpTemp,
    engineTempF: engineTemp,
    pumpOverheating,
    engineOverheating,
  };
}

/**
 * Generate warning messages based on temperature state
 *
 * Phase 2.4: Multi-level temperature warnings
 * - Yellow warning at 180°F (elevated)
 * - Orange warning at 200°F (overheating)
 * - Red warning at 212°F (critical - boiling point)
 */
export function getTemperatureWarnings(temps: TemperatureState): string[] {
  const warnings: string[] = [];
  
  // Pump temperature warnings (3 levels)
  if (temps.pumpTempF > 212) {
    // CRITICAL: Boiling point - steam damage risk
    warnings.push(`🚨 CRITICAL: Pump boiling! Steam damage risk! (${Math.round(temps.pumpTempF)}°F)`);
    warnings.push('Increase flow or enable recirculation to cool pump');
  } else if (temps.pumpTempF > 200) {
    // OVERHEATING: Danger zone
    warnings.push(`⚠️ Pump Overheating: ${Math.round(temps.pumpTempF)}°F`);
    warnings.push('Increase flow or enable recirculation to cool pump');
  } else if (temps.pumpTempF > 180) {
    // ELEVATED: Warning zone
    warnings.push(`Pump temperature elevated: ${Math.round(temps.pumpTempF)}°F`);
    warnings.push('Increase flow or enable recirculation to cool pump');
  }
  
  // Engine temperature warning
  if (temps.engineOverheating) {
    warnings.push(`⚠️ Engine Overheating: ${Math.round(temps.engineTempF)}°F`);
  }
  
  return warnings;
}