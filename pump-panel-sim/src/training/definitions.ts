/**
 * Control definitions for educational overlay system
 * Provides detailed explanations of pump panel controls and concepts
 */

/**
 * Control definitions for educational overlay
 * Maps control IDs to their educational descriptions
 */
export const CONTROL_DEFINITIONS: Record<string, string> = {
  throttle: 'Controls engine speed (RPM). Higher RPM increases pump discharge pressure. Typical range: 800-3000 RPM.',
  
  pump_engage: 'Main pump engagement switch. Must be ON for pump operations. When OFF, all discharge flows cease.',
  
  drv: 'Discharge Relief Valve. Automatically bypasses flow when pressure exceeds setpoint, protecting the system from dangerous surges.',
  
  discharge_valve: 'Opens/closes water flow to this discharge line. Rotate clockwise to increase flow. Each line has independent control.',
  
  intake_pressure: 'Shows incoming water pressure from hydrant, tank, or draft source. Minimum 20 PSI recommended for hydrant operations.',
  
  discharge_pressure: 'Pump Discharge Pressure (PDP). Must overcome friction loss, nozzle pressure, elevation, and appliance losses.',
  
  foam_system: 'Proportioning system that injects foam concentrate into the water stream. Adjustable from 0.1% to 1.0% (or higher for Class A).',
  
  governor_mode: 'RPM mode maintains constant engine speed. PRESSURE mode maintains constant discharge pressure by auto-adjusting throttle.',
  
  engine_rpm: 'Current engine speed in revolutions per minute. Directly affects pump discharge pressure. Idle: 800 RPM, Max: 3000 RPM.',
  
  water_source: 'Current water supply: Tank (onboard), Hydrant (municipal), Draft (static source), or Relay (another apparatus).',
  
  tank_level: 'Remaining water in onboard tank. Typical capacity: 500-750 gallons. Monitor closely when operating from tank.',
  
  foam_tank: 'Remaining foam concentrate. Typical capacity: 20-40 gallons. Consumption rate depends on percentage and flow rate.',
  
  priming: 'Removes air from pump and creates vacuum for drafting. Required when pumping from static water sources below pump level.',
  
  emergency_stop: 'Immediately shuts down pump operations. Use in emergency situations only. Reset required to resume operations.',
  
  intake_valve: 'Controls water flow from intake source. Must be open when operating from external water supply (hydrant, draft, relay).',
  
  master_stream: 'High-flow large diameter discharge line. Typically 500-1500 GPM. Used for heavy fire attack or exposure protection.',
  
  cross_lay: 'Pre-connected attack line stored in cross-bed. Usually 1¾" diameter, 150-200 feet. Quick deployment for initial attack.',
  
  nozzle_pressure: 'Pressure at the nozzle tip. Handline fog: 100 PSI, Handline smooth-bore: 50 PSI, Master stream: 80-100 PSI.',
  
  friction_loss: 'Pressure lost due to water flowing through hose. Increases with flow rate and hose length. Decreases with larger diameter.',
  
  tank_to_pump: 'Tank-to-Pump Valve: Opens connection from water tank to pump intake. Must be open to pump from tank. Verify 40-50 PSI baseline pressure when opened at idle.',
  
  tank_fill_recirc: 'Tank Fill/Recirculating Valve: Controls water flow back to tank for cooling. Open to ~33% during high-load operations to prevent pump overheating. Higher percentages provide more cooling but reduce discharge capacity.',
  
  primer: 'Primer Button: Activates primer to evacuate air from pump and intake hose when drafting. Hold for 10-15 seconds until pump is primed. Compound gauge will show vacuum building. Cannot pump until primed.',
};

/**
 * Get definition for a control ID
 * 
 * @param controlId - The control identifier
 * @returns Definition string or undefined if not found
 */
export function getDefinition(controlId: string): string | undefined {
  return CONTROL_DEFINITIONS[controlId];
}

/**
 * Get all available control IDs with definitions
 * 
 * @returns Array of control IDs
 */
export function getAllDefinitionIds(): string[] {
  return Object.keys(CONTROL_DEFINITIONS);
}

/**
 * Search definitions by keyword
 * 
 * @param keyword - Search term
 * @returns Array of matching control IDs
 */
export function searchDefinitions(keyword: string): string[] {
  const lowerKeyword = keyword.toLowerCase();
  return Object.entries(CONTROL_DEFINITIONS)
    .filter(([_key, definition]) => definition.toLowerCase().includes(lowerKeyword))
    .map(([id]) => id);
}

/**
 * Training scenario definition
 */
export interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  setup: Record<string, any>;
  objectives: string[];
  faultConditions: string[];
}

/**
 * Pierce PUC-specific training scenarios
 * Educational scenarios matching the operational manual
 */
export const PIERCE_PUC_SCENARIOS: Record<string, TrainingScenario> = {
  cavitation: {
    id: 'cavitation',
    title: 'Cavitation Detection',
    description: 'Recognize and respond to pump cavitation',
    setup: {
      waterSource: 'draft',
      intakePressure: -15, // High vacuum
      throttlePercent: 80,
    },
    objectives: [
      'Recognize cavitation symptoms',
      'Reduce throttle to decrease flow demand',
      'Check intake strainer for blockage',
    ],
    faultConditions: [
      'Increasing throttle when cavitating',
      'Ignoring vacuum gauge warnings',
    ],
  },
  
  changeover: {
    id: 'changeover',
    title: 'Tank-to-Hydrant Changeover',
    description: 'Perform proper changeover from tank to hydrant',
    setup: {
      waterSource: 'tank',
      tankLevel: 500,
      dischargePressure: 150,
    },
    objectives: [
      'Open intake gate valve',
      'Verify intake pressure stable',
      'Close tank-to-pump valve',
      'Maintain discharge pressure throughout',
    ],
    faultConditions: [
      'Opening both valves simultaneously',
      'Closing tank valve before intake stabilizes',
      'Pressure drop > 20 PSI during changeover',
    ],
  },
  
  overpressure: {
    id: 'overpressure',
    title: 'Overpressure Response',
    description: 'Prevent and respond to overpressure conditions',
    setup: {
      throttlePercent: 90,
      dischargePressure: 360,
      allValvesClosed: true, // Dead-end scenario
    },
    objectives: [
      'Recognize warning at 350 PSI',
      'Reduce throttle immediately',
      'Open a discharge line',
      'Keep pressure < 400 PSI',
    ],
    faultConditions: [
      'Exceeding 400 PSI',
      'Continuing to increase throttle',
    ],
  },
  
  intakeMonitoring: {
    id: 'intakeMonitoring',
    title: 'Intake Pressure Monitoring',
    description: 'Maintain adequate intake pressure on hydrant supply',
    setup: {
      waterSource: 'hydrant',
      intakePressure: 25,
      dischargePressure: 150,
    },
    objectives: [
      'Monitor intake pressure',
      'Maintain intake ≥ 20 PSI',
      'Reduce flow if intake drops',
    ],
    faultConditions: [
      'Allowing intake < 20 PSI for > 10 seconds',
      'Increasing flow when intake is low',
    ],
  },
};