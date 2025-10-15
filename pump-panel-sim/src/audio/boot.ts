/**
 * Audio boot and lazy initialization
 * Automatically starts audio on first user gesture without blocking UI
 * Uses dynamic import to prevent AudioContext creation on page load
 */

let audioReady = false;
let ToneModule: typeof import('tone') | null = null;

/**
 * Ensure audio context is started and ready to play
 * Safe to call multiple times - only starts once
 */
export async function ensureAudio(): Promise<void> {
  if (audioReady) return;
  
  try {
    // Dynamically import Tone.js only on first user interaction
    if (!ToneModule) {
      ToneModule = await import('tone');
    }
    
    await ToneModule.start();
    audioReady = true;
    console.log('[Audio] AudioContext started');
  } catch (err) {
    console.warn('[Audio] Failed to start:', err);
  }
}

/**
 * Check if audio is ready to play
 */
export function isAudioReady(): boolean {
  return audioReady;
}

/**
 * Get Tone module (for use by other audio modules)
 * Returns null if not yet loaded
 */
export function getTone(): typeof import('tone') | null {
  return ToneModule;
}

/**
 * Auto-start audio on first user gesture (pointer or keyboard)
 * Uses { once: true } to only trigger one time
 */
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', ensureAudio, { once: true });
  window.addEventListener('keydown', ensureAudio, { once: true });
}