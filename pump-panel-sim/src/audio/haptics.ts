/**
 * Haptics support with Vibration API and Gamepad Haptics
 * Gracefully degrades on unsupported platforms
 */

/**
 * Vibrate device (Android/supported browsers)
 * iOS Safari does not support this API
 */
export function vibrate(msOrPattern: number | number[]): void {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(msOrPattern as number | number[]);
    } catch {
      // Silently fail on unsupported platforms
    }
  }
}

/**
 * Short vibration for button clicks
 */
export function vibrateClick(): void {
  vibrate([10, 20, 10]);
}

/**
 * Longer vibration for valve operations
 */
export function vibrateValve(): void {
  vibrate([30, 50, 30]);
}

/**
 * Gamepad haptic feedback (experimental API)
 * Limited browser support - Firefox and some Chrome versions
 */
export function rumble(intensity: number = 0.8, durationMs: number = 120): void {
  try {
    const gamepads = navigator.getGamepads?.();
    if (!gamepads) return;

    const gamepad = Array.from(gamepads).find(gp => gp && gp.hapticActuators);
    if (!gamepad) return;

    // Try hapticActuators (newer API)
    const actuator = gamepad.hapticActuators?.[0] || gamepad.vibrationActuator;
    if (actuator && 'playEffect' in actuator) {
      actuator.playEffect('dual-rumble', {
        duration: durationMs,
        strongMagnitude: intensity,
        weakMagnitude: intensity * 0.5
      }).catch(() => {});
    }
  } catch {
    // Silently fail on unsupported platforms
  }
}

/**
 * Light rumble for clicks
 */
export function rumbleClick(): void {
  rumble(0.4, 80);
}

/**
 * Stronger rumble for valve operations
 */
export function rumbleValve(): void {
  rumble(0.8, 150);
}

/**
 * Check if vibration is supported
 */
export function isVibrationSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Check if gamepad haptics are supported
 */
export function isGamepadHapticsSupported(): boolean {
  try {
    const gamepads = navigator.getGamepads?.();
    if (!gamepads) return false;
    return Array.from(gamepads).some(gp => gp?.vibrationActuator || gp?.hapticActuators);
  } catch {
    return false;
  }
}