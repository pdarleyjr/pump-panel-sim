/**
 * Audio Provider - Central orchestration for all audio systems
 * Integrates Tone.js synthesized audio with simulation state
 */
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { isAudioReady, getTone } from './boot';
import { vibrateClick, vibrateValve } from './haptics';

// Import simulation context types
import type { SimState } from '../sim/state';
import type { SolverResult } from '../sim/solver';

// Dynamic audio module imports to prevent AudioContext creation on page load
let engineModule: typeof import('./engine') | null = null;
let controlsModule: typeof import('./controls') | null = null;
let alarmsModule: typeof import('./alarms') | null = null;
let ambientModule: typeof import('./ambient') | null = null;

async function loadAudioModules() {
  if (!engineModule) {
    [engineModule, controlsModule, alarmsModule, ambientModule] = await Promise.all([
      import('./engine'),
      import('./controls'),
      import('./alarms'),
      import('./ambient'),
    ]);
  }
}

interface AudioCtx {
  enabled: boolean;
  audioReady: boolean;
  masterVolume: number;
  muted: boolean;
  start: () => Promise<void>;
  stop: () => void;
  setMasterVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  // Control sounds
  playClick: () => Promise<void>;
  playValveOpen: () => Promise<void>;
  playValveClose: () => Promise<void>;
  vibrateClick: typeof vibrateClick;
  vibrateValve: typeof vibrateValve;
}

const Ctx = createContext<AudioCtx>({
  enabled: false,
  audioReady: false,
  masterVolume: 0.7,
  muted: false,
  start: async () => {},
  stop: () => {},
  setMasterVolume: () => {},
  setMuted: () => {},
  playClick: async () => {},
  playValveOpen: async () => {},
  playValveClose: async () => {},
  vibrateClick,
  vibrateValve,
});

interface AudioProviderProps {
  children: React.ReactNode;
  simState?: SimState;
  simResult?: SolverResult;
}

