/**
 * Type definitions for visual indicators
 */

/**
 * Status levels for color-coded indicators
 */
export type StatusLevel = 'normal' | 'warning' | 'critical' | 'info';

/**
 * Color mapping for status levels
 */
export const StatusColors: Record<StatusLevel, number> = {
  normal: 0x00ff00,   // Green
  warning: 0xffaa00,  // Yellow/Amber
  critical: 0xff0000, // Red
  info: 0x00aaff,     // Blue/Cyan
};

/**
 * LED indicator state
 */
export interface LEDState {
  /** Whether the LED is on */
  on: boolean;
  /** Color of the LED when on */
  color: number;
  /** Optional pulsing effect */
  pulsing?: boolean;
  /** Pulse speed (Hz) */
  pulseSpeed?: number;
}

/**
 * Flow indicator configuration
 */
export interface FlowIndicatorConfig {
  /** Unique identifier */
  id: string;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Current flow rate in GPM */
  flowGpm: number;
  /** Maximum flow rate for scaling */
  maxFlowGpm: number;
}

/**
 * Status badge configuration
 */
export interface StatusBadgeConfig {
  /** Unique identifier */
  id: string;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Display label */
  label: string;
  /** Current status level */
  status: StatusLevel;
  /** Optional icon or value */
  value?: string;
}

/**
 * LED indicator configuration
 */
export interface LEDIndicatorConfig {
  /** Unique identifier */
  id: string;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Display label */
  label: string;
  /** LED radius */
  radius?: number;
  /** Initial state */
  initialState: LEDState;
}

/**
 * Valve position indicator state
 */
export interface ValveIndicatorState {
  /** Whether valve is open */
  open: boolean;
  /** Percentage open (0-100) */
  percent: number;
}

/**
 * Governor mode for display
 */
export type GovernorMode = 'RPM' | 'PSI';