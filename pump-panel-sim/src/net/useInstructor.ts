/**
 * React hook for instructor mode integration
 */
import { useEffect, useState } from 'react';
import { connect, disconnect, onMessage, broadcast, type InstructorMessage } from './ws';
import type { Action } from '@/sim/actions';

export function useInstructor(
  room: string,
  workerUrl: string,
  enabled: boolean = false,
  dispatch?: React.Dispatch<Action>
) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !dispatch) return;

    // Connect to instructor room
    connect(room, workerUrl);
    setConnected(true);

    // Subscribe to messages
    const unsubscribe = onMessage((msg: InstructorMessage) => {
      console.log('Received instructor message:', msg);
      
      // Handle different message types
      if (msg.type === 'SCENARIO_EVENT' && msg.event) {
        switch (msg.event) {
          case 'HOSE_BURST':
            if (msg.lineId) {
              dispatch({ type: 'SCENARIO_HOSE_BURST', lineId: msg.lineId });
            }
            break;
          case 'INTAKE_FAILURE':
            if (msg.intakeId) {
              dispatch({ type: 'SCENARIO_INTAKE_FAILURE', intakeId: msg.intakeId });
            }
            break;
          case 'TANK_LEAK':
            dispatch({ type: 'SCENARIO_TANK_LEAK' });
            break;
          case 'GOVERNOR_FAILURE':
            dispatch({ type: 'SCENARIO_GOVERNOR_FAILURE' });
            break;
        }
      } else if (msg.type === 'SET_PARAMETER' && msg.parameter) {
        switch (msg.parameter) {
          case 'hydrantPressure':
            if (msg.value !== undefined && msg.intakeId) {
              dispatch({ type: 'SET_INTAKE_PRESSURE', intakeId: msg.intakeId, psi: msg.value });
            }
            break;
          // Additional parameters can be handled here
        }
      }
    });

    return () => {
      unsubscribe();
      disconnect();
      setConnected(false);
    };
  }, [room, workerUrl, enabled, dispatch]);

  return {
    connected,
    broadcast,
  };
}