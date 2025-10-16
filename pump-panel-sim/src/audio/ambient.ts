/**
 * Ambient sound synthesis - LEGACY FILE
 * This file is kept for reference but is no longer used.
 * The new audio system will use Web Audio API directly in Panel.tsx
 */

// Legacy Tone.js code removed - no longer using Tone.js audio system
// If you need ambient sounds, implement using Web Audio API in Panel.tsx

export async function startWaterFlow(): Promise<void> {
  return Promise.resolve();
}

export function updateWaterFlowVolume(_totalGPM: number): void {
  // No-op - legacy function
}

export function stopWaterFlow(): void {
  // No-op - legacy function
}

export async function playFoamActivation(): Promise<void> {
  return Promise.resolve();
}

export function stopFoamSound(): void {
  // No-op - legacy function
}

export async function playHoseBurst(): Promise<void> {
  return Promise.resolve();
}

export async function playPressureRelief(): Promise<void> {
  return Promise.resolve();
}

export function stopAllAmbient(): void {
  // No-op - legacy function
}