/**
 * Global keyboard event manager
 * Handles keyboard shortcuts and dispatches actions to simulation context
 */

import { KEYBOARD_SHORTCUTS, matchesShortcut } from './keyboardShortcuts';
import type { KeyboardShortcut } from './keyboardShortcuts';
import type { Action } from '../../sim/actions';

export type KeyboardActionCallback = (action: Action) => void;
export type KeyboardEventCallback = (shortcutId: string) => void;

interface KeyboardManagerOptions {
  /** Callback to dispatch actions to simulation */
  onAction: KeyboardActionCallback;
  /** Callback when a shortcut is triggered (for visual feedback) */
  onShortcutTriggered?: KeyboardEventCallback;
  /** Whether to enable keyboard shortcuts (default: true) */
  enabled?: boolean;
}

/**
 * Central keyboard manager for handling all keyboard shortcuts
 */
export class KeyboardManager {
  private options: Required<KeyboardManagerOptions>;
  private listening: boolean = false;
  private activeModals: Set<string> = new Set();
  private focusedInputs: Set<HTMLElement> = new Set();

  constructor(options: KeyboardManagerOptions) {
    this.options = {
      onAction: options.onAction,
      onShortcutTriggered: options.onShortcutTriggered || (() => {}),
      enabled: options.enabled ?? true,
    };
  }

  /**
   * Start listening for keyboard events
   */
  public start(): void {
    if (this.listening) return;
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.listening = true;
  }

  /**
   * Stop listening for keyboard events
   */
  public stop(): void {
    if (!this.listening) return;
    
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.listening = false;
  }

  /**
   * Enable keyboard shortcuts
   */
  public enable(): void {
    this.options.enabled = true;
  }

  /**
   * Disable keyboard shortcuts
   */
  public disable(): void {
    this.options.enabled = false;
  }

  /**
   * Check if shortcuts are enabled
   */
  public isEnabled(): boolean {
    return this.options.enabled;
  }

  /**
   * Register a modal as active (to potentially block shortcuts)
   */
  public registerModal(id: string): void {
    this.activeModals.add(id);
  }

  /**
   * Unregister a modal
   */
  public unregisterModal(id: string): void {
    this.activeModals.delete(id);
  }

  /**
   * Check if any modals are active
   */
  public hasActiveModals(): boolean {
    return this.activeModals.size > 0;
  }

  /**
   * Main keyboard event handler
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.options.enabled) return;

    // Don't handle shortcuts when typing in input fields
    if (this.isTypingInInput(event)) return;

    // Find matching shortcut
    const shortcut = this.findMatchingShortcut(event);
    if (!shortcut) return;

    // Handle the shortcut
    this.handleShortcut(event, shortcut);
  };

  /**
   * Handle key up events (for future use)
   */
  private handleKeyUp = (event: KeyboardEvent): void => {
    // Reserved for future functionality
  };

  /**
   * Check if user is typing in an input field
   */
  private isTypingInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    
    // Allow shortcuts in input fields if they use modifiers
    const hasModifier = event.ctrlKey || event.altKey || event.metaKey;
    
    if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
      // Allow Escape to work in inputs
      if (event.key === 'Escape') return false;
      // Allow Ctrl/Alt/Meta shortcuts in inputs
      if (hasModifier) return false;
      // Block regular keys in inputs
      return true;
    }
    
    return false;
  }

  /**
   * Find a shortcut that matches the keyboard event
   */
  private findMatchingShortcut(event: KeyboardEvent): KeyboardShortcut | null {
    for (const shortcut of KEYBOARD_SHORTCUTS) {
      if (matchesShortcut(event, shortcut)) {
        return shortcut;
      }
    }
    return null;
  }

  /**
   * Handle a matched shortcut
   */
  private handleShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): void {
    // Prevent default browser behavior if specified
    if (shortcut.preventDefault) {
      event.preventDefault();
    }

    // Notify listeners that shortcut was triggered
    this.options.onShortcutTriggered(shortcut.id);

    // Execute the shortcut action
    const action = this.getActionForShortcut(shortcut.id);
    if (action) {
      this.options.onAction(action);
    }
  }

  /**
   * Map shortcut ID to simulation action
   */
  private getActionForShortcut(shortcutId: string): Action | null {
    switch (shortcutId) {
      // Throttle controls (these will be handled by SETPOINT action)
      case 'throttle-increase':
        return { type: 'SETPOINT', value: 10 }; // Relative increment
      case 'throttle-decrease':
        return { type: 'SETPOINT', value: -10 }; // Relative decrement
      case 'throttle-increase-fine':
        return { type: 'SETPOINT', value: 1 };
      case 'throttle-decrease-fine':
        return { type: 'SETPOINT', value: -1 };
      case 'throttle-max':
        return { type: 'SETPOINT', value: 100 }; // Absolute
      case 'throttle-idle':
        return { type: 'SETPOINT', value: 0 }; // Absolute

      // Pump controls
      case 'pump-engage-toggle':
        return null; // Handled by toggle logic in component

      // Governor controls
      case 'governor-mode-toggle':
        return null; // Handled by toggle logic in component
      case 'governor-setpoint-increase':
        return null; // Needs current mode context
      case 'governor-setpoint-decrease':
        return null; // Needs current mode context
      case 'governor-setpoint-increase-fine':
        return null; // Needs current mode context
      case 'governor-setpoint-decrease-fine':
        return null; // Needs current mode context

      // DRV controls
      case 'drv-toggle':
        return null; // Handled by toggle logic
      case 'drv-setpoint-increase':
        return null; // Needs current value
      case 'drv-setpoint-decrease':
        return null; // Needs current value

      // Primer
      case 'primer-activate':
        return { type: 'PRIMER_ACTIVATE' };

      // Tank/Water
      case 'tank-to-pump-toggle':
        return null; // Handled by toggle logic

      // Foam
      case 'foam-system-toggle':
        return null; // Handled by toggle logic

      // UI shortcuts don't dispatch actions
      default:
        return null;
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stop();
    this.activeModals.clear();
    this.focusedInputs.clear();
  }
}

/**
 * Singleton instance management
 */
let globalManager: KeyboardManager | null = null;

/**
 * Initialize the global keyboard manager
 */
export function initializeKeyboardManager(options: KeyboardManagerOptions): KeyboardManager {
  if (globalManager) {
    globalManager.destroy();
  }
  
  globalManager = new KeyboardManager(options);
  globalManager.start();
  
  return globalManager;
}

/**
 * Get the global keyboard manager instance
 */
export function getKeyboardManager(): KeyboardManager | null {
  return globalManager;
}

/**
 * Destroy the global keyboard manager
 */
export function destroyKeyboardManager(): void {
  if (globalManager) {
    globalManager.destroy();
    globalManager = null;
  }
}