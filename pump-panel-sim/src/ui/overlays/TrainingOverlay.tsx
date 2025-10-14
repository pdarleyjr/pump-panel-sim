/**
 * Training overlay component
 * Displays educational overlays for failure scenarios and training tips
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSimulation } from '@/sim/SimulationContext';
import type { OverlayContent } from './overlayContent';
import {
  CAVITATION_OVERLAY,
  OVERPRESSURE_OVERLAY,
  OVERHEATING_OVERLAY,
  TANK_EMPTY_OVERLAY,
  HOSE_BURST_OVERLAY,
  getOverlayContent
} from './overlayContent';
import { RippleEffect } from '../effects/RippleEffect';
import './TrainingOverlay.css';

interface TrainingOverlayProps {
  enabled?: boolean;
}

/**
 * Training overlay component that monitors simulation state and displays
 * educational content when failure conditions are detected
 */
export function TrainingOverlay({ enabled = true }: TrainingOverlayProps) {
  const { state, result } = useSimulation();
  const [activeOverlay, setActiveOverlay] = useState<OverlayContent | null>(null);
  const [dismissedOverlays, setDismissedOverlays] = useState<Set<string>>(new Set());
  const previousWarningsRef = useRef<string[]>([]);
  const overlayContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Check for failure conditions and trigger appropriate overlays
   */
  const checkFailureConditions = useCallback(() => {
    if (!enabled || activeOverlay) return;

    // Check for cavitation (low intake pressure with pump engaged)
    if (state.pump.engaged && result.intakePsi < 10 && result.totalGPM > 100) {
      if (!dismissedOverlays.has(CAVITATION_OVERLAY.id)) {
        setActiveOverlay(CAVITATION_OVERLAY);
        return;
      }
    }

    // Check for overpressure (>400 PSI)
    if (state.pump.pdp > 400) {
      if (!dismissedOverlays.has(OVERPRESSURE_OVERLAY.id)) {
        setActiveOverlay(OVERPRESSURE_OVERLAY);
        return;
      }
    }

    // Check for overheating (placeholder temperatures - would need actual temp monitoring)
    // For now, check if pump has been running at high RPM for extended period
    if (state.pump.engaged && state.pump.rpm > 2500 && state.tankFillRecircPct < 20) {
      // This is a simplified check - real implementation would track temperature over time
      // if (!dismissedOverlays.has(OVERHEATING_OVERLAY.id)) {
      //   setActiveOverlay(OVERHEATING_OVERLAY);
      //   return;
      // }
    }

    // Check for tank empty (placeholder - would need tank level tracking)
    // This would be triggered from actual tank level monitoring
    // if (tankGallons < 50 && state.tankToPumpOpen) {
    //   if (!dismissedOverlays.has(TANK_EMPTY_OVERLAY.id)) {
    //     setActiveOverlay(TANK_EMPTY_OVERLAY);
    //     return;
    //   }
    // }

    // Check for new warnings from solver
    const currentWarnings = result.warnings;
    const newWarnings = currentWarnings.filter(
      w => !previousWarningsRef.current.includes(w)
    );
    previousWarningsRef.current = currentWarnings;

    // Trigger overlays based on specific warnings
    if (newWarnings.length > 0) {
      for (const warning of newWarnings) {
        if (warning.toLowerCase().includes('cavitat') && !dismissedOverlays.has(CAVITATION_OVERLAY.id)) {
          setActiveOverlay(CAVITATION_OVERLAY);
          return;
        }
        if (warning.toLowerCase().includes('low foam') && !dismissedOverlays.has('low_foam')) {
          // Could add a specific low foam overlay
          console.log('Low foam warning:', warning);
        }
      }
    }
  }, [enabled, activeOverlay, state, result, dismissedOverlays]);

  /**
   * Dismiss the active overlay
   */
  const dismissOverlay = useCallback(() => {
    if (activeOverlay) {
      setDismissedOverlays(prev => new Set(prev).add(activeOverlay.id));
      setActiveOverlay(null);
    }
  }, [activeOverlay]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && activeOverlay) {
      dismissOverlay();
    }
  }, [activeOverlay, dismissOverlay]);

  /**
   * Check conditions periodically
   */
  useEffect(() => {
    checkFailureConditions();
  }, [checkFailureConditions]);

  /**
   * Setup keyboard event listener
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /**
   * Focus trap and initial focus
   */
  useEffect(() => {
    if (activeOverlay && overlayContainerRef.current) {
      overlayContainerRef.current.focus();
    }
  }, [activeOverlay]);

  /**
   * Reset dismissed overlays when conditions change significantly
   */
  useEffect(() => {
    // Reset dismissed overlays if pump is disengaged or conditions normalize
    if (!state.pump.engaged) {
      setDismissedOverlays(new Set());
    }
  }, [state.pump.engaged]);

  // Don't render if disabled or no active overlay
  if (!enabled || !activeOverlay) {
    return null;
  }

  return (
    <div
      className="training-overlay-backdrop"
      onClick={(e) => {
        // Close overlay if backdrop is clicked
        if (e.target === e.currentTarget && activeOverlay.dismissable) {
          dismissOverlay();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="training-overlay-title"
    >
      <div
        ref={overlayContainerRef}
        className={`training-overlay-container ${activeOverlay.type}`}
        tabIndex={-1}
        role="document"
      >
        {/* Header */}
        <div className="training-overlay-header">
          <h2
            id="training-overlay-title"
            className={`training-overlay-title ${activeOverlay.type}`}
          >
            {activeOverlay.icon && (
              <span className="training-overlay-icon" aria-hidden="true">
                {activeOverlay.icon}
              </span>
            )}
            {activeOverlay.title}
          </h2>
          {activeOverlay.dismissable && (
            <button
              className="training-overlay-close touchable with-ripple"
              onClick={dismissOverlay}
              aria-label="Close overlay"
              title="Close (ESC)"
            >
              <RippleEffect variant="dark" duration={400} />
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div className="training-overlay-body">
          {activeOverlay.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="training-overlay-section">
              <h3 className="training-overlay-section-label">
                {section.label}
              </h3>
              <ul className="training-overlay-section-items">
                {section.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="training-overlay-section-item"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        {activeOverlay.dismissable && (
          <div className="training-overlay-footer">
            <button
              className="training-overlay-button training-overlay-button-primary touchable with-ripple"
              onClick={dismissOverlay}
              autoFocus
            >
              <RippleEffect variant="light" />
              Understood
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to manually trigger training overlays
 * Useful for instructor controls or testing
 */
export function useTrainingOverlay() {
  const [manualOverlay, setManualOverlay] = useState<string | null>(null);

  const showOverlay = useCallback((overlayId: string) => {
    const overlay = getOverlayContent(overlayId);
    if (overlay) {
      setManualOverlay(overlayId);
    }
  }, []);

  const hideOverlay = useCallback(() => {
    setManualOverlay(null);
  }, []);

  return {
    manualOverlay,
    showOverlay,
    hideOverlay
  };
}