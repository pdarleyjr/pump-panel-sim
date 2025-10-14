import React from 'react';
import type { PumpState } from '../sim/model';
import { PIERCE_PUC_STARTUP, getChecklistProgress } from '../training/startup-checklist';
import './StartupChecklist.css';

interface StartupChecklistProps {
  state: PumpState;
  onClose: () => void;
}

export function StartupChecklist({ state, onClose }: StartupChecklistProps) {
  const progress = getChecklistProgress(state, PIERCE_PUC_STARTUP);
  const allComplete = progress.completed === progress.total;
  
  return (
    <div className="startup-checklist-overlay">
      <div className="startup-checklist">
        <div className="checklist-header">
          <h2>Pierce PUC Startup Checklist</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="checklist-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="progress-text">
            {progress.completed} of {progress.total} steps completed
          </div>
        </div>
        
        <div className="checklist-steps">
          {PIERCE_PUC_STARTUP.map((step, index) => {
            const isComplete = step.check(state);
            const isCurrent = index === progress.currentStep;
            
            return (
              <div 
                key={step.id}
                className={`checklist-step ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="step-checkbox">
                  {isComplete ? '✓' : index + 1}
                </div>
                <div className="step-content">
                  <div className="step-description">{step.description}</div>
                  {isCurrent && !isComplete && (
                    <div className="step-help">{step.helpText}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {allComplete && (
          <div className="checklist-complete">
            <div className="complete-icon">✓</div>
            <div className="complete-message">
              Startup Complete! Pump is ready for operation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}