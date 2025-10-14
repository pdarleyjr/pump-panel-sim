/**
 * Pump Engage Toggle Component
 * Master ON/OFF switch for the pump
 */

import React from 'react';
import { useSimulation } from '../sim/SimulationContext';
import { useTouchFeedback } from './hooks/useTouchFeedback';
import './PumpEngageToggle.css';

export function PumpEngageToggle() {
  const { state, dispatch } = useSimulation();

  // Touch feedback for the toggle switch
  const toggleFeedback = useTouchFeedback({
    hapticType: state.pump.engaged ? 'DOUBLE_TAP' : 'TAP',
    enableHaptics: true,
    onPress: () => {
      dispatch({ type: 'PUMP_ENGAGE', engaged: !state.pump.engaged });
    },
  });

  return (
    <div className="pump-engage-toggle" role="region" aria-label="Pump master control">
      <label
        className={`engage-switch touchable ${toggleFeedback.isTouched ? 'touched' : ''}`}
        {...toggleFeedback.touchProps}
        htmlFor="pump-engage-checkbox"
      >
        <input
          id="pump-engage-checkbox"
          type="checkbox"
          role="switch"
          checked={state.pump.engaged}
          onChange={(e) => dispatch({ type: 'PUMP_ENGAGE', engaged: e.target.checked })}
          aria-label="Pump master engage toggle"
          aria-checked={state.pump.engaged}
          aria-describedby="pump-engage-description"
        />
        <span className="slider" aria-hidden="true"></span>
      </label>
      <span
        className={`engage-label ${state.pump.engaged ? 'on' : 'off'}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span aria-hidden="true">PUMP: {state.pump.engaged ? 'ON' : 'OFF'}</span>
        <span className="sr-only">
          Pump system {state.pump.engaged ? 'engaged and active' : 'disengaged and inactive'}
        </span>
      </span>
      <div id="pump-engage-description" className="sr-only">
        Master pump engage control. When on, the pump system is active and can supply water. When off, the pump is inactive.
      </div>
    </div>
  );
}