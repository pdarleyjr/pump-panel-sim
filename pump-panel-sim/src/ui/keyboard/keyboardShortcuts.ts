/**
 * Keyboard shortcut definitions and types
 * Central registry of all keyboard shortcuts in the application
 */

export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Display name */
  label: string;
  /** Description of what the shortcut does */
  description: string;
  /** Primary key(s) */
  keys: string[];
  /** Alternative keys (optional) */
  altKeys?: string[];
  /** Category for grouping in help overlay */
  category: 'engine' | 'pump' | 'governor' | 'ui' | 'foam' | 'primer' | 'drv';
  /** Whether Ctrl key is required */
  ctrl?: boolean;
  /** Whether Shift key is required */
  shift?: boolean;
  /** Whether Alt key is required */
  alt?: boolean;
  /** Whether this shortcut should be prevented from default browser action */
  preventDefault?: boolean;
}

/**
 * All keyboard shortcuts defined in the application
 */
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Engine/Throttle Controls
  {
    id: 'throttle-increase',
    label: 'Increase Throttle',
    description: 'Increase throttle by 10%',
    keys: ['ArrowUp', 'w', 'W'],
    category: 'engine',
    preventDefault: true,
  },
  {
    id: 'throttle-decrease',
    label: 'Decrease Throttle',
    description: 'Decrease throttle by 10%',
    keys: ['ArrowDown', 's', 'S'],
    category: 'engine',
    preventDefault: true,
  },
  {
    id: 'throttle-increase-fine',
    label: 'Fine Increase Throttle',
    description: 'Increase throttle by 1%',
    keys: ['ArrowUp'],
    shift: true,
    category: 'engine',
    preventDefault: true,
  },
  {
    id: 'throttle-decrease-fine',
    label: 'Fine Decrease Throttle',
    description: 'Decrease throttle by 1%',
    keys: ['ArrowDown'],
    shift: true,
    category: 'engine',
    preventDefault: true,
  },
  {
    id: 'throttle-max',
    label: 'Maximum Throttle',
    description: 'Set throttle to 100%',
    keys: ['ArrowUp', 'End'],
    ctrl: true,
    category: 'engine',
    preventDefault: true,
  },
  {
    id: 'throttle-idle',
    label: 'Idle Throttle',
    description: 'Set throttle to 0% (idle)',
    keys: ['ArrowDown', 'Home'],
    ctrl: true,
    category: 'engine',
    preventDefault: true,
  },

  // Pump Controls
  {
    id: 'pump-engage-toggle',
    label: 'Toggle Pump Engage',
    description: 'Toggle pump engage ON/OFF',
    keys: [' '], // Space key
    altKeys: ['p', 'P'],
    category: 'pump',
    preventDefault: true,
  },

  // Governor Controls
  {
    id: 'governor-mode-toggle',
    label: 'Toggle Governor Mode',
    description: 'Switch between RPM and PSI governor modes',
    keys: ['g', 'G'],
    category: 'governor',
    preventDefault: true,
  },
  {
    id: 'governor-setpoint-increase',
    label: 'Increase Governor Setpoint',
    description: 'Increase governor setpoint (PSI or RPM)',
    keys: [']'],
    category: 'governor',
    preventDefault: true,
  },
  {
    id: 'governor-setpoint-decrease',
    label: 'Decrease Governor Setpoint',
    description: 'Decrease governor setpoint (PSI or RPM)',
    keys: ['['],
    category: 'governor',
    preventDefault: true,
  },
  {
    id: 'governor-setpoint-increase-fine',
    label: 'Fine Increase Setpoint',
    description: 'Increase governor setpoint by smaller increment',
    keys: [']'],
    shift: true,
    category: 'governor',
    preventDefault: true,
  },
  {
    id: 'governor-setpoint-decrease-fine',
    label: 'Fine Decrease Setpoint',
    description: 'Decrease governor setpoint by smaller increment',
    keys: ['['],
    shift: true,
    category: 'governor',
    preventDefault: true,
  },

  // DRV (Discharge Relief Valve) Controls
  {
    id: 'drv-toggle',
    label: 'Toggle DRV',
    description: 'Toggle Discharge Relief Valve on/off',
    keys: ['d', 'D'],
    category: 'drv',
    preventDefault: true,
  },
  {
    id: 'drv-setpoint-increase',
    label: 'Increase DRV Setpoint',
    description: 'Increase DRV setpoint (PSI)',
    keys: ['=', '+'],
    category: 'drv',
    preventDefault: true,
  },
  {
    id: 'drv-setpoint-decrease',
    label: 'Decrease DRV Setpoint',
    description: 'Decrease DRV setpoint (PSI)',
    keys: ['-', '_'],
    category: 'drv',
    preventDefault: true,
  },

  // Primer Controls
  {
    id: 'primer-activate',
    label: 'Activate Primer',
    description: 'Start 15-second primer sequence',
    keys: ['r', 'R'],
    category: 'primer',
    preventDefault: true,
  },

  // Tank/Water Source Controls
  {
    id: 'tank-to-pump-toggle',
    label: 'Toggle Tank-to-Pump Valve',
    description: 'Open/close tank-to-pump valve',
    keys: ['t', 'T'],
    category: 'pump',
    preventDefault: true,
  },

  // Foam System Controls
  {
    id: 'foam-system-toggle',
    label: 'Toggle Foam System',
    description: 'Enable/disable foam system',
    keys: ['f', 'F'],
    category: 'foam',
    preventDefault: true,
  },

  // UI Navigation
  {
    id: 'settings-toggle',
    label: 'Toggle Settings',
    description: 'Open/close settings panel',
    keys: [',', 's', 'S'],
    ctrl: true,
    category: 'ui',
    preventDefault: true,
  },
  {
    id: 'instructor-controls-toggle',
    label: 'Toggle Instructor Controls',
    description: 'Open/close instructor controls panel',
    keys: ['i', 'I'],
    ctrl: true,
    category: 'ui',
    preventDefault: true,
  },
  {
    id: 'help-overlay-toggle',
    label: 'Show Help',
    description: 'Show keyboard shortcuts help overlay',
    keys: ['?', 'h', 'H'],
    category: 'ui',
    preventDefault: true,
  },
  {
    id: 'escape',
    label: 'Close/Escape',
    description: 'Dismiss active overlay or modal',
    keys: ['Escape'],
    category: 'ui',
    preventDefault: false,
  },

  // Debug (development only)
  {
    id: 'debug-touch-toggle',
    label: 'Toggle Touch Debug',
    description: 'Show/hide touch debug overlay',
    keys: ['t', 'T'],
    ctrl: true,
    shift: true,
    category: 'ui',
    preventDefault: true,
  },
];

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
  return KEYBOARD_SHORTCUTS.filter(s => s.category === category);
}

/**
 * Get shortcut by ID
 */
export function getShortcutById(id: string): KeyboardShortcut | undefined {
  return KEYBOARD_SHORTCUTS.find(s => s.id === id);
}

/**
 * Format key combination for display
 */
export function formatKeyCombo(shortcut: KeyboardShortcut, useAlt: boolean = false): string {
  const keys = useAlt && shortcut.altKeys ? shortcut.altKeys : shortcut.keys;
  const modifiers: string[] = [];
  
  if (shortcut.ctrl) modifiers.push('Ctrl');
  if (shortcut.shift) modifiers.push('Shift');
  if (shortcut.alt) modifiers.push('Alt');
  
  const mainKey = keys[0].replace(' ', 'Space');
  
  return [...modifiers, mainKey].join(' + ');
}

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check modifiers
  if (!!shortcut.ctrl !== event.ctrlKey) return false;
  if (!!shortcut.shift !== event.shiftKey) return false;
  if (!!shortcut.alt !== event.altKey) return false;
  
  // Check if the key matches any of the defined keys
  const allKeys = [...shortcut.keys, ...(shortcut.altKeys || [])];
  return allKeys.includes(event.key);
}