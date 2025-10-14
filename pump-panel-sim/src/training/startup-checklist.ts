import type { PumpState } from '../sim/model';

export interface ChecklistStep {
  id: string;
  description: string;
  check: (state: PumpState) => boolean;
  helpText: string;
}

/**
 * Pierce PUC 7-step startup checklist
 * Blueprint ref: Lines 182-183
 */
export const PIERCE_PUC_STARTUP: ChecklistStep[] = [
  {
    id: 'discharges_closed',
    description: '1. All discharges closed & caps on',
    check: (state) => {
      // Check that all discharge valves are at 0%
      return Object.values(state.dischargeValvePct).every(pct => pct === 0);
    },
    helpText: 'Close all discharge valves to 0%. Ensure caps are secured.',
  },
  {
    id: 'engage_pump',
    description: '2. Engage pump',
    check: (state) => state.interlocks.engaged,
    helpText: 'Toggle the Pump Engage switch to ON position.',
  },
  {
    id: 'open_tank_to_pump',
    description: '3. Open Tank-to-Pump valve',
    check: (state) => state.tankToPumpOpen,
    helpText: 'Open the Tank-to-Pump valve to supply water from tank.',
  },
  {
    id: 'verify_baseline_pressure',
    description: '4. Verify 40-50 PSI baseline pressure',
    check: (state) => {
      // Check discharge gauge shows 40-50 PSI with pump engaged, Tank-to-Pump open, no flow
      const baselineOK = state.dischargePsi >= 40 && state.dischargePsi <= 60;
      const noFlow = state.totalFlowGpm < 10;
      return baselineOK && noFlow && state.tankToPumpOpen && state.interlocks.engaged;
    },
    helpText: 'Check master discharge gauge. Should read 40-50 PSI. This verifies tank pressure.',
  },
  {
    id: 'crack_tank_fill',
    description: '5. Crack Tank Fill/Recirc to ~33%',
    check: (state) => state.tankFillRecircPct >= 30 && state.tankFillRecircPct <= 40,
    helpText: 'Open Tank Fill/Recirc valve to about 33% for cooling. Prevents pump overheating.',
  },
  {
    id: 'test_governor',
    description: '6. Test governor response',
    check: (state) => {
      // Governor is tested if it's in PSI mode and setpoint is above idle (>50 PSI)
      return state.governor.mode === 'PSI' && state.governor.setpoint > 50;
    },
    helpText: 'Set governor to PSI mode and adjust setpoint. Verify RPM changes.',
  },
  {
    id: 'prime_if_drafting',
    description: '7. Prime if drafting (or skip if not needed)',
    check: (state) => {
      // If water source is draft, must be primed. Otherwise, skip this step (always pass).
      if (state.waterSource === 'draft') {
        return state.interlocks.primed;
      }
      return true; // Not drafting, step not applicable
    },
    helpText: 'If drafting: Press and hold Primer button for 15 seconds. Otherwise, skip this step.',
  },
];

/**
 * Calculate checklist completion percentage
 */
export function getChecklistProgress(state: PumpState, checklist: ChecklistStep[]): {
  completed: number;
  total: number;
  percentage: number;
  currentStep: number; // Index of first incomplete step, or -1 if all complete
} {
  let completed = 0;
  let currentStep = -1;
  
  for (let i = 0; i < checklist.length; i++) {
    if (checklist[i].check(state)) {
      completed++;
    } else if (currentStep === -1) {
      currentStep = i;
    }
  }
  
  return {
    completed,
    total: checklist.length,
    percentage: (completed / checklist.length) * 100,
    currentStep: currentStep === -1 ? checklist.length : currentStep,
  };
}