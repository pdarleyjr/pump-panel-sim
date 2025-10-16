/**
 * Warning alarm sound synthesis - LEGACY FILE
 * This file is kept for reference but is no longer used.
 * The new audio system will use Web Audio API directly in Panel.tsx
 */

// Legacy Tone.js code removed - no longer using Tone.js audio system
// If you need alarm sounds, implement using Web Audio API in Panel.tsx

export async function playOverpressureAlarm(): Promise<void> {
  return Promise.resolve();
}

export function stopOverpressureAlarm(): void {
  // No-op - legacy function
}

export async function playCavitationSound(): Promise<void> {
  return Promise.resolve();
}

export function stopCavitationSound(): void {
  // No-op - legacy function
}

export async function playOverheatingWarning(_severity: 'warning' | 'critical' | 'danger'): Promise<void> {
  return Promise.resolve();
}

export function stopOverheatingWarning(): void {
  // No-op - legacy function
}

export async function playTankEmptyChime(): Promise<void> {
  return Promise.resolve();
}

export function stopAllAlarms(): void {
  // No-op - legacy function
}