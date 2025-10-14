/**
 * Engine audio synthesis using Tone.js
 * Handles engine RPM sounds with smooth transitions and realistic characteristics
 */
import * as Tone from 'tone';
import { ensureAudio, isAudioReady } from './boot';

// Engine sound components
let engineOsc: Tone.Oscillator | null = null;
let engineNoise: Tone.Noise | null = null;
let engineFilter: Tone.Filter | null = null;
let engineGain: Tone.Gain | null = null;
let noiseGain: Tone.Gain | null = null;
let currentRPM = 0;

// RPM constants
const IDLE_RPM = 600;
const MIN_OPERATING_RPM = 800;
const MAX_OPERATING_RPM = 2200;

/**
 * Start engine sound system
 * Creates the synthesis chain for engine audio
 */
export async function startEngineSound(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady() || engineOsc) return;

  try {
    // Create sawtooth oscillator for engine fundamental
    engineOsc = new Tone.Oscillator({
      type: 'sawtooth',
      frequency: rpmToFrequency(IDLE_RPM),
    }).start();

    // Create brown noise for mechanical rumble
    engineNoise = new Tone.Noise('brown').start();

    // Low-pass filter for engine character
    engineFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 400,
      rolloff: -24,
    }).toDestination();

    // Gain controls
    engineGain = new Tone.Gain(0.3).connect(engineFilter);
    noiseGain = new Tone.Gain(0.15).connect(engineFilter);

    // Connect audio chain
    engineOsc.connect(engineGain);
    engineNoise.connect(noiseGain);

    // Set initial volumes
    engineOsc.volume.value = -12;
    engineNoise.volume.value = -18;

    currentRPM = IDLE_RPM;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Engine] Error starting engine sound:', error);
    }
  }
}

/**
 * Update engine sound based on current RPM
 * Smoothly transitions frequency and filtering
 */
export function updateEngineRPM(targetRPM: number): void {
  if (!engineOsc || !engineFilter || !engineGain || !noiseGain) return;

  try {
    // Clamp RPM to valid range
    const clampedRPM = Math.max(0, Math.min(targetRPM, MAX_OPERATING_RPM));
    
    // Only update if RPM has changed significantly (>5 RPM difference)
    if (Math.abs(clampedRPM - currentRPM) < 5) return;

    currentRPM = clampedRPM;

    // If RPM is 0, engine is off - fade out
    if (clampedRPM === 0) {
      engineGain.gain.rampTo(0, 1.0);
      noiseGain.gain.rampTo(0, 1.0);
      return;
    }

    // Fade in if starting from 0
    if (currentRPM < 10 && clampedRPM > 10) {
      engineGain.gain.rampTo(0.3, 0.5);
      noiseGain.gain.rampTo(0.15, 0.5);
    }

    // Convert RPM to frequency (engine cycles)
    const targetFreq = rpmToFrequency(clampedRPM);
    
    // Smooth transition time based on RPM difference
    const rpmDiff = Math.abs(clampedRPM - currentRPM);
    const transitionTime = Math.min(rpmDiff / 500, 2.0); // 0-2 seconds

    // Update oscillator frequency
    engineOsc.frequency.rampTo(targetFreq, transitionTime);

    // Update filter cutoff (higher RPM = brighter sound)
    const filterFreq = 200 + (clampedRPM / MAX_OPERATING_RPM) * 600; // 200-800 Hz
    engineFilter.frequency.rampTo(filterFreq, transitionTime);

    // Update gain based on RPM (louder at higher RPM)
    const normalizedRPM = Math.min(clampedRPM / MAX_OPERATING_RPM, 1);
    const targetGain = 0.2 + (normalizedRPM * 0.3); // 0.2-0.5 range
    const targetNoiseGain = 0.1 + (normalizedRPM * 0.15); // 0.1-0.25 range
    
    engineGain.gain.rampTo(targetGain, transitionTime);
    noiseGain.gain.rampTo(targetNoiseGain, transitionTime);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Engine] Error updating engine RPM:', error);
    }
  }
}

/**
 * Stop engine sound
 */
export function stopEngineSound(): void {
  if (engineOsc) {
    try {
      // Fade out before stopping
      if (engineGain) {
        engineGain.gain.rampTo(0, 0.5);
      }
      if (noiseGain) {
        noiseGain.gain.rampTo(0, 0.5);
      }

      setTimeout(() => {
        engineOsc?.stop();
        engineOsc?.dispose();
        engineOsc = null;

        engineNoise?.stop();
        engineNoise?.dispose();
        engineNoise = null;

        engineFilter?.dispose();
        engineFilter = null;

        engineGain?.dispose();
        engineGain = null;

        noiseGain?.dispose();
        noiseGain = null;

        currentRPM = 0;
      }, 600);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Engine] Error stopping engine sound:', error);
      }
    }
  }
}

/**
 * Convert RPM to audio frequency
 * Engine typically runs at fundamental + harmonics
 */
function rpmToFrequency(rpm: number): number {
  // Convert RPM to Hz (revolutions per second)
  // For a 4-cylinder 4-stroke engine, firing frequency is RPM/120
  // We use a lower harmonic for more realistic rumble
  const baseFreq = (rpm / 120) * 2; // Second harmonic
  return Math.max(baseFreq, 20); // Minimum audible frequency
}

/**
 * Get current engine RPM (for testing/debugging)
 */
export function getCurrentEngineRPM(): number {
  return currentRPM;
}

/**
 * Check if engine sound is active
 */
export function isEngineSoundActive(): boolean {
  return engineOsc !== null;
}

// Legacy compatibility functions (deprecated - will be removed)
/**
 * @deprecated Use control feedback sounds from controls.ts instead
 */
export async function playClick(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;
  
  try {
    const click = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 1.5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.03,
        sustain: 0,
        release: 0.03,
      },
    }).toDestination();

    click.volume.value = -18;
    click.triggerAttackRelease('E4', '0.01');
    setTimeout(() => click.dispose(), 150);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Engine] Error playing click:', error);
    }
  }
}

/**
 * @deprecated Use playTankValveOpen from controls.ts instead
 */
export async function playValveOpen(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    const metalHit = new Tone.MetalSynth({
      frequency: 180,
      envelope: {
        attack: 0.001,
        decay: 0.4,
        release: 0.3,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination();

    metalHit.volume.value = -8;
    metalHit.triggerAttackRelease('G2', '0.3');
    setTimeout(() => metalHit.dispose(), 1000);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Engine] Error playing valve open:', error);
    }
  }
}

/**
 * @deprecated Use playTankValveClose from controls.ts instead
 */
export async function playValveClose(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    const metalHit = new Tone.MetalSynth({
      frequency: 150,
      envelope: {
        attack: 0.001,
        decay: 0.35,
        release: 0.25,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination();

    metalHit.volume.value = -8;
    metalHit.triggerAttackRelease('E2', '0.25');
    setTimeout(() => metalHit.dispose(), 1000);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Engine] Error playing valve close:', error);
    }
  }
}

/**
 * @deprecated Use alarm sounds from alarms.ts instead
 */
export async function playAlarm(): Promise<Tone.Player | null> {
  return null;
}

/**
 * @deprecated Use stopOverpressureAlarm from alarms.ts instead
 */
export function stopAlarm(player: Tone.Player | null): void {
  // No-op for compatibility
}

/**
 * @deprecated No longer used - engine sound is synthesized
 */
export async function createPumpAmbient(): Promise<Tone.Player | null> {
  return null;
}