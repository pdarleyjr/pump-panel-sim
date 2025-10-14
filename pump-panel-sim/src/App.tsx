/**
 * Main application component
 */

import { useState } from 'react';
import { AudioProvider } from './audio/AudioProvider';
import { SimulationProvider, useSimulation } from './sim/SimulationContext';
import { SettingsPanel } from './ui/Settings';
import { SimulatorUI } from './ui/SimulatorUI';
import { TouchDebugOverlay } from './ui/debug/TouchDebugOverlay';
import { KeyboardShortcutsOverlay } from './ui/keyboard/KeyboardShortcutsOverlay';
import './App.css';

/**
 * Audio bridge component that connects AudioProvider to simulation state
 * Must be inside SimulationProvider to access simulation context
 */
function AudioBridge({ children }: { children: React.ReactNode }) {
  const { state, result } = useSimulation();
  
  return (
    <AudioProvider simState={state} simResult={result}>
      {children}
    </AudioProvider>
  );
}

export default function App() {
  // Training overlays state - shared between Settings and SimulatorUI
  const [trainingOverlaysEnabled, setTrainingOverlaysEnabled] = useState(() => {
    const stored = localStorage.getItem('trainingOverlaysEnabled');
    return stored !== null ? stored === 'true' : true;
  });

  // Touch debug overlay state
  const [touchDebugEnabled, setTouchDebugEnabled] = useState(() => {
    const stored = localStorage.getItem('touchDebugEnabled');
    return stored === 'true';
  });

  // Keyboard shortcuts overlay state
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);

  return (
    <SimulationProvider>
      <AudioBridge>
        <SettingsPanel
          trainingOverlaysEnabled={trainingOverlaysEnabled}
          onTrainingOverlaysToggle={setTrainingOverlaysEnabled}
          touchDebugEnabled={touchDebugEnabled}
          onTouchDebugToggle={setTouchDebugEnabled}
        />
        <SimulatorUI
          trainingOverlaysEnabled={trainingOverlaysEnabled}
          onKeyboardHelpToggle={() => setKeyboardHelpOpen(v => !v)}
        />
        <TouchDebugOverlay enabled={touchDebugEnabled} />
        <KeyboardShortcutsOverlay
          isOpen={keyboardHelpOpen}
          onClose={() => setKeyboardHelpOpen(false)}
        />
      </AudioBridge>
    </SimulationProvider>
  );
}