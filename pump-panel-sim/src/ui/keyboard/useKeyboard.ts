/**
 * React hook for keyboard shortcuts
 * Provides easy integration of keyboard shortcuts in React components
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSimulation } from '../../sim/SimulationContext';
import { getKeyboardManager } from './KeyboardManager';
import type { KeyboardShortcut } from './keyboardShortcuts';
import { KEYBOARD_SHORTCUTS, matchesShortcut } from './keyboardShortcuts';

export interface UseKeyboardOptions {
  /** Specific shortcut IDs to listen for */
  shortcuts?: string[];
  /** Callback when a shortcut is triggered */
  onShortcut?: (shortcutId: string, event: KeyboardEvent) => void;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

/**
 * Hook to handle keyboard shortcuts in a React component
 */
export function useKeyboard(options: UseKeyboardOptions = {}) {
  const { state, dispatch } = useSimulation();
  const { shortcuts, onShortcut, enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);
  const onShortcutRef = useRef(onShortcut);

  // Keep refs up to date
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    onShortcutRef.current = onShortcut;
  }, [shortcuts, onShortcut]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Find matching shortcut
      for (const shortcut of KEYBOARD_SHORTCUTS) {
        // If specific shortcuts specified, only match those
        if (shortcutsRef.current && !shortcutsRef.current.includes(shortcut.id)) {
          continue;
        }

        if (matchesShortcut(event, shortcut)) {
          // Call the callback if provided
          if (onShortcutRef.current) {
            onShortcutRef.current(shortcut.id, event);
          }

          // Handle shortcut actions locally
          handleShortcutAction(shortcut.id);
          return;
        }
      }
    },
    [state, dispatch, enabled]
  );

  const handleShortcutAction = useCallback(
    (shortcutId: string) => {
      // Handle shortcuts that need access to current state
      switch (shortcutId) {
        case 'pump-engage-toggle':
          dispatch({ type: 'PUMP_ENGAGE', engaged: !state.pump.engaged });
          break;

        case 'governor-mode-toggle': {
          const newMode = state.pump.governor === 'RPM' ? 'PRESSURE' : 'RPM';
          dispatch({ type: 'GOVERNOR_MODE', mode: newMode });
          break;
        }

        case 'governor-setpoint-increase': {
          const step = state.pump.governor === 'RPM' ? 100 : 10;
          const newValue = state.pump.setpoint + step;
          dispatch({ type: 'SETPOINT', value: newValue });
          break;
        }

        case 'governor-setpoint-decrease': {
          const step = state.pump.governor === 'RPM' ? 100 : 10;
          const newValue = state.pump.setpoint - step;
          dispatch({ type: 'SETPOINT', value: newValue });
          break;
        }

        case 'governor-setpoint-increase-fine': {
          const step = state.pump.governor === 'RPM' ? 10 : 1;
          const newValue = state.pump.setpoint + step;
          dispatch({ type: 'SETPOINT', value: newValue });
          break;
        }

        case 'governor-setpoint-decrease-fine': {
          const step = state.pump.governor === 'RPM' ? 10 : 1;
          const newValue = state.pump.setpoint - step;
          dispatch({ type: 'SETPOINT', value: newValue });
          break;
        }

        case 'drv-toggle':
          dispatch({ type: 'DRV_TOGGLE', enabled: !state.pump.drv.enabled });
          break;

        case 'drv-setpoint-increase': {
          const newPsi = state.pump.drv.setpointPsi + 10;
          dispatch({ type: 'DRV_SETPOINT_SET', psi: newPsi });
          break;
        }

        case 'drv-setpoint-decrease': {
          const newPsi = state.pump.drv.setpointPsi - 10;
          dispatch({ type: 'DRV_SETPOINT_SET', psi: newPsi });
          break;
        }

        case 'tank-to-pump-toggle':
          dispatch({ type: 'TANK_TO_PUMP', open: !state.tankToPumpOpen });
          break;

        case 'foam-system-toggle': {
          // Toggle foam on first discharge line for now
          const firstDischarge = Object.keys(state.discharges)[0];
          if (firstDischarge) {
            const currentFoam = state.discharges[firstDischarge].foamPct;
            dispatch({ type: 'FOAM_PCT', id: firstDischarge, pct: currentFoam > 0 ? 0 : 3 });
          }
          break;
        }

        case 'throttle-increase':
          dispatch({ type: 'SETPOINT', value: Math.min(100, state.pump.setpoint + 10) });
          break;

        case 'throttle-decrease':
          dispatch({ type: 'SETPOINT', value: Math.max(0, state.pump.setpoint - 10) });
          break;

        case 'throttle-increase-fine':
          dispatch({ type: 'SETPOINT', value: Math.min(100, state.pump.setpoint + 1) });
          break;

        case 'throttle-decrease-fine':
          dispatch({ type: 'SETPOINT', value: Math.max(0, state.pump.setpoint - 1) });
          break;

        case 'throttle-max':
          dispatch({ type: 'SETPOINT', value: 100 });
          break;

        case 'throttle-idle':
          dispatch({ type: 'SETPOINT', value: 0 });
          break;

        case 'primer-activate':
          dispatch({ type: 'PRIMER_ACTIVATE' });
          break;
      }
    },
    [state, dispatch]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    state,
    dispatch,
  };
}

/**
 * Hook to track if a specific key is currently pressed
 */
export function useKeyPress(targetKey: string): boolean {
  const [keyPressed, setKeyPressed] = React.useState(false);

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(true);
      }
    };

    const upHandler = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
}

/**
 * Hook to handle focus management for keyboard navigation
 */
export function useFocusManagement() {
  const focusedElementRef = useRef<HTMLElement | null>(null);

  const storeFocus = useCallback(() => {
    focusedElementRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusedElementRef.current) {
      focusedElementRef.current.focus();
      focusedElementRef.current = null;
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab as EventListener);

    return () => {
      container.removeEventListener('keydown', handleTab as EventListener);
    };
  }, []);

  return {
    storeFocus,
    restoreFocus,
    trapFocus,
  };
}

// Need to import React for useState
import React from 'react';