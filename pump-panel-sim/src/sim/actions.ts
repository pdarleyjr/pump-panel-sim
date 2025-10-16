/**
 * Action types and reducer for simulation state management
 * Implements action dispatch pattern with interlock validation
 */

import type { SimState } from './state';
import { canAdjustThrottle, canOpenDischarge, canChangeFoam, canSwitchGovernor } from './interlocks';
import { updateTimeBasedState } from './engine';

export type Action =
  | { type: 'PUMP_ENGAGE'; engaged: boolean }
  | { type: 'GOVERNOR_MODE'; mode: 'RPM' | 'PRESSURE' }
  | { type: 'SETPOINT'; value: number }
  | { type: 'DISCHARGE_OPEN'; id: string; open: number }
  | { type: 'FOAM_PCT'; id: string; pct: number }
  | { type: 'FOAM_SYSTEM_ENABLE'; enabled: boolean }
  | { type: 'WATER_SOURCE'; source: 'tank' | 'hydrant' | 'draft' | 'relay' }
  | { type: 'TANK_TO_PUMP'; open: boolean }
  | { type: 'PRIMER_ACTIVATE' }
  | { type: 'PRIMER_COMPLETE' }
  | { type: 'PRIMER_PROGRESS'; progress: number }
  | { type: 'ELEVATION'; ft: number }
  | { type: 'DRV_TOGGLE'; enabled: boolean }
  | { type: 'DRV_SETPOINT_SET'; psi: number }
  | { type: 'TANK_FILL_RECIRC_SET'; pct: number }
  | { type: 'TICK'; deltaTime: number }
  // Instructor control actions
  | { type: 'SET_INTAKE_PRESSURE'; intakeId: string; psi: number }
  | { type: 'SCENARIO_HOSE_BURST'; lineId: string }
  | { type: 'SCENARIO_INTAKE_FAILURE'; intakeId: string }
  | { type: 'SCENARIO_TANK_LEAK' }
  | { type: 'SCENARIO_GOVERNOR_FAILURE' };

export function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case 'PUMP_ENGAGE':
      return { ...state, pump: { ...state.pump, engaged: action.engaged } };

    case 'GOVERNOR_MODE':
      if (!canSwitchGovernor(state)) {
        console.warn('Cannot switch governor mode in current conditions');
        return state;
      }
      return { ...state, pump: { ...state.pump, governor: action.mode } };

    case 'SETPOINT':
      if (!canAdjustThrottle(state)) {
        console.warn('Pump must be engaged to adjust setpoint');
        return state;
      }
      return { ...state, pump: { ...state.pump, setpoint: action.value } };

    case 'DISCHARGE_OPEN':
      if (!canOpenDischarge(state)) {
        console.warn('Pump must be engaged to open discharges');
        return state;
      }
      return {
        ...state,
        discharges: {
          ...state.discharges,
          [action.id]: { ...state.discharges[action.id], open: action.open },
        },
      };

    case 'FOAM_PCT':
      if (!canChangeFoam(state, action.id)) {
        console.warn('Pump must be engaged and discharge open to adjust foam');
        return state;
      }
      return {
        ...state,
        discharges: {
          ...state.discharges,
          [action.id]: { ...state.discharges[action.id], foamPct: action.pct },
        },
      };

    case 'WATER_SOURCE': {
      // Update all intakes to the new source
      const newIntakes = { ...state.intakes };
      Object.keys(newIntakes).forEach(id => {
        newIntakes[id] = { ...newIntakes[id], source: action.source };
      });
      return { ...state, intakes: newIntakes };
    }

    case 'TANK_TO_PUMP':
      return { ...state, tankToPumpOpen: action.open };

    case 'PRIMER_ACTIVATE':
      // Start priming cycle - only if water source is draft
      if (state.intakes[Object.keys(state.intakes)[0]]?.source === 'draft') {
        return {
          ...state,
          primerActive: true,
          isActivePriming: true,
          primingProgress: 0,
          primed: false,
        };
      }
      return state;

    case 'PRIMER_COMPLETE':
      // Complete priming cycle
      return {
        ...state,
        primerActive: false,
        isActivePriming: false,
        primed: true,
        primingProgress: 15,
      };

    case 'PRIMER_PROGRESS':
      // Update priming progress during countdown
      return {
        ...state,
        primingProgress: action.progress,
      };

    case 'ELEVATION':
      return { ...state, elevationFt: action.ft };

    case 'DRV_TOGGLE':
      // Toggle DRV enabled/disabled state
      return { ...state, pump: { ...state.pump, drv: { ...state.pump.drv, enabled: action.enabled } } };

    case 'DRV_SETPOINT_SET': {
      // Set DRV relief pressure setpoint (clamped to 75-300 PSI range)
      const clampedPsi = Math.max(75, Math.min(300, action.psi));
      return { ...state, pump: { ...state.pump, drv: { ...state.pump.drv, setpointPsi: clampedPsi } } };
    }

    case 'TANK_FILL_RECIRC_SET': {
      // Set tank fill/recirculation percentage (clamped to 0-100 range)
      const clampedPct = Math.max(0, Math.min(100, action.pct));
      return { ...state, tankFillRecircPct: clampedPct };
    }

    case 'TICK': {
      // Perform time-based updates (foam consumption, temperature, tank water, etc.)
      // This action is dispatched every 100ms by the animation loop
      const timeBasedUpdates = updateTimeBasedState(state, action.deltaTime);
      // Merge time-based updates without overriding user inputs
      return { ...state, ...timeBasedUpdates };
    }

    // Instructor control actions
    case 'SET_INTAKE_PRESSURE':
      // Directly set intake pressure (instructor override)
      return {
        ...state,
        intakes: {
          ...state.intakes,
          [action.intakeId]: { ...state.intakes[action.intakeId], psi: action.psi },
        },
      };

    case 'SCENARIO_HOSE_BURST':
      // Force a discharge line to burst by closing it completely
      // In a real scenario, this would trigger visual/audio feedback
      return {
        ...state,
        discharges: {
          ...state.discharges,
          [action.lineId]: { ...state.discharges[action.lineId], open: 0 },
        },
      };

    case 'SCENARIO_INTAKE_FAILURE':
      // Simulate hydrant failure by dropping intake pressure to near zero
      return {
        ...state,
        intakes: {
          ...state.intakes,
          [action.intakeId]: { ...state.intakes[action.intakeId], psi: Math.random() * 10 },
        },
      };

    case 'SCENARIO_TANK_LEAK':
      // Accelerate tank water depletion (handled in engine.ts time-based updates)
      // We'll add a flag to the state to indicate this scenario is active
      return { ...state };

    case 'SCENARIO_GOVERNOR_FAILURE':
      // Disable governor by switching to manual RPM mode with no automatic control
      return {
        ...state,
        pump: { ...state.pump, governor: 'RPM' },
      };

    default:
      return state;
  }
}