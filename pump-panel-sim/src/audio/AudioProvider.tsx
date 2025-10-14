/**
 * Audio Provider - Central orchestration for all audio systems
 * Integrates Tone.js synthesized audio with simulation state
 */
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { isAudioReady } from './boot';
import { vibrateClick, vibrateValve } from './haptics';

// Engine sounds
import { 
  startEngineSound, 
  stopEngineSound, 
  updateEngineRPM, 
  isEngineSoundActive 
} from './engine';

// Control sounds
import {
  playTankValveOpen,
  playTankValveClose,
  playDischargeValveOpen,
  playDischargeValveClose,
  playDRVToggle,
  playGovernorSwitch,
  playPrimerStart,
  stopPrimer,
  playPumpEngage,
  playPumpDisengage,
  playButtonClick,
} from './controls';

// Alarm sounds
import {
  playOverpressureAlarm,
  stopOverpressureAlarm,
  playCavitationSound,
  stopCavitationSound,
  playOverheatingWarning,
  stopOverheatingWarning,
  playTankEmptyChime,
  stopAllAlarms,
} from './alarms';

// Ambient sounds
import {
  startWaterFlow,
  stopWaterFlow,
  updateWaterFlowVolume,
  playFoamActivation,
  stopFoamSound,
  playHoseBurst,
  playPressureRelief,
  stopAllAmbient,
} from './ambient';

// Import simulation context types
import type { SimState } from '../sim/state';
import type { SolverResult } from '../sim/solver';

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
  playClick: typeof playButtonClick;
  playValveOpen: typeof playTankValveOpen;
  playValveClose: typeof playTankValveClose;
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
  playClick: playButtonClick,
  playValveOpen: playTankValveOpen,
  playValveClose: playTankValveClose,
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
    if (audioReady) {
      Tone.getDestination().volume.value = muted 
        ? -Infinity 
        : Tone.gainToDb(masterVolume);
    }
  }, [masterVolume, muted, audioReady]);

  const start = async () => {
    if (enabled) return;
    setEnabled(true);
  };

  const stop = () => {
    // Stop all active sounds
    stopEngineSound();
    stopAllAlarms();
    stopAllAmbient();
    stopPrimer();
    
    Tone.getContext().rawContext.suspend();
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

    const prevState = prevStateRef.current;
    const prevResult = prevResultRef.current;

    // === ENGINE SOUNDS ===
    if (simState.pump.engaged) {
      // Start engine sound if not already active
      if (!isEngineSoundActive()) {
        startEngineSound();
      }
      
      // Update engine RPM
      updateEngineRPM(simState.pump.rpm);
    } else {
      // Stop engine sound when pump disengages
      if (isEngineSoundActive()) {
        stopEngineSound();
      }
    }

    // === PUMP ENGAGE/DISENGAGE SOUNDS ===
    if (prevState && prevState.pump.engaged !== simState.pump.engaged) {
      if (simState.pump.engaged) {
        playPumpEngage();
      } else {
        playPumpDisengage();
      }
    }

    // === TANK-TO-PUMP VALVE SOUNDS ===
    if (prevState && prevState.tankToPumpOpen !== simState.tankToPumpOpen) {
      if (simState.tankToPumpOpen) {
        playTankValveOpen();
        vibrateValve();
      } else {
        playTankValveClose();
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
            playDischargeValveOpen();
            vibrateValve();
          } else if (discharge.open <= 0.1 && prevDischarge.open > 0.1) {
            playDischargeValveClose();
            vibrateValve();
          }
        }
      });
    }

    // === GOVERNOR MODE SWITCH ===
    if (prevState && prevState.pump.governor !== simState.pump.governor) {
      playGovernorSwitch();
      vibrateClick();
    }

    // === PRIMER SOUNDS ===
    if (simState.isActivePriming && !activeAlarmsRef.current.primerActive) {
      playPrimerStart();
      activeAlarmsRef.current.primerActive = true;
    } else if (!simState.isActivePriming && activeAlarmsRef.current.primerActive) {
      stopPrimer();
      activeAlarmsRef.current.primerActive = false;
    }

    // === WATER FLOW AMBIENT ===
    if (simResult.totalGPM > 0 && !activeAlarmsRef.current.waterFlowActive) {
      startWaterFlow();
      activeAlarmsRef.current.waterFlowActive = true;
    } else if (simResult.totalGPM === 0 && activeAlarmsRef.current.waterFlowActive) {
      stopWaterFlow();
      activeAlarmsRef.current.waterFlowActive = false;
    }

    // Update water flow volume based on total GPM
    if (activeAlarmsRef.current.waterFlowActive) {
      updateWaterFlowVolume(simResult.totalGPM);
    }

    // === FOAM SYSTEM ===
    const anyFoamActive = Object.values(simState.discharges).some(
      d => d.foamPct > 0 && d.open > 0
    );
    
    if (anyFoamActive && simState.pump.foamSystemEnabled && !activeAlarmsRef.current.foamActive) {
      playFoamActivation();
      activeAlarmsRef.current.foamActive = true;
    } else if ((!anyFoamActive || !simState.pump.foamSystemEnabled) && activeAlarmsRef.current.foamActive) {
      stopFoamSound();
      activeAlarmsRef.current.foamActive = false;
    }

    // === ALARMS ===
    
    // Overpressure alarm (>400 PSI)
    const isOverpressure = simState.pump.pdp > 400;
    if (isOverpressure && !activeAlarmsRef.current.overpressure) {
      playOverpressureAlarm();
      activeAlarmsRef.current.overpressure = true;
    } else if (!isOverpressure && activeAlarmsRef.current.overpressure) {
      stopOverpressureAlarm();
      activeAlarmsRef.current.overpressure = false;
    }

    // Cavitation detection (from warnings)
    const isCavitating = simResult.warnings.some(w => 
      w.toLowerCase().includes('cavitat') || w.toLowerCase().includes('starv')
    );
    if (isCavitating && !activeAlarmsRef.current.cavitation) {
      playCavitationSound();
      activeAlarmsRef.current.cavitation = true;
    } else if (!isCavitating && activeAlarmsRef.current.cavitation) {
      stopCavitationSound();
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
      
      playOverheatingWarning(severity);
      activeAlarmsRef.current.overheating = true;
    } else if (!hasOverheating && activeAlarmsRef.current.overheating) {
      stopOverheatingWarning();
      activeAlarmsRef.current.overheating = false;
    }

    // Tank empty warning
    if (prevState && simState.pump.foamTankGallons === 0 && prevState.pump.foamTankGallons > 0) {
      playTankEmptyChime();
    }

    // === HOSE BURST EVENT ===
    // This would be triggered by a specific action or instructor control
    // For now, we'll detect it from warnings
    if (prevResult && simResult.warnings.some(w => w.toLowerCase().includes('burst'))) {
      if (!prevResult.warnings.some(w => w.toLowerCase().includes('burst'))) {
        playHoseBurst();
      }
    }

    // Store current state for next comparison
    prevStateRef.current = simState;
    prevResultRef.current = simResult;

  }, [enabled, audioReady, simState, simResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEngineSound();
      stopAllAlarms();
      stopAllAmbient();
      stopPrimer();
    };
  }, []);

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
      playClick: playButtonClick,
      playValveOpen: playTankValveOpen,
      playValveClose: playTankValveClose,
      vibrateClick,
      vibrateValve,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAudio = () => useContext(Ctx);