/**
 * Control feedback sound synthesis using Tone.js
 * Handles valve operations, switch clicks, and primer sounds
 */
import * as Tone from 'tone';
import { ensureAudio, isAudioReady } from './boot';

// Active primer sound
let primerWhirr: Tone.Noise | null = null;
let primerFilter: Tone.Filter | null = null;
let primerLoop: Tone.Loop | null = null;
let primerLFO: Tone.LFO | null = null;

/**
 * Play tank-to-pump valve open sound
 * Metallic clunk with resonance
 */
export async function playTankValveOpen(): Promise<void> {
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

    // Auto-dispose after playback
    setTimeout(() => metalHit.dispose(), 1000);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Controls] Error playing tank valve open:', error);
    }
  }
}

/**
 * Play tank-to-pump valve close sound
 * Similar to open but slightly lower pitch
 */
export async function playTankValveClose(): Promise<void> {
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
      console.error('[Controls] Error playing tank valve close:', error);
    }
  }
}

/**
 * Play discharge valve open sound
 * Metallic clunk for discharge line valves
 */
export async function playDischargeValveOpen(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    const metalHit = new Tone.MetalSynth({
      frequency: 200,
      envelope: {
        attack: 0.001,
        decay: 0.3,
        release: 0.2,
      },
      harmonicity: 4.8,
      modulationIndex: 28,
      resonance: 3500,
      octaves: 1.2,
    }).toDestination();

    metalHit.volume.value = -10;
    metalHit.triggerAttackRelease('A2', '0.2');

    setTimeout(() => metalHit.dispose(), 800);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Controls] Error playing discharge valve open:', error);
    }
  }
}

/**
 * Play discharge valve close sound
 */
export async function playDischargeValveClose(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    const metalHit = new Tone.MetalSynth({
      frequency: 170,
      envelope: {
        attack: 0.001,
        decay: 0.25,
        release: 0.18,
      },
      harmonicity: 4.8,
      modulationIndex: 28,
      resonance: 3500,
      octaves: 1.2,
    }).toDestination();

    metalHit.volume.value = -10;
    metalHit.triggerAttackRelease('F#2', '0.18');

    setTimeout(() => metalHit.dispose(), 700);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Controls] Error playing discharge valve close:', error);
    }
  }
}

/**
 * Play DRV toggle click
 * Sharp mechanical click sound
 */
export async function playDRVToggle(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    const click = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 2,
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.05,
      },
    }).toDestination();

    click.volume.value = -12;
    click.triggerAttackRelease('C4', '0.02');

    setTimeout(() => click.dispose(), 200);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Controls] Error playing DRV toggle:', error);
    }
  }
}

/**
 * Play governor mode switch sound
 * Soft beep for mode transitions
 */
export async function playGovernorSwitch(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    const beep = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.2,
        release: 0.1,
      },
    }).toDestination();

    beep.volume.value = -16;
    beep.triggerAttackRelease('C5', '0.15');

    setTimeout(() => beep.dispose(), 500);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Controls] Error playing governor switch:', error);
    }
  }
}

/**
 * Play primer activation sound
 * Mechanical whirr that lasts for the primer duration (15 seconds)
 */
export async function playPrimerStart(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady() || primerWhirr) return;

  try {
    // Create pink noise for mechanical whirr
    primerWhirr = new Tone.Noise('pink').start();
    
    // Band-pass filter for motor-like sound
    primerFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 120,
      Q: 3,
    }).toDestination();
    primerWhirr.connect(primerFilter);
    primerWhirr.volume.value = -20;

    // Add slight frequency modulation for realistic motor sound
    primerLFO = new Tone.LFO({
      frequency: 8,
      min: 100,
      max: 140,
    });
    primerLFO.connect(primerFilter.frequency);
    primerLFO.start();

    // Add occasional "surges" in the primer sound
    primerLoop = new Tone.Loop((time) => {
      // Random volume surges
      if (Math.random() > 0.7) {
        primerWhirr!.volume.rampTo(-18, 0.1, time);
        primerWhirr!.volume.rampTo(-20, 0.2, time + 0.15);
      }
    }, 0.5);

    primerLoop.start(0);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Controls] Error playing primer start:', error);
    }
  }
}

/**
 * Stop primer sound
 */
export function stopPrimer(): void {
  if (primerLoop) {
    try {
      primerLoop.stop();
      primerLoop.dispose();
      primerLoop = null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Controls] Error stopping primer loop:', error);
      }
    }
  }

  if (primerLFO) {
    try {
      primerLFO.stop();
      primerLFO.disconnect();
      primerLFO.dispose();
      primerLFO = null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Controls] Error stopping primer LFO:', error);
      }
    }
  }

  if (primerWhirr) {
    try {
      primerWhirr.stop();
      primerWhirr.dispose();
      primerWhirr = null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Controls] Error stopping primer:', error);
      }
    }
  }

  if (primerFilter) {
    primerFilter.dispose();
    primerFilter = null;
  }
}

/**
 * Play pump engage sound
 * Satisfying mechanical engagement
 */
export async function playPumpEngage(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    const engage = new Tone.MetalSynth({
      frequency: 250,
      envelope: {
        attack: 0.001,
        decay: 0.5,
        release: 0.4,
      },
      harmonicity: 6,
      modulationIndex: 40,
      resonance: 5000,
      octaves: 2,
    }).toDestination();

    engage.volume.value = -6;
    
    // Two-tone engagement sound
    engage.triggerAttackRelease('A2', '0.3');
    setTimeout(() => {
      engage.triggerAttackRelease('C3', '0.25');
    }, 100);

    setTimeout(() => engage.dispose(), 1000);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Controls] Error playing pump engage:', error);
    }
  }
}

/**
 * Play pump disengage sound
 * Lower-pitched release
 */
export async function playPumpDisengage(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    const disengage = new Tone.MetalSynth({
      frequency: 200,
      envelope: {
        attack: 0.001,
        decay: 0.4,
        release: 0.3,
      },
      harmonicity: 5,
      modulationIndex: 35,
      resonance: 4500,
      octaves: 1.8,
    }).toDestination();

    disengage.volume.value = -6;
    
    // Descending disengagement sound
    disengage.triggerAttackRelease('C3', '0.25');
    setTimeout(() => {
      disengage.triggerAttackRelease('G2', '0.3');
    }, 100);

    setTimeout(() => disengage.dispose(), 900);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Controls] Error playing pump disengage:', error);
    }
  }
}

/**
 * Play generic button click
 * Light tactile feedback
 */
export async function playButtonClick(): Promise<void> {
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
      console.error('[Controls] Error playing button click:', error);
    }
  }
}