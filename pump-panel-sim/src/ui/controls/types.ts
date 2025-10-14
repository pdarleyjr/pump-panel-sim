/**
 * Type definitions for UI controls
 */

/**
 * Types of interactive controls available on the panel
 */
export const ControlType = {
  Rotary: 'rotary',
  Lever: 'lever',
  Switch: 'switch',
  Button: 'button'
} as const;

export type ControlType = typeof ControlType[keyof typeof ControlType];

/**
 * Configuration for a control element
 */
export interface ControlConfig {
  /** Unique identifier for the control */
  id: string;
  
  /** Type of control */
  type: ControlType;
  
  /** X position on the panel */
  x: number;
  
  /** Y position on the panel */
  y: number;
  
  /** Display label for the control */
  label: string;
  
  /** Minimum value */
  min: number;
  
  /** Maximum value */
  max: number;
  
  /** Step increment (optional) */
  step?: number;
  
  /** Current value */
  value: number;
}

/**
 * Event emitted when a control value changes
 */
export interface ControlEvent {
  /** ID of the control that changed */
  controlId: string;
  
  /** New value of the control */
  value: number;
}