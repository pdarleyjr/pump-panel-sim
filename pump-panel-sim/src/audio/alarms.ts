/**
 * Warning alarm sound synthesis using Tone.js
 * Generates alerts for overpressure, cavitation, overheating, and tank empty conditions
 */
import * as Tone from 'tone';
import { ensureAudio, isAudioReady } from './boot';

// Active alarm synths
let overpressureAlarm: Tone.Loop | null = null;
let cavitationNoise: Tone.Noise | null = null;
let cavitationFilter: Tone.Filter | null = null;
let overheatingTone: Tone.Oscillator | null = null;
let overheatingTremolo: Tone.Tremolo | null = null;
let tankEmptyChime: Tone.Synth | null = null;

/**
 * Play overpressure alarm (>400 PSI)
 * Urgent beeping at 2 Hz
 */
export async function playOverpressureAlarm(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady() || overpressureAlarm) return;

  try {
    const synth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0.5,
        release: 0.05,
      },
    }).toDestination();
    
    synth.volume.value = -10;

    // 2 Hz beeping (500ms interval)
    overpressureAlarm = new Tone.Loop((time) => {
      synth.triggerAttackRelease('G5', '0.15', time);
    }, 0.5);

    overpressureAlarm.start(0);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Alarms] Error playing overpressure alarm:', error);
    }
  }
}

/**
 * Stop overpressure alarm
 */
export function stopOverpressureAlarm(): void {
  if (overpressureAlarm) {
    try {
      overpressureAlarm.stop();
      overpressureAlarm.dispose();
      overpressureAlarm = null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Alarms] Error stopping overpressure alarm:', error);
      }
    }
  }
}

/**
 * Play cavitation detection sound
 * Grinding/rumbling noise indicating pump starvation
 */
export async function playCavitationSound(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady() || cavitationNoise) return;

  try {
    // Create brown noise (deeper rumble)
    cavitationNoise = new Tone.Noise('brown').start();
    
    // Filter and modulate for grinding effect
    cavitationFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 150,
      Q: 2,
    }).toDestination();
    
    cavitationNoise.connect(cavitationFilter);
    cavitationNoise.volume.value = -15;

    // LFO for grinding modulation
    const lfo = new Tone.LFO(8, 100, 250);
    lfo.connect(cavitationFilter.frequency);
    lfo.start();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Alarms] Error playing cavitation sound:', error);
    }
  }
}

/**
 * Stop cavitation sound
 */
export function stopCavitationSound(): void {
  if (cavitationNoise) {
    try {
      cavitationNoise.stop();
      cavitationNoise.dispose();
      cavitationNoise = null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Alarms] Error stopping cavitation sound:', error);
      }
    }
  }
  
  if (cavitationFilter) {
    cavitationFilter.dispose();
    cavitationFilter = null;
  }
}

/**
 * Play overheating warning tone
 * Progressive tone that increases with severity (warning → critical → danger)
 */
export async function playOverheatingWarning(severity: 'warning' | 'critical' | 'danger'): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    // Stop existing tone if playing
    stopOverheatingWarning();

    // Create oscillator with frequency based on severity
    const frequencies = {
      warning: 440,   // A4
      critical: 554,  // C#5
      danger: 659,    // E5
    };

    overheatingTone = new Tone.Oscillator({
      type: 'sine',
      frequency: frequencies[severity],
    }).toDestination();

    overheatingTone.volume.value = -18;
    overheatingTone.start();

    // Add pulsing for critical and danger
    if (severity === 'critical' || severity === 'danger') {
      overheatingTremolo = new Tone.Tremolo({
        frequency: severity === 'critical' ? 3 : 5,
        depth: 0.5,
      }).toDestination();
      
      overheatingTone.disconnect();
      overheatingTone.connect(overheatingTremolo);
      overheatingTremolo.start();
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Alarms] Error playing overheating warning:', error);
    }
  }
}

/**
 * Stop overheating warning
 */
export function stopOverheatingWarning(): void {
  if (overheatingTremolo) {
    try {
      overheatingTremolo.stop();
      overheatingTremolo.disconnect();
      overheatingTremolo.dispose();
      overheatingTremolo = null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Alarms] Error stopping overheating tremolo:', error);
      }
    }
  }
  
  if (overheatingTone) {
    try {
      overheatingTone.stop();
      overheatingTone.dispose();
      overheatingTone = null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Alarms] Error stopping overheating warning:', error);
      }
    }
  }
}

/**
 * Play tank empty alert chime
 * Single pleasant chime to indicate tank is empty
 */
export async function playTankEmptyChime(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    tankEmptyChime = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.5,
      },
    }).toDestination();

    tankEmptyChime.volume.value = -12;
    
    // Play a pleasant descending chime (E5 → C5 → G4)
    const now = Tone.now();
    tankEmptyChime.triggerAttackRelease('E5', '0.3', now);
    tankEmptyChime.triggerAttackRelease('C5', '0.3', now + 0.3);
    tankEmptyChime.triggerAttackRelease('G4', '0.5', now + 0.6);

    // Auto-dispose after playback
    setTimeout(() => {
      if (tankEmptyChime) {
        tankEmptyChime.dispose();
        tankEmptyChime = null;
      }
    }, 1500);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Alarms] Error playing tank empty chime:', error);
    }
  }
}

/**
 * Clean up all active alarms
 */
export function stopAllAlarms(): void {
  stopOverpressureAlarm();
  stopCavitationSound();
  stopOverheatingWarning();
}