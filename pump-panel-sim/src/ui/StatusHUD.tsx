import React, { memo, useMemo } from 'react';
import { getPumpStatus } from '../sim/gauges';
import { isDRVActive, getDRVStatus } from '../sim/drv';
import './StatusHUD.css';
import type { PumpState } from '../sim/model';

interface StatusHUDProps {
  state: PumpState;
  // New props from simulation context
  mode?: 'RPM' | 'PRESSURE';
  setpoint?: number;
  pdp?: number;
  rpm?: number;
  intake?: number;
  flow?: number;
  pumpTemp?: number;
  engineTemp?: number;
  warnings?: string[];
  foamSystemEnabled?: boolean;
  foamTankGallons?: number;
}

// PERFORMANCE: Memoize component to prevent unnecessary re-renders
export const StatusHUD = memo(function StatusHUD({
  state,
  mode,
  setpoint,
  pdp,
  rpm,
  intake,
  flow,
  pumpTemp,
  engineTemp,
  warnings,
  foamSystemEnabled,
  foamTankGallons
}: StatusHUDProps) {
  // PERFORMANCE: Memoize expensive calculations
  const status = useMemo(() => getPumpStatus(state), [state]);
  
  // Use new values if provided, otherwise fall back to old system
  const displayMode = mode || status.mode;
  const displaySetpoint = setpoint !== undefined ? setpoint : status.setpoint;
  const displayPDP = pdp !== undefined ? pdp : status.actualPDP;
  const displayRPM = rpm !== undefined ? rpm : status.actualRPM;
  const displayIntake = intake !== undefined ? intake : status.intakePsi;
  const displayFlow = flow !== undefined ? flow : status.totalFlowGpm;
  const displayPumpTemp = pumpTemp !== undefined ? pumpTemp : state.pumpTempF;
  const displayEngineTemp = engineTemp !== undefined ? engineTemp : state.engineTempF;
  const displayWarnings = warnings || status.warnings;
  
  // PERFORMANCE: Memoize warning categorization
  const categorizedWarnings = useMemo(() => {
    // Get governor-specific warnings
    const governorWarnings = displayWarnings.filter(w =>
      w.includes('SURGE') ||
      w.includes('HIGH PRESSURE') ||
      w.includes('Governor') ||
      w.includes('GOV') ||
      w.includes('RPM MODE') ||
      w.includes('PSI MODE')
    );
    
    // Get overpressure warnings (Phase 2.3)
    const overpressureWarnings = displayWarnings.filter(w =>
      w.includes('OVERPRESSURE') ||
      w.includes('HOSE') && w.includes('BURST') ||
      w.includes('High discharge pressure')
    );
    
    const otherWarnings = displayWarnings.filter(w =>
      !governorWarnings.includes(w) && !overpressureWarnings.includes(w)
    );
    
    return { governorWarnings, overpressureWarnings, otherWarnings };
  }, [displayWarnings]);
  
  const { governorWarnings, overpressureWarnings, otherWarnings } = categorizedWarnings;
  
  // Get DRV status
  const drvActive = isDRVActive(state);
  const drvStatusText = getDRVStatus(state, displayPDP);
  
  return (
    <div className="status-hud">
      <div className="status-header">PUMP STATUS</div>
      
      {/* ARIA live region for critical announcements */}
      <div 
        role="status" 
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      >
        {/* Announce critical overpressure warnings */}
        {overpressureWarnings.length > 0 && overpressureWarnings[0]}
        {/* Announce governor warnings */}
        {overpressureWarnings.length === 0 && governorWarnings.length > 0 && governorWarnings[0]}
        {/* Announce DRV activation */}
        {overpressureWarnings.length === 0 && governorWarnings.length === 0 && drvActive && drvStatusText}
      </div>
      
      <div className="status-grid">
        {/* Mode & Setpoint */}
        <div className="status-item">
          <div className="status-label">Governor</div>
          <div className={`status-value mode-${displayMode.toLowerCase()}`}>
            {displayMode} MODE
          </div>
        </div>
        
        <div className="status-item">
          <div className="status-label">Setpoint</div>
          <div className="status-value">
            {Math.round(displaySetpoint)} {displayMode === 'PRESSURE' ? 'PSI' : 'RPM'}
          </div>
        </div>
        
        {/* Actual Values */}
        <div className="status-item">
          <div className="status-label">Discharge</div>
          <div className="status-value">
            {Math.round(displayPDP)} PSI
          </div>
        </div>
        
        <div className="status-item">
          <div className="status-label">RPM</div>
          <div className="status-value">
            {Math.round(displayRPM)}
          </div>
        </div>
        
        {/* Intake */}
        <div className="status-item">
          <div className="status-label">Intake</div>
          <div className="status-value">
            {displayIntake < 0
              ? `${Math.round(Math.abs(displayIntake))}" Hg`
              : `${Math.round(displayIntake)} PSI`
            }
          </div>
        </div>
        
        {/* Flow */}
        <div className="status-item">
          <div className="status-label">Flow</div>
          <div className="status-value">
            {Math.round(displayFlow)} GPM
          </div>
        </div>
        
        {/* Tank Fill/Recirculation Status */}
        {state.tankFillRecircPct > 0 && (
          <div className="status-item">
            <div className="status-label">
              {state.waterSource === 'hydrant' ? 'Tank Fill' : 'Recirc'}
            </div>
            <div className="status-value" style={{ color: state.waterSource === 'hydrant' ? '#00aaff' : '#00ff00' }}>
              {state.waterSource === 'hydrant'
                ? `${Math.round((state.tankFillRecircPct / 100) * 100)} GPM`
                : `${Math.round((state.tankFillRecircPct / 100) * 50)} GPM`
              }
            </div>
          </div>
        )}
        {/* Tank Level with color coding (Phase 2.5) */}
        <div className="status-item">
          <div className="status-label">Tank Level</div>
          <div
            className="status-value"
            style={{
              color: state.tankGallons <= 0 ? '#ff0000' :      // Red: Empty
                     state.tankGallons < 50 ? '#ff8800' :      // Orange: Critically low
                     state.tankGallons < 100 ? '#ffcc00' :     // Yellow: Low
                     state.tankGallons < 250 ? '#ffff00' :     // Light yellow: Getting low
                     '#00ff00',                                 // Green: Good level
              fontWeight: state.tankGallons < 100 ? 'bold' : 'normal',
              textShadow: state.tankGallons <= 0 ? '0 0 8px rgba(255, 0, 0, 0.8)' : 'none',
              animation: state.tankGallons <= 0 ? 'pulse 1s ease-in-out infinite' : 'none'
            }}
          >
            {Math.round(state.tankGallons)}/{500} gal
          </div>
        </div>
        
        {/* Temperatures with color coding */}
        <div className="status-item">
          <div className="status-label">Pump Temp</div>
          <div
            className="status-value"
            style={{
              color: displayPumpTemp > 212 ? '#ff0000' :  // Red: Critical (> 212°F - boiling)
                     displayPumpTemp > 200 ? '#ff8800' :  // Orange: Hot (200-212°F)
                     displayPumpTemp > 180 ? '#ffcc00' :  // Yellow: Warm (180-200°F)
                     '#00ff00',                           // Green: Normal (< 180°F)
              fontWeight: displayPumpTemp > 200 ? 'bold' : 'normal',
              textShadow: displayPumpTemp > 212 ? '0 0 8px rgba(255, 0, 0, 0.8)' : 'none'
            }}
          >
            {Math.round(displayPumpTemp)}°F
          </div>
        </div>
        
        <div className="status-item">
          <div className="status-label">Engine Temp</div>
          <div
            className="status-value"
            style={{
              color: displayEngineTemp > 230 ? '#ff0000' :  // Red: Overheating
                     displayEngineTemp > 210 ? '#ffcc00' :  // Yellow: Elevated
                     '#00ff00',                             // Green: Normal
              fontWeight: displayEngineTemp > 230 ? 'bold' : 'normal'
            }}
          >
            {Math.round(displayEngineTemp)}°F
          </div>
        </div>
      </div>
      
      {/* DRV Status Indicator */}
      {drvActive && (
        <div className="drv-status-active" style={{
          padding: '8px 12px',
          marginTop: '8px',
          backgroundColor: 'rgba(255, 170, 0, 0.2)',
          border: '2px solid #ffaa00',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#ffaa00',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          🔄 {drvStatusText}
        </div>
      )}
      
      {/* Overpressure warnings (critical priority) */}
      {overpressureWarnings.length > 0 && (
        <div className="status-warnings" style={{
          border: '3px solid #ff0000',
          backgroundColor: 'rgba(255, 0, 0, 0.3)',
          animation: overpressureWarnings.some(w => w.includes('OVERPRESSURE')) ? 'pulse 1s ease-in-out infinite' : 'none'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff0000', fontSize: '16px' }}>
            🚨 PRESSURE CRITICAL:
          </div>
          {overpressureWarnings.map((warning, i) => (
            <div key={i} className="warning-item" style={{
              color: warning.includes('BURST') ? '#ff0000' :
                     warning.includes('OVERPRESSURE') ? '#ff3333' : '#ffaa00',
              fontWeight: 'bold',
              fontSize: warning.includes('BURST') ? '15px' : '14px'
            }}>
              {warning}
            </div>
          ))}
        </div>
      )}
      
      {/* Governor-specific warnings (high priority) */}
      {governorWarnings.length > 0 && (
        <div className="status-warnings" style={{
          border: '2px solid #ff9900',
          backgroundColor: 'rgba(255, 153, 0, 0.2)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff9900' }}>
            ⚙️ GOVERNOR STATUS:
          </div>
          {governorWarnings.map((warning, i) => (
            <div key={i} className="warning-item">
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}
      
      {/* Other warnings */}
      {otherWarnings.length > 0 && (
        <div
          className="status-warnings"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {otherWarnings.map((warning, i) => (
            <div key={i} className="warning-item" role="status">
              <span aria-hidden="true">⚠️</span> {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});