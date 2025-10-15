/**
 * Main application component
 */

import { AudioProvider } from './audio/AudioProvider';
import { SimulationProvider, useSimulation } from './sim/SimulationContext';
// Temporarily commented out for clean rebuild integration
// import { SettingsPanel } from './ui/Settings';
// import { SimulatorUI } from './ui/SimulatorUI';
// import { TouchDebugOverlay } from './ui/debug/TouchDebugOverlay';
// import { KeyboardShortcutsOverlay } from './ui/keyboard/KeyboardShortcutsOverlay';
import PanelClean from './ui/PanelClean';
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
  return (
    <SimulationProvider>
      <AudioBridge>
        {/* NEW CLEAN REBUILD COMPONENT */}
        <PanelClean />
        
        {/* TEMPORARILY COMMENTED OUT - OLD UI SYSTEM */}
        {/* <SettingsPanel
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
        /> */}
      </AudioBridge>
    </SimulationProvider>
  );
}