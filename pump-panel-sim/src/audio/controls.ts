/**
 * Control feedback sound synthesis - LEGACY FILE
 * This file is kept for reference but is no longer used.
 * The new audio system will use Web Audio API directly in Panel.tsx
 */

// Legacy Tone.js code removed - no longer using Tone.js audio system
// If you need control feedback sounds, implement using Web Audio API in Panel.tsx

export async function playTankValveOpen(): Promise<void> {
  return Promise.resolve();
}

export async function playTankValveClose(): Promise<void> {
  return Promise.resolve();
}

export async function playDischargeValveOpen(): Promise<void> {
  return Promise.resolve();
}

export async function playDischargeValveClose(): Promise<void> {
  return Promise.resolve();
}

export async function playDRVToggle(): Promise<void> {
  return Promise.resolve();
}

export async function playGovernorSwitch(): Promise<void> {
  return Promise.resolve();
}

export async function playPrimerStart(): Promise<void> {
  return Promise.resolve();
}

export function stopPrimer(): void {
  // No-op - legacy function
}

export async function playPumpEngage(): Promise<void> {
  return Promise.resolve();
}

export async function playPumpDisengage(): Promise<void> {
  return Promise.resolve();
}

export async function playButtonClick(): Promise<void> {
  return Promise.resolve();
}