export function AudioProvider({ children, simState, simResult }: AudioProviderProps) {
  const [enabled, setEnabled] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [masterVolume, setMasterVolumeState] = useState(0.7);
  const [muted, setMutedState] = useState(false);

  // Track previous state for change detection
  const prevStateRef = useRef<SimState | null>(null);
  const prevResultRef = useRef<SolverResult | null>(null);

  // Track active alarms
  const activeAlarmsRef = useRef({
    overpressure: false,
    cavitation: false,
    overheating: false,
    foamActive: false,
    waterFlowActive: false,
    primerActive: false,
  });

  // Update audioReady state
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioReady(isAudioReady());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Master volume control
  useEffect(() => {
    // Only access Tone if audio is ready - prevents AudioContext creation on mount
    if (!audioReady) return;
    
    const Tone = getTone();
    if (!Tone) return;
    
    try {
      const context = Tone.getContext();
      if (context.state === 'running') {
        Tone.getDestination().volume.value = muted 
          ? -Infinity 
          : Tone.gainToDb(masterVolume);
      }
    } catch {
      // Safe to ignore if context not ready
    }
  }, [masterVolume, muted, audioReady]);

  const start = async () => {
    if (enabled) return;
    setEnabled(true);
  };

  const stop = () => {
    if (!engineModule) return;
    
    // Stop all active sounds
    engineModule.stopEngineSound();
    alarmsModule?.stopAllAlarms();
    ambientModule?.stopAllAmbient();
    controlsModule?.stopPrimer();
    
    // Only suspend if context is running
    const Tone = getTone();
    if (audioReady && Tone && Tone.getContext().state === 'running') {
      Tone.getContext().rawContext.suspend();
    }
    setEnabled(false);
  };

  const setMasterVolume = (volume: number) => {
    setMasterVolumeState(Math.max(0, Math.min(1, volume)));
  };

  const setMuted = (mute: boolean) => {
    setMutedState(mute);
  };

  // Main audio integration effect
  useEffect(() => {
    if (!enabled || !audioReady || !simState || !simResult) return;

    // Load audio modules dynamically
    loadAudioModules().then(() => {
      if (!engineModule || !controlsModule || !alarmsModule || !ambientModule) return;

      const prevState = prevStateRef.current;
      const prevResult = prevResultRef.current;

      // === ENGINE SOUNDS ===
      if (simState.pump.engaged) {
        // Start engine sound if not already active
        if (!engineModule.isEngineSoundActive()) {
          engineModule.startEngineSound();
        }
        
        // Update engine RPM
        engineModule.updateEngineRPM(simState.pump.rpm);
      } else {
        // Stop engine sound when pump disengages
        if (engineModule.isEngineSoundActive()) {
          engineModule.stopEngineSound();
        }
      }

      // === PUMP ENGAGE/DISENGAGE SOUNDS ===
      if (prevState && prevState.pump.engaged !== simState.pump.engaged) {
        if (simState.pump.engaged) {
          controlsModule.playPumpEngage();
        } else {
          controlsModule.playPumpDisengage();
        }
      }

      // === TANK-TO-PUMP VALVE SOUNDS ===
      if (prevState && prevState.tankToPumpOpen !== simState.tankToPumpOpen) {
        if (simState.tankToPumpOpen) {
          controlsModule.playTankValveOpen();
          vibrateValve();
        } else {
          controlsModule.playTankValveClose();
          vibrateValve();
        }
      }

      // === DISCHARGE VALVE SOUNDS ===
      if (prevState) {
        Object.entries(simState.discharges).forEach(([id, discharge]) => {
          const prevDischarge = prevState.discharges[id];
          if (prevDischarge) {
            // Detect valve opening/closing
            if (discharge.open > 0.1 && prevDischarge.open <= 0.1) {
              controlsModule!.playDischargeValveOpen();
              vibrateValve();
            } else if (discharge.open <= 0.1 && prevDischarge.open > 0.1) {
              controlsModule!.playDischargeValveClose();
              vibrateValve();
            }
          }
        });
      }

      // === GOVERNOR MODE SWITCH ===
      if (prevState && prevState.pump.governor !== simState.pump.governor) {
        controlsModule.playGovernorSwitch();
        vibrateClick();
      }

      // === PRIMER SOUNDS ===
      if (simState.isActivePriming && !activeAlarmsRef.current.primerActive) {
        controlsModule.playPrimerStart();
        activeAlarmsRef.current.primerActive = true;
      } else if (!simState.isActivePriming && activeAlarmsRef.current.primerActive) {
        controlsModule.stopPrimer();
        activeAlarmsRef.current.primerActive = false;
      }

      // === WATER FLOW AMBIENT ===
      if (simResult.totalGPM > 0 && !activeAlarmsRef.current.waterFlowActive) {
        ambientModule.startWaterFlow();
        activeAlarmsRef.current.waterFlowActive = true;
      } else if (simResult.totalGPM === 0 && activeAlarmsRef.current.waterFlowActive) {
        ambientModule.stopWaterFlow();
        activeAlarmsRef.current.waterFlowActive = false;
      }

      // Update water flow volume based on total GPM
      if (activeAlarmsRef.current.waterFlowActive) {
        ambientModule.updateWaterFlowVolume(simResult.totalGPM);
      }

      // === FOAM SYSTEM ===
      const anyFoamActive = Object.values(simState.discharges).some(
        d => d.foamPct > 0 && d.open > 0
      );
      
      if (anyFoamActive && simState.pump.foamSystemEnabled && !activeAlarmsRef.current.foamActive) {
        ambientModule.playFoamActivation();
        activeAlarmsRef.current.foamActive = true;
      } else if ((!anyFoamActive || !simState.pump.foamSystemEnabled) && activeAlarmsRef.current.foamActive) {
        ambientModule.stopFoamSound();
        activeAlarmsRef.current.foamActive = false;
      }

      // === ALARMS ===
      
      // Overpressure alarm (>400 PSI)
      const isOverpressure = simState.pump.pdp > 400;
      if (isOverpressure && !activeAlarmsRef.current.overpressure) {
        alarmsModule.playOverpressureAlarm();
        activeAlarmsRef.current.overpressure = true;
      } else if (!isOverpressure && activeAlarmsRef.current.overpressure) {
        alarmsModule.stopOverpressureAlarm();
        activeAlarmsRef.current.overpressure = false;
      }

      // Cavitation detection (from warnings)
      const isCavitating = simResult.warnings.some(w => 
        w.toLowerCase().includes('cavitat') || w.toLowerCase().includes('starv')
      );
      if (isCavitating && !activeAlarmsRef.current.cavitation) {
        alarmsModule.playCavitationSound();
        activeAlarmsRef.current.cavitation = true;
      } else if (!isCavitating && activeAlarmsRef.current.cavitation) {
        alarmsModule.stopCavitationSound();
        activeAlarmsRef.current.cavitation = false;
      }

      // Overheating warnings (check if state has temperature data)
      const hasOverheating = simResult.warnings.some(w => 
        w.toLowerCase().includes('overheat') || w.toLowerCase().includes('temperature')
      );
      
      if (hasOverheating && !activeAlarmsRef.current.overheating) {
        // Determine severity from warning text
        const warningText = simResult.warnings.find(w => 
          w.toLowerCase().includes('overheat') || w.toLowerCase().includes('temperature')
        );
        
        let severity: 'warning' | 'critical' | 'danger' = 'warning';
        if (warningText) {
          if (warningText.toLowerCase().includes('danger') || warningText.toLowerCase().includes('critical')) {
            severity = 'danger';
          } else if (warningText.toLowerCase().includes('hot')) {
            severity = 'critical';
          }
        }
        
        alarmsModule.playOverheatingWarning(severity);
        activeAlarmsRef.current.overheating = true;
      } else if (!hasOverheating && activeAlarmsRef.current.overheating) {
        alarmsModule.stopOverheatingWarning();
        activeAlarmsRef.current.overheating = false;
      }

      // Tank empty warning
      if (prevState && simState.pump.foamTankGallons === 0 && prevState.pump.foamTankGallons > 0) {
        alarmsModule.playTankEmptyChime();
      }

      // === HOSE BURST EVENT ===
      // This would be triggered by a specific action or instructor control
      // For now, we'll detect it from warnings
      if (prevResult && simResult.warnings.some(w => w.toLowerCase().includes('burst'))) {
        if (!prevResult.warnings.some(w => w.toLowerCase().includes('burst'))) {
          ambientModule.playHoseBurst();
        }
      }

      // Store current state for next comparison
      prevStateRef.current = simState;
      prevResultRef.current = simResult;
    });

  }, [enabled, audioReady, simState, simResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!engineModule) return;
      engineModule.stopEngineSound();
      alarmsModule?.stopAllAlarms();
      ambientModule?.stopAllAmbient();
      controlsModule?.stopPrimer();
    };
  }, []);

  // Proxy functions for UI controls
  const playClick = async () => {
    await loadAudioModules();
    return controlsModule?.playButtonClick();
  };

  const playValveOpen = async () => {
    await loadAudioModules();
    return controlsModule?.playTankValveOpen();
  };

  const playValveClose = async () => {
    await loadAudioModules();
    return controlsModule?.playTankValveClose();
  };

  return (
    <Ctx.Provider value={{
      enabled,
      audioReady,
      masterVolume,
      muted,
      start,
      stop,
      setMasterVolume,
      setMuted,
      playClick,
      playValveOpen,
      playValveClose,
      vibrateClick,
      vibrateValve,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAudio = () => useContext(Ctx);