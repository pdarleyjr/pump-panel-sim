/**
 * ARIA Helper Utilities
 * Provides utility functions for ARIA attributes and accessibility
 */

/**
 * Generate unique ID for ARIA relationships
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create ARIA label for a control with value
 */
export function createControlLabel(
  controlName: string,
  value: number,
  unit?: string,
  state?: 'open' | 'closed' | 'engaged' | 'disengaged'
): string {
  let label = controlName;
  
  if (state) {
    label += ` ${state}`;
  }
  
  if (unit) {
    label += `, ${Math.round(value)} ${unit}`;
  } else if (value !== undefined) {
    label += `, ${Math.round(value)}`;
  }
  
  return label;
}

/**
 * Create ARIA description for a control
 */
export function createControlDescription(
  controlType: 'button' | 'slider' | 'toggle' | 'valve',
  instruction?: string
): string {
  const baseInstructions: Record<string, string> = {
    button: 'Press Enter or Space to activate',
    slider: 'Use arrow keys to adjust value',
    toggle: 'Press Enter or Space to toggle',
    valve: 'Press Enter or Space to toggle valve position',
  };
  
  return instruction || baseInstructions[controlType];
}

/**
 * Get ARIA label for gauge value
 */
export function getGaugeAriaLabel(
  gaugeName: string,
  value: number,
  unit: string,
  range?: { min: number; max: number }
): string {
  let label = `${gaugeName}: ${Math.round(value)} ${expandUnit(unit)}`;
  
  if (range) {
    label += `. Range: ${range.min} to ${range.max} ${expandUnit(unit)}`;
  }
  
  return label;
}

/**
 * Expand abbreviated units for screen readers
 */
export function expandUnit(unit: string): string {
  const expansions: Record<string, string> = {
    'PSI': 'pounds per square inch',
    'GPM': 'gallons per minute',
    'RPM': 'revolutions per minute',
    '%': 'percent',
    '°F': 'degrees Fahrenheit',
    '°C': 'degrees Celsius',
    'gal': 'gallons',
    '"Hg': 'inches of mercury',
    'ft': 'feet',
    'in': 'inches',
  };
  
  return expansions[unit] || unit;
}

/**
 * Create ARIA live region announcement for warning
 */
export function createWarningAnnouncement(
  warningType: string,
  details?: string,
  remedy?: string
): string {
  let message = `Warning: ${warningType}`;
  
  if (details) {
    message += `. ${details}`;
  }
  
  if (remedy) {
    message += `. To resolve: ${remedy}`;
  }
  
  return message;
}

/**
 * Format state change for screen reader announcement
 */
export function formatStateChange(
  component: string,
  oldState: string | boolean,
  newState: string | boolean
): string {
  const formatState = (state: string | boolean): string => {
    if (typeof state === 'boolean') {
      return state ? 'active' : 'inactive';
    }
    return state.toLowerCase();
  };
  
  return `${component} changed from ${formatState(oldState)} to ${formatState(newState)}`;
}

/**
 * Get appropriate ARIA role for custom control
 */
export function getControlRole(controlType: string): string {
  const roleMap: Record<string, string> = {
    'lever': 'slider',
    'knob': 'slider',
    'gauge': 'meter',
    'indicator': 'status',
    'warning': 'alert',
    'badge': 'status',
    'led': 'status',
  };
  
  return roleMap[controlType] || 'button';
}

/**
 * Create ARIA attributes for range control
 */
export function createRangeAttributes(
  value: number,
  min: number,
  max: number,
  label: string
): {
  role: string;
  'aria-label': string;
  'aria-valuemin': number;
  'aria-valuemax': number;
  'aria-valuenow': number;
  'aria-valuetext': string;
} {
  return {
    role: 'slider',
    'aria-label': label,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': value,
    'aria-valuetext': `${Math.round(value)}`,
  };
}

/**
 * Create ARIA attributes for toggle control
 */
export function createToggleAttributes(
  checked: boolean,
  label: string,
  description?: string
): {
  role: string;
  'aria-label': string;
  'aria-checked': boolean;
  'aria-describedby'?: string;
} {
  const attrs: any = {
    role: 'switch',
    'aria-label': label,
    'aria-checked': checked,
  };
  
  if (description) {
    const descId = generateAriaId('toggle-desc');
    attrs['aria-describedby'] = descId;
  }
  
  return attrs;
}

/**
 * Determine if warning is critical (should use assertive live region)
 */
export function isWarningCritical(warningText: string): boolean {
  const criticalKeywords = [
    'overpressure',
    'burst',
    'critical',
    'emergency',
    'danger',
    'cavitation',
    'overheating',
    'failure',
  ];
  
  const lowerWarning = warningText.toLowerCase();
  return criticalKeywords.some(keyword => lowerWarning.includes(keyword));
}

/**
 * Format time duration for screen readers
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes} minutes and ${secs} seconds`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hours and ${minutes} minutes`;
  }
}

/**
 * Create accessible name for PixiJS control
 * Since canvas is not accessible, we need descriptive labels
 */
export function createPixiControlLabel(
  controlType: 'throttle' | 'governor' | 'gauge',
  value: number,
  additional?: string
): string {
  const labels: Record<string, string> = {
    throttle: `Engine throttle lever at ${Math.round(value)} percent`,
    governor: `Governor control knob at ${Math.round(value)}`,
    gauge: `Gauge reading ${Math.round(value)}`,
  };
  
  let label = labels[controlType] || `Control at ${Math.round(value)}`;
  
  if (additional) {
    label += `. ${additional}`;
  }
  
  return label;
}