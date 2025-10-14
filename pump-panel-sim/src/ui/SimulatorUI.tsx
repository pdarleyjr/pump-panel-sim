/**
 * Main simulator UI component that integrates Panel with simulation and audio
 */

import { useState, useEffect, useRef } from 'react';
import { Panel } from './Panel';
import { PumpEngageToggle } from './PumpEngageToggle';
import { useAudio } from '../audio/AudioProvider';
import { useSimulation } from '../sim/SimulationContext';
import { createInitialPumpState } from '../sim/pierce-puc';
import { simulateStep } from '../sim/engine';
import type { SimulationDiagnostics } from '../sim/engine';
import type { PumpState, DischargeId } from '../sim/model';
import type { ControlEvent } from './controls/types';
import { TrainingControls } from './TrainingControls';
import type { TrainingMode } from './TrainingControls';
import { ScoreHUD } from './ScoreHUD';
import { DefinitionsOverlay } from './DefinitionsOverlay';
import { StatusHUD } from './StatusHUD';
import { TrainingOverlay } from './overlays/TrainingOverlay';
import { PiercePUC_Startup, calculateMaxScore } from '../training/quiz';
import type { QuizState } from '../training/quiz';
import { useKeyboard } from './keyboard/useKeyboard';
import { KeyboardFeedback } from './keyboard/KeyboardFeedback';
import type { FeedbackMessage } from './keyboard/KeyboardFeedback';

interface SimulatorUIProps {
  trainingOverlaysEnabled?: boolean;
  onKeyboardHelpToggle?: () => void;
}

/**
 * Main simulator UI component
 */
