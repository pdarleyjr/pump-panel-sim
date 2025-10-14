/**
 * Training controls panel
 * Provides UI for switching training modes and toggling features
 */

import { useState } from 'react';
import './TrainingControls.css';
import { StartupChecklist } from './StartupChecklist';
import type { PumpState } from '../sim/model';

export type TrainingMode = 'tutorial' | 'explore' | 'quiz' | 'off';

interface TrainingControlsProps {
  /** Current training mode */
  mode: TrainingMode;
  /** Callback when mode changes */
  onModeChange: (mode: TrainingMode) => void;
  /** Whether definitions overlay is enabled */
  definitionsEnabled: boolean;
  /** Callback when definitions toggle changes */
  onDefinitionsToggle: () => void;
  /** Whether layout is pinned (pan/zoom disabled) */
  layoutPinned: boolean;
  /** Callback when pin toggle changes */
  onPinToggle: () => void;
  /** Current pump state for checklist */
  pumpState: PumpState;
}

/**
 * Training controls component
 * Expandable panel in top-right corner for training settings
 */
export function TrainingControls({
  mode,
  onModeChange,
  definitionsEnabled,
  onDefinitionsToggle,
  layoutPinned,
  onPinToggle,
  pumpState
}: TrainingControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  
  return (
    <div className="training-controls">
      <button 
        className="training-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label="Training controls"
      >
        🎓 Training
      </button>
      
      {expanded && (
        <div className="training-panel">
          <div className="training-section">
            <label htmlFor="training-mode-select">Mode</label>
            <select 
              id="training-mode-select"
              value={mode} 
              onChange={(e) => onModeChange(e.target.value as TrainingMode)}
            >
              <option value="off">Off</option>
              <option value="tutorial">Tutorial</option>
              <option value="explore">Explore</option>
              <option value="quiz">Quiz</option>
            </select>
            <div id="training-mode-desc" className="sr-only">
              Select training mode: Off for normal operation, Tutorial for guided instruction, Explore for free practice, or Quiz for assessment
            </div>
          </div>
          
          <div className="training-section">
            <label htmlFor="show-definitions-toggle">
              <input
                id="show-definitions-toggle"
                type="checkbox"
                checked={definitionsEnabled}
                onChange={onDefinitionsToggle}
                aria-describedby="definitions-desc"
              />
              Show Definitions
            </label>
            <div id="definitions-desc" className="sr-only">
              Display term definitions when hovering over controls
            </div>
          </div>
          
          <div className="training-section">
            <label htmlFor="pin-layout-toggle">
              <input
                id="pin-layout-toggle"
                type="checkbox"
                checked={layoutPinned}
                onChange={onPinToggle}
                aria-describedby="pin-layout-desc"
              />
              Pin Layout
            </label>
            <div id="pin-layout-desc" className="sr-only">
              Disable panning and zooming of the control panel
            </div>
          </div>
          
          <div className="training-section">
            <button
              className="training-button"
              onClick={() => setShowChecklist(true)}
              aria-label="Open Pierce PUC startup checklist"
            >
              <span aria-hidden="true">📋</span> Startup Checklist
            </button>
          </div>
        </div>
      )}
      
      {showChecklist && (
        <StartupChecklist
          state={pumpState}
          onClose={() => setShowChecklist(false)}
        />
      )}
    </div>
  );
}