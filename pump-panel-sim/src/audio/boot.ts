/**
 * Audio boot and lazy initialization
 * Automatically starts audio on first user gesture without blocking UI
 */
import * as Tone from 'tone';

let audioReady = false;

/**
 * Ensure audio context is started and ready to play
 * Safe to call multiple times - only starts once
 */
export async function ensureAudio(): Promise<void> {
  if (!audioReady && Tone.getContext().state !== 'running') {
    try {
      await Tone.start();
      audioReady = true;
      console.log('[Audio] AudioContext started');
    } catch (err) {
      console.warn('[Audio] Failed to start:', err);
    }
  }
}

/**
 * Check if audio is ready to play
 */
export function isAudioReady(): boolean {
  return audioReady;
}

/**
 * Auto-start audio on first user gesture (pointer or keyboard)
 * Uses { once: true } to only trigger one time
 */
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', ensureAudio, { once: true });
  window.addEventListener('keydown', ensureAudio, { once: true });
}