/**
 * Engine audio synthesis - LEGACY FILE
 * This file is kept for reference but is no longer used.
 * The new audio system will use Web Audio API directly in Panel.tsx
 */

// Legacy Tone.js code removed - no longer using Tone.js audio system
// If you need engine audio, implement it using Web Audio API in Panel.tsx

export function startEngineSound(): Promise<void> {
  console.warn('[Engine] Legacy Tone.js audio system removed. Implement using Web Audio API.');
  return Promise.resolve();
}

export function updateEngineRPM(_targetRPM: number): void {
  // No-op - legacy function
}

export function stopEngineSound(): void {
  // No-op - legacy function
}

export function getCurrentEngineRPM(): number {
  return 0;
}

export function isEngineSoundActive(): boolean {
  return false;
}

// Legacy compatibility functions - all no-ops now
export async function playClick(): Promise<void> {
  return Promise.resolve();
}

export async function playValveOpen(): Promise<void> {
  return Promise.resolve();
}

export async function playValveClose(): Promise<void> {
  return Promise.resolve();
}

export async function playAlarm(): Promise<null> {
  return null;
}

export function stopAlarm(_player: unknown): void {
  // No-op
}

export async function createPumpAmbient(): Promise<null> {
  return null;
}