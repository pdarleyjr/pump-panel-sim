/**
 * Definitions overlay component
 * Shows educational information about controls when hovering
 */

import { getDefinition } from '../training/definitions';
import './DefinitionsOverlay.css';

interface DefinitionsOverlayProps {
  /** Whether definitions system is enabled */
  enabled: boolean;
  /** ID of the currently hovered control */
  hoveredControl: string | null;
}

/**
 * Definitions overlay component
 * Displays educational descriptions at the bottom of the screen
 * when hovering over controls
 */
export function DefinitionsOverlay({ enabled, hoveredControl }: DefinitionsOverlayProps) {
  if (!enabled || !hoveredControl) return null;
  
  const definition = getDefinition(hoveredControl);
  if (!definition) return null;
  
  return (
    <div className="definitions-overlay">
      <div className="definition-title">
        {hoveredControl.replace(/_/g, ' ').toUpperCase()}
      </div>
      <div className="definition-text">
        {definition}
      </div>
    </div>
  );
}