export function SimulatorUI({
  trainingOverlaysEnabled = true,
  onKeyboardHelpToggle
}: SimulatorUIProps) {
  const audio = useAudio();
  const { state, result, dispatch } = useSimulation();
  const [pumpState, setPumpState] = useState<PumpState>(() => createInitialPumpState());
  const [diagnostics, setDiagnostics] = useState<SimulationDiagnostics | undefined>();
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Initialize keyboard shortcuts
  useKeyboard({
    onShortcut: (shortcutId, event) => {
      // Handle UI shortcuts
      if (shortcutId === 'help-overlay-toggle') {
        event.preventDefault();
        onKeyboardHelpToggle?.();
      } else if (shortcutId === 'escape') {
        // Close any open overlays
        if (definitionsEnabled) {
          setDefinitionsEnabled(false);
        }
      }
      
      // Provide audio feedback for keyboard actions
      if (audio.audioReady) {
        audio.vibrateClick();
      }
    },
    enabled: true,
  });

  // Training state
  const [trainingMode, setTrainingMode] = useState<TrainingMode>('off');
  const [definitionsEnabled, setDefinitionsEnabled] = useState(false);
  const [layoutPinned, setLayoutPinned] = useState(false);
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    active: false,
    score: 0,
    maxScore: calculateMaxScore(PiercePUC_Startup),
    currentStep: 0,
    startedAt: 0,
    completedSteps: [],
  });

  // Keyboard feedback messages
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  
  const dismissFeedback = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  // Simulation loop (keeping old system for compatibility)
  useEffect(() => {
    let isRunning = true;

    const updateSimulation = () => {
      if (!isRunning) return;

      const currentTime = Date.now();
      const deltaTimeSeconds = (currentTime - lastUpdateTimeRef.current) / 1000;
      lastUpdateTimeRef.current = currentTime;

      // Run simulation step
      setPumpState((prevState) => {
        const { state, diagnostics: newDiagnostics } = simulateStep(prevState, deltaTimeSeconds);
        setDiagnostics(newDiagnostics);
        return state;
      });

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(updateSimulation);
    };

    // Start simulation loop
    animationFrameRef.current = requestAnimationFrame(updateSimulation);

    // Cleanup on unmount
    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle control changes from the panel
  const handleControlChange = (event: ControlEvent) => {
    const { controlId, value } = event;

    // Play appropriate audio feedback
    if (audio.audioReady) {
      if (controlId === 'throttle') {
        audio.vibrateClick();
      } else if (controlId === 'tank_to_pump') {
        audio.playValveOpen();
        audio.vibrateValve();
      } else if (controlId.startsWith('discharge_')) {
        audio.playValveOpen();
        audio.vibrateValve();
      } else if (controlId === 'foam_percent') {
        audio.playClick();
        audio.vibrateClick();
      } else if (controlId === 'primer') {
        audio.playClick();
        audio.vibrateClick();
      } else if (controlId === 'drv_toggle') {
        audio.playClick();
        audio.vibrateClick();
      } else if (controlId === 'drv_setpoint') {
        audio.playClick();
        audio.vibrateClick();
      } else if (controlId === 'governor_toggle') {
        audio.playClick();
        audio.vibrateClick();
      } else if (controlId === 'foam_system_toggle') {
        audio.playClick();
        audio.vibrateClick();
      } else if (controlId === 'tank_fill_recirc') {
        audio.playClick();
        audio.vibrateClick();
      }
      
      // Dispatch actions to new state management system
      if (controlId === 'throttle') {
        dispatch({ type: 'SETPOINT', value });
      } else if (controlId === 'tank_to_pump') {
        dispatch({ type: 'TANK_TO_PUMP', open: value === 1 });
      } else if (controlId === 'primer') {
        // Primer is momentary - activate when pressed
        if (value === 1) {
          dispatch({ type: 'PRIMER_ACTIVATE' });
          
          // Start 15-second countdown, then dispatch PRIMER_COMPLETE
          setTimeout(() => {
            dispatch({ type: 'PRIMER_COMPLETE' });
          }, 15000);
        }
      } else if (controlId.startsWith('discharge_')) {
        const dischargeId = controlId.replace('discharge_', '');
        dispatch({ type: 'DISCHARGE_OPEN', id: dischargeId, open: value / 100 });
      } else if (controlId === 'foam_percent') {
        // Apply foam to all open discharges for now
        Object.keys(state.discharges).forEach(id => {
          if (state.discharges[id].open > 0) {
            dispatch({ type: 'FOAM_PCT', id, pct: value });
          }
        });
      } else if (controlId === 'drv_toggle') {
        // DRV toggle: 0 = OFF, 1 = ON
        dispatch({ type: 'DRV_TOGGLE', enabled: value === 1 });
      } else if (controlId === 'drv_setpoint') {
        // DRV setpoint adjustment
        dispatch({ type: 'DRV_SETPOINT_SET', psi: value });
      } else if (controlId === 'governor_toggle') {
        // Governor mode toggle: 0 = RPM, 1 = PRESSURE
        const mode = value === 1 ? 'PRESSURE' : 'RPM';
        dispatch({ type: 'GOVERNOR_MODE', mode });
      } else if (controlId === 'tank_fill_recirc') {
        // Tank fill/recirculation percentage
        dispatch({ type: 'TANK_FILL_RECIRC_SET', pct: value });
      }
    }

    // Also update old pumpState for compatibility with existing Panel
    setPumpState((prevState) => {
      const newState = { ...prevState };

      if (controlId === 'throttle') {
        newState.throttle = value;
        newState.engineRpm = 800 + (value / 100) * 1700;
      } else if (controlId === 'tank_to_pump') {
        newState.tankToPumpOpen = value === 1;
      } else if (controlId.startsWith('discharge_')) {
        const dischargeId = controlId.replace('discharge_', '') as DischargeId;
        newState.dischargeValvePct = {
          ...newState.dischargeValvePct,
          [dischargeId]: value,
        };
      } else if (controlId === 'foam_percent') {
        newState.foam = {
          ...newState.foam,
          percent: value,
        };
      } else if (controlId === 'primer') {
        // Primer button pressed - start priming cycle
        if (value === 1) {
          newState.primerActive = true;
          newState.primerTimeRemaining = 15;
        }
      } else if (controlId === 'drv_toggle') {
        // Update DRV enabled state
        newState.drv = {
          ...newState.drv,
          enabled: value === 1,
        };
      } else if (controlId === 'drv_setpoint') {
        // Update DRV setpoint
        newState.drv = {
          ...newState.drv,
          setpointPsi: value,
        };
      } else if (controlId === 'governor_toggle') {
        // Update governor mode: 0 = RPM, 1 = PRESSURE
        const mode = value === 1 ? 'PRESSURE' : 'RPM';
        newState.runtime = {
          ...newState.runtime,
          governor: mode,
        };
      } else if (controlId === 'tank_fill_recirc') {
        // Update tank fill/recirculation percentage
        newState.tankFillRecircPct = value;
      }

      return newState;
    });
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0b0e17',
      }}
    >
      <PumpEngageToggle />
      
      <Panel
        pumpState={pumpState}
        diagnostics={diagnostics}
        onChange={handleControlChange}
      />
      
      {/* Primer Countdown */}
      {pumpState.primerActive && pumpState.primerTimeRemaining > 0 && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '3px solid #ffaa00',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          zIndex: 2000,
          minWidth: '200px'
        }}>
          <div style={{ fontSize: '24px', color: '#ffaa00', marginBottom: '12px' }}>
            PRIMING
          </div>
          <div style={{ fontSize: '48px', color: '#00ff00', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {Math.ceil(pumpState.primerTimeRemaining)}s
          </div>
          <div style={{ fontSize: '14px', color: '#888', marginTop: '12px' }}>
            Evacuating air from pump...
          </div>
        </div>
      )}
      
      {/* Status HUD */}
      <StatusHUD
        state={pumpState}
        mode={state.pump.governor}
        setpoint={state.pump.setpoint}
        pdp={result.requiredPDP}
        rpm={state.pump.rpm}
        intake={result.intakePsi}
        flow={result.totalGPM}
        pumpTemp={200}
        engineTemp={180}
        warnings={result.warnings}
      />
      
      <TrainingControls
          mode={trainingMode}
          onModeChange={setTrainingMode}
          definitionsEnabled={definitionsEnabled}
          onDefinitionsToggle={() => setDefinitionsEnabled(v => !v)}
          layoutPinned={layoutPinned}
          onPinToggle={() => setLayoutPinned(v => !v)}
          pumpState={pumpState}
        />
        
        <ScoreHUD
          quiz={quizState}
          visible={trainingMode === 'quiz'}
        />

      <DefinitionsOverlay
        enabled={definitionsEnabled}
        hoveredControl={hoveredControl}
      />
      
      {/* Training Overlays */}
      <TrainingOverlay enabled={trainingOverlaysEnabled} />
      
      {/* Keyboard Feedback */}
      <KeyboardFeedback
        messages={messages}
        onDismiss={dismissFeedback}
      />
    </div>
  );
}