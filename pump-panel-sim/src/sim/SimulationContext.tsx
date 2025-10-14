/**
 * React Context for simulation state management
 * Provides state, solver results, and dispatch to all components
 */

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { createInitialState } from './state';
import type { SimState } from './state';
import { reducer } from './actions';
import type { Action } from './actions';
import { solveHydraulics } from './solver';
import type { SolverResult } from './solver';

interface SimulationContextValue {
  state: SimState;
  result: SolverResult;
  dispatch: React.Dispatch<Action>;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, createInitialState());
  const [result, setResult] = React.useState<SolverResult>(() => solveHydraulics(state));
  const animationFrameRef = useRef<number>();

  // Run solver on every state change
  useEffect(() => {
    const newResult = solveHydraulics(state);
    setResult(newResult);
  }, [state]);

  // Animation loop for continuous updates (RPM changes, foam depletion, etc.)
  useEffect(() => {
    let lastTickTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTickTime) / 1000; // Convert to seconds
      
      // Dispatch TICK action every 100ms (10 times per second)
      if (deltaTime >= 0.1) {
        dispatch({ type: 'TICK', deltaTime });
        lastTickTime = now;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dispatch]);

  // PERFORMANCE: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ state, result, dispatch }),
    [state, result, dispatch]
  );

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
}