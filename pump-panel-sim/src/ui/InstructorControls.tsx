import { useState } from 'react';
import { useSimulation } from '@/sim/SimulationContext';
import { broadcast, type InstructorMessage } from '@/net/ws';
import { RippleEffect } from './effects/RippleEffect';
import './InstructorControls.css';

// Import overlay content for manual testing
import {
  CAVITATION_OVERLAY,
  OVERPRESSURE_OVERLAY,
  OVERHEATING_OVERLAY,
  TANK_EMPTY_OVERLAY,
  HOSE_BURST_OVERLAY,
} from './overlays/overlayContent';

interface InstructorControlsProps {
  connected: boolean;
  room: string;
}

export function InstructorControls({ connected, room }: InstructorControlsProps) {
  const { state, dispatch } = useSimulation();
  const [hydrantPressure, setHydrantPressure] = useState(50);
  const [selectedIntake, setSelectedIntake] = useState('ldh_driver');
  const [selectedDischarge, setSelectedDischarge] = useState('xlay1');

  // Get list of intakes and discharges
  const intakes = Object.keys(state.intakes);
  const discharges = Object.keys(state.discharges);

  const handleHydrantPressureChange = (value: number) => {
    setHydrantPressure(value);
    
    // Dispatch local action
    dispatch({ type: 'SET_INTAKE_PRESSURE', intakeId: selectedIntake, psi: value });
    
    // Broadcast to other clients if connected
    if (connected) {
      const message: InstructorMessage = {
        type: 'SET_PARAMETER',
        parameter: 'hydrantPressure',
        value,
        intakeId: selectedIntake,
      };
      broadcast(message);
    }
  };

  const triggerScenario = (scenario: 'HOSE_BURST' | 'INTAKE_FAILURE' | 'TANK_LEAK' | 'GOVERNOR_FAILURE') => {
    let message: InstructorMessage;

    switch (scenario) {
      case 'HOSE_BURST':
        dispatch({ type: 'SCENARIO_HOSE_BURST', lineId: selectedDischarge });
        message = {
          type: 'SCENARIO_EVENT',
          event: 'HOSE_BURST',
          lineId: selectedDischarge,
        };
        break;
      case 'INTAKE_FAILURE':
        dispatch({ type: 'SCENARIO_INTAKE_FAILURE', intakeId: selectedIntake });
        message = {
          type: 'SCENARIO_EVENT',
          event: 'INTAKE_FAILURE',
          intakeId: selectedIntake,
        };
        break;
      case 'TANK_LEAK':
        dispatch({ type: 'SCENARIO_TANK_LEAK' });
        message = {
          type: 'SCENARIO_EVENT',
          event: 'TANK_LEAK',
        };
        break;
      case 'GOVERNOR_FAILURE':
        dispatch({ type: 'SCENARIO_GOVERNOR_FAILURE' });
        message = {
          type: 'SCENARIO_EVENT',
          event: 'GOVERNOR_FAILURE',
        };
        break;
    }

    // Broadcast to other clients if connected
    if (connected) {
      broadcast(message);
    }
  };

  return (
    <div className="instructor-controls">
      <h3>
        🎓 Instructor Mode
        <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
      </h3>

      <div className="control-section">
        <h4>Hydrant Pressure Control</h4>
        <label htmlFor="intake-select">Target Intake:</label>
        <select
          id="intake-select"
          value={selectedIntake}
          onChange={(e) => setSelectedIntake(e.target.value)}
        >
          {intakes.map((id) => (
            <option key={id} value={id}>
              {id.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
        <div className="slider-control">
          <label>
            <span>Hydrant Pressure</span>
            <span>{hydrantPressure} PSI</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={hydrantPressure}
            onChange={(e) => handleHydrantPressureChange(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="control-section">
        <h4>Scenario Triggers</h4>
        <label htmlFor="discharge-select">Target Discharge Line:</label>
        <select
          id="discharge-select"
          value={selectedDischarge}
          onChange={(e) => setSelectedDischarge(e.target.value)}
        >
          {discharges.map((id) => (
            <option key={id} value={id}>
              {id.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
        <div className="scenario-buttons">
          <button
            className="scenario-button touchable with-ripple"
            onClick={() => triggerScenario('HOSE_BURST')}
            title="Force selected discharge line to burst"
          >
            <RippleEffect variant="dark" />
            💥 Hose Burst
          </button>
          <button
            className="scenario-button touchable with-ripple"
            onClick={() => triggerScenario('INTAKE_FAILURE')}
            title="Drop intake pressure to simulate hydrant failure"
          >
            <RippleEffect variant="dark" />
            🚰 Intake Failure
          </button>
          <button
            className="scenario-button touchable with-ripple"
            onClick={() => triggerScenario('TANK_LEAK')}
            title="Accelerate tank water depletion"
          >
            <RippleEffect variant="dark" />
            💧 Tank Leak
          </button>
          <button
            className="scenario-button touchable with-ripple"
            onClick={() => triggerScenario('GOVERNOR_FAILURE')}
            title="Disable automatic governor control"
          >
            <RippleEffect variant="dark" />
            ⚠️ Governor Fail
          </button>
        </div>
      </div>

      <div className="control-section">
        <h4>Training Overlay Tests</h4>
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
          Test training overlays by triggering conditions:
        </p>
        <div className="scenario-buttons" role="group" aria-label="Training overlay test triggers">
          <button
            className="scenario-button touchable with-ripple"
            onClick={() => {
              // Trigger overpressure by setting high RPM
              dispatch({ type: 'SETPOINT', value: 90 });
            }}
            aria-label="Test overpressure overlay by setting high throttle"
          >
            <RippleEffect variant="dark" />
            <span aria-hidden="true">🔴</span> Test Overpressure
          </button>
          <button
            className="scenario-button touchable with-ripple"
            onClick={() => {
              // Trigger cavitation by reducing intake pressure
              dispatch({ type: 'SET_INTAKE_PRESSURE', intakeId: selectedIntake, psi: 5 });
            }}
            aria-label="Test cavitation overlay by dropping intake pressure"
          >
            <RippleEffect variant="dark" />
            <span aria-hidden="true">⚠️</span> Test Cavitation
          </button>
          <button
            className="scenario-button touchable with-ripple"
            onClick={() => {
              // Note: This would need actual tank level tracking
              console.log('Tank empty overlay would trigger when tank < 50 gallons');
            }}
            aria-label="Test tank empty overlay. Would trigger when tank depletes"
          >
            <RippleEffect variant="dark" />
            <span aria-hidden="true">💧</span> Test Tank Empty
          </button>
        </div>
      </div>

      <div className="room-info" role="status" aria-live="polite">
        <span className="sr-only">Connection status: {connected ? 'Connected' : 'Disconnected'}. Training room: {room}</span>
        <span aria-hidden="true">Status: {connected ? '🟢 Connected' : '🔴 Disconnected'} • Room: {room}</span>
      </div>
    </div>
  );
}