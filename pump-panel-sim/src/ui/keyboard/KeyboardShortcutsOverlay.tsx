/**
 * Keyboard shortcuts help overlay
 * Displays all available keyboard shortcuts organized by category
 */

import React, { useEffect, useRef } from 'react';
import { KEYBOARD_SHORTCUTS, formatKeyCombo, getShortcutsByCategory } from './keyboardShortcuts';
import type { KeyboardShortcut } from './keyboardShortcuts';
import { useFocusManagement } from './useKeyboard';
import './KeyboardShortcutsOverlay.css';

interface KeyboardShortcutsOverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean;
  /** Callback when overlay should be closed */
  onClose: () => void;
}

/**
 * Component to display keyboard shortcuts help
 */
export function KeyboardShortcutsOverlay({ isOpen, onClose }: KeyboardShortcutsOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { storeFocus, restoreFocus, trapFocus } = useFocusManagement();

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && overlayRef.current) {
      storeFocus();
      
      // Focus the close button
      const closeButton = overlayRef.current.querySelector<HTMLButtonElement>('.keyboard-shortcuts-close');
      closeButton?.focus();
      
      // Trap focus within overlay
      const cleanup = trapFocus(overlayRef.current);
      
      return () => {
        cleanup();
        restoreFocus();
      };
    }
  }, [isOpen, storeFocus, restoreFocus, trapFocus]);

  if (!isOpen) return null;

  const categories: Array<{ id: KeyboardShortcut['category']; label: string }> = [
    { id: 'engine', label: 'Engine Controls' },
    { id: 'pump', label: 'Pump Controls' },
    { id: 'governor', label: 'Governor Controls' },
    { id: 'drv', label: 'Discharge Relief Valve' },
    { id: 'primer', label: 'Primer' },
    { id: 'foam', label: 'Foam System' },
    { id: 'ui', label: 'UI Navigation' },
  ];

  return (
    <div className="keyboard-shortcuts-overlay" onClick={onClose}>
      <div
        ref={overlayRef}
        className="keyboard-shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="keyboard-shortcuts-title"
        aria-modal="true"
      >
        <div className="keyboard-shortcuts-header">
          <h2 id="keyboard-shortcuts-title">Keyboard Shortcuts</h2>
          <button
            className="keyboard-shortcuts-close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            ×
          </button>
        </div>

        <div className="keyboard-shortcuts-content">
          {categories.map((category) => {
            const shortcuts = getShortcutsByCategory(category.id);
            if (shortcuts.length === 0) return null;

            return (
              <div key={category.id} className="keyboard-shortcuts-category">
                <h3 className="keyboard-shortcuts-category-title">{category.label}</h3>
                <div className="keyboard-shortcuts-list">
                  {shortcuts.map((shortcut) => (
                    <ShortcutItem key={shortcut.id} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="keyboard-shortcuts-footer">
          <p className="keyboard-shortcuts-hint">
            Press <kbd>?</kbd> or <kbd>H</kbd> to toggle this help · Press <kbd>Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual shortcut item component
 */
function ShortcutItem({ shortcut }: { shortcut: KeyboardShortcut }) {
  const keyCombo = formatKeyCombo(shortcut);
  const altKeyCombo = shortcut.altKeys ? formatKeyCombo(shortcut, true) : null;

  return (
    <div className="keyboard-shortcut-item">
      <div className="keyboard-shortcut-keys">
        <KeyBadge combo={keyCombo} />
        {altKeyCombo && (
          <>
            <span className="keyboard-shortcut-or">or</span>
            <KeyBadge combo={altKeyCombo} />
          </>
        )}
      </div>
      <div className="keyboard-shortcut-description">{shortcut.description}</div>
    </div>
  );
}

/**
 * Visual keyboard key badge component
 */
function KeyBadge({ combo }: { combo: string }) {
  const keys = combo.split(' + ');

  return (
    <span className="keyboard-key-combo">
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="keyboard-key-plus">+</span>}
          <kbd className="keyboard-key">{key}</kbd>
        </React.Fragment>
      ))}
    </span>
  );
}