/**
 * Ambient sound synthesis using Tone.js
 * Handles water flow, foam system, and environmental sounds
 */
import * as Tone from 'tone';
import { ensureAudio, isAudioReady } from './boot';

// Active ambient synths
let waterFlowNoise: Tone.Noise | null = null;
let waterFlowFilter: Tone.Filter | null = null;
let waterFlowGain: Tone.Gain | null = null;
let foamHiss: Tone.Noise | null = null;
let foamFilter: Tone.Filter | null = null;

/**
 * Start water flow ambient sound
 * Volume scales with flow rate (0-2000 GPM range)
 */
export async function startWaterFlow(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady() || waterFlowNoise) return;

  try {
    // Create white noise for water flow
    waterFlowNoise = new Tone.Noise('white').start();
    
    // Band-pass filter for water-like quality
    waterFlowFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 1200,
      Q: 1.5,
    }).toDestination();

    // Gain control for dynamic volume
    waterFlowGain = new Tone.Gain(0).connect(waterFlowFilter);
    
    waterFlowNoise.connect(waterFlowGain);
    waterFlowNoise.volume.value = -15;

    // Add subtle LFO for realistic variation
    const lfo = new Tone.LFO({
      frequency: 2,
      min: 1000,
      max: 1400,
    });
    lfo.connect(waterFlowFilter.frequency);
    lfo.start();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Ambient] Error starting water flow:', error);
    }
  }
}

/**
 * Update water flow volume based on total GPM
 * @param totalGPM Total flow rate in gallons per minute
 */
export function updateWaterFlowVolume(totalGPM: number): void {
  if (!waterFlowGain) return;

  try {
    // Scale gain from 0 (no flow) to 1 (max flow at 2000 GPM)
    // Use logarithmic scaling for more natural perception
    const normalizedFlow = Math.min(totalGPM / 2000, 1);
    const gain = normalizedFlow > 0 ? Math.pow(normalizedFlow, 0.5) * 0.8 : 0;
    
    // Smooth transition to avoid clicks
    waterFlowGain.gain.rampTo(gain, 0.5);

    // Adjust filter frequency based on flow rate (higher flow = higher frequency)
    if (waterFlowFilter) {
      const targetFreq = 1000 + (normalizedFlow * 800); // 1000-1800 Hz range
      waterFlowFilter.frequency.rampTo(targetFreq, 0.5);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Ambient] Error updating water flow volume:', error);
    }
  }
}

/**
 * Stop water flow sound
 */
export function stopWaterFlow(): void {
  if (waterFlowNoise) {
    try {
      // Fade out smoothly
      if (waterFlowGain) {
        waterFlowGain.gain.rampTo(0, 0.3);
      }

      setTimeout(() => {
        waterFlowNoise?.stop();
        waterFlowNoise?.dispose();
        waterFlowNoise = null;

        waterFlowFilter?.dispose();
        waterFlowFilter = null;

        waterFlowGain?.dispose();
        waterFlowGain = null;
      }, 400);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Ambient] Error stopping water flow:', error);
      }
    }
  }
}

/**
 * Play foam system activation sound
 * Hissing sound that continues while foam is active
 */
export async function playFoamActivation(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady() || foamHiss) return;

  try {
    // Create pink noise for foam hiss
    foamHiss = new Tone.Noise('pink').start();
    
    // High-pass filter for hissing quality
    foamFilter = new Tone.Filter({
      type: 'highpass',
      frequency: 3000,
      rolloff: -24,
    }).toDestination();
    
    foamHiss.connect(foamFilter);
    foamHiss.volume.value = -22;

    // Add slight modulation for texture
    const lfo = new Tone.LFO({
      frequency: 6,
      min: 2800,
      max: 3200,
    });
    lfo.connect(foamFilter.frequency);
    lfo.start();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Ambient] Error playing foam activation:', error);
    }
  }
}

/**
 * Stop foam system sound
 */
export function stopFoamSound(): void {
  if (foamLFO) {
    try {
      foamLFO.stop();
      foamLFO.disconnect();
      foamLFO.dispose();
      foamLFO = null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Ambient] Error stopping foam LFO:', error);
      }
    }
  }

  if (foamHiss) {
    try {
      foamHiss.stop();
      foamHiss.dispose();
      foamHiss = null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Ambient] Error stopping foam sound:', error);
      }
    }
  }

  if (foamFilter) {
    foamFilter.dispose();
    foamFilter = null;
  }
}

/**
 * Play hose burst event sound
 * Sudden whoosh followed by alarm
 */
export async function playHoseBurst(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    // Create explosive whoosh with white noise
    const burstNoise = new Tone.Noise('white').start();
    const burstFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 8000,
      Q: 0.5,
    }).toDestination();

    const burstGain = new Tone.Gain(1).connect(burstFilter);
    burstNoise.connect(burstGain);
    burstNoise.volume.value = -5;

    // Rapid frequency sweep for explosive effect
    burstFilter.frequency.exponentialRampTo(500, 0.3);
    
    // Volume envelope - loud then fade
    burstGain.gain.exponentialRampTo(0.01, 0.5);

    // Clean up after burst
    setTimeout(() => {
      burstNoise.stop();
      burstNoise.dispose();
      burstFilter.dispose();
      burstGain.dispose();
    }, 600);

    // Add metallic impact
    const impact = new Tone.MetalSynth({
      frequency: 100,
      envelope: {
        attack: 0.001,
        decay: 0.6,
        release: 0.5,
      },
      harmonicity: 8,
      modulationIndex: 50,
      resonance: 3000,
      octaves: 2,
    }).toDestination();

    impact.volume.value = -3;
    impact.triggerAttackRelease('C2', '0.4');

    setTimeout(() => impact.dispose(), 1500);

    // Play urgent alarm after burst
    setTimeout(() => {
      playBurstAlarm();
    }, 300);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Ambient] Error playing hose burst:', error);
    }
  }
}

/**
 * Play burst alarm (internal helper)
 */
async function playBurstAlarm(): Promise<void> {
  try {
    const alarm = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.7,
        release: 0.1,
      },
    }).toDestination();

    alarm.volume.value = -8;

    // Urgent three-tone alarm
    const now = Tone.now();
    alarm.triggerAttackRelease('E5', '0.2', now);
    alarm.triggerAttackRelease('E5', '0.2', now + 0.25);
    alarm.triggerAttackRelease('E5', '0.3', now + 0.5);

    setTimeout(() => alarm.dispose(), 1000);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Ambient] Error playing burst alarm:', error);
    }
  }
}

/**
 * Play pressure relief valve activation sound
 * Sudden hiss when DRV activates
 */
export async function playPressureRelief(): Promise<void> {
  await ensureAudio();
  if (!isAudioReady()) return;

  try {
    const reliefHiss = new Tone.Noise('white').start();
    const reliefFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 4000,
      Q: 2,
    }).toDestination();

    const reliefGain = new Tone.Gain(0.6).connect(reliefFilter);
    reliefHiss.connect(reliefGain);
    reliefHiss.volume.value = -12;

    // Quick attack, sustained hiss
    reliefGain.gain.exponentialRampTo(0.01, 1.0);

    setTimeout(() => {
      reliefHiss.stop();
      reliefHiss.dispose();
      reliefFilter.dispose();
      reliefGain.dispose();
    }, 1200);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Ambient] Error playing pressure relief:', error);
    }
  }
}

/**
 * Clean up all ambient sounds
 */
export function stopAllAmbient(): void {
  stopWaterFlow();
  stopFoamSound();
}