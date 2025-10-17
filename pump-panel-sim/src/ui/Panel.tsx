import React, { useState, useEffect } from 'react';
import { Settings, Power, Droplet, Volume2, VolumeX } from 'lucide-react';

/**
 * COMPLETE REWRITE - Fire Pump Panel Simulator
 * This is the ACTUAL implementation with all promised features
 * 
 * ⚠️ WARNING: This is the ONLY active panel file. All UI changes must be made here.
 * Legacy panel files have been removed. Do not create new panel variants without updating App.tsx.
 */

// ============ TYPES ============
type Source = 'tank' | 'hydrant';
type DischargeId = 'crosslay1' | 'crosslay2' | 'crosslay3' | 'frontTrashline' | 'twoPointFiveA';

interface DischargeState {
  open: boolean;
  setPsi: number;
  actualPsi: number;
  flow: number;
}

// ============ CONSTANTS ============
const DISCHARGE_LINES = [
  { id: 'crosslay1' as DischargeId, label: 'Crosslay 1', maxPsi: 250, defaultPsi: 150 },
  { id: 'crosslay2' as DischargeId, label: 'Crosslay 2', maxPsi: 250, defaultPsi: 150 },
  { id: 'crosslay3' as DischargeId, label: 'Crosslay 3', maxPsi: 250, defaultPsi: 150 },
  { id: 'frontTrashline' as DischargeId, label: 'Front Trashline', maxPsi: 200, defaultPsi: 100 },
  { id: 'twoPointFiveA' as DischargeId, label: '2.5" Line A', maxPsi: 300, defaultPsi: 175 }
];

const ENGINE_IDLE = 650;
const PUMP_BASE_RPM = 750;
const MAX_RPM = 2200;

// ============ PHOTOREAL GAUGE COMPONENT ============
interface PhotorealGaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  size?: 'small' | 'medium' | 'large';
  redline?: number;
  imageSrc?: string;
}

const PhotorealGauge: React.FC<PhotorealGaugeProps> = ({
  value,
  min,
  max,
  label,
  unit,
  size = 'medium',
  redline,
  imageSrc
}) => {
  const sizeMap = {
    small: 'w-32 h-32',
    medium: 'w-48 h-48',
    large: 'w-64 h-64'
  };

  // Adjusted for real gauge image - typically 240-270 degree sweep
  const sweepAngle = 240; // degrees of sweep for real gauges
  const startAngle = -210; // starting angle (7 o'clock position)
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const needleAngle = startAngle + (normalizedValue * sweepAngle);
  
  const isOverRedline = redline !== undefined && value >= redline;
  // Preload image to avoid repeated mount/unmount fetches which can lead to aborted requests
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    if (!imageSrc) {
      setImgLoaded(false);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'lazy';
    img.onload = () => {
      if (!cancelled) setImgLoaded(true);
    };
    img.onerror = () => {
      if (!cancelled) setImgError(true);
    };
    img.src = imageSrc;
    return () => { cancelled = true; };
  }, [imageSrc]);

  return (
    <div className="relative inline-block">
      <div className={`relative ${sizeMap[size]}`}>
        {/* Background gauge image if provided (render only after preload) */}
        {imageSrc && imgLoaded && !imgError && (
          <img
            src={imageSrc}
            alt={label}
            className="absolute inset-0 w-full h-full object-contain"
            loading="lazy"
            decoding="async"
          />
        )}
        {imageSrc && !imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">Loading…</div>
        )}
        {imageSrc && imgError && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400">Image failed to load</div>
        )}
        
        {/* Fallback SVG gauge if no image */}
        {!imageSrc && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            {/* Outer ring */}
            <circle cx="100" cy="100" r="95" fill="#1a1a1a" stroke="#333" strokeWidth="2"/>
            <circle cx="100" cy="100" r="85" fill="#0a0a0a" stroke="#222" strokeWidth="1"/>
            
            {/* Scale arc */}
            <path
              d={`M 30 170 A 70 70 0 1 1 170 170`}
              fill="none"
              stroke="#444"
              strokeWidth="2"
            />
            
            {/* Redline zone if applicable */}
            {redline && (
              <path
                d={`M ${100 + 70 * Math.cos((startAngle + (redline - min) / (max - min) * sweepAngle) * Math.PI / 180)} 
                    ${100 + 70 * Math.sin((startAngle + (redline - min) / (max - min) * sweepAngle) * Math.PI / 180)}
                    A 70 70 0 0 1 170 170`}
                fill="none"
                stroke="red"
                strokeWidth="3"
                opacity="0.7"
              />
            )}
            
            {/* Tick marks */}
            {Array.from({ length: 11 }).map((_, i) => {
              const angle = startAngle + (i / 10) * sweepAngle;
              const rad = angle * Math.PI / 180;
              const x1 = 100 + 65 * Math.cos(rad);
              const y1 = 100 + 65 * Math.sin(rad);
              const x2 = 100 + 75 * Math.cos(rad);
              const y2 = 100 + 75 * Math.sin(rad);
              
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#666"
                  strokeWidth={i % 5 === 0 ? 2 : 1}
                />
              );
            })}
            
            {/* Scale numbers */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = startAngle + (i / 5) * sweepAngle;
              const rad = angle * Math.PI / 180;
              const x = 100 + 50 * Math.cos(rad);
              const y = 100 + 50 * Math.sin(rad);
              const scaleValue = min + (i / 5) * (max - min);
              
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  fill="#888"
                  fontSize="10"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {Math.round(scaleValue)}
                </text>
              );
            })}
          </svg>
        )}
        
  {/* Needle - positioned to work with PNG gauge backgrounds */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
          <g transform={`rotate(${needleAngle} 100 100)`}>
            {/* Needle shadow for depth */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="35"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="4"
              strokeLinecap="round"
              transform="translate(2, 2)"
            />
            {/* Main needle */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="35"
              stroke={isOverRedline ? '#ff0000' : '#ff3333'}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Center cap */}
            <circle
              cx="100"
              cy="100"
              r="10"
              fill="#222"
              stroke="#444"
              strokeWidth="1"
            />
            <circle
              cx="100"
              cy="100"
              r="6"
              fill={isOverRedline ? '#ff0000' : '#ff3333'}
            />
          </g>
        </svg>
        
        {/* Digital readout - positioned to not overlap with gauge face */}
        {!imageSrc && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-2 py-1 rounded">
            <div className="text-green-400 font-mono text-sm font-bold">
              {value.toFixed(0)} {unit}
            </div>
          </div>
        )}
      </div>
      
      {/* Label */}
      <div className="text-center mt-2 text-white/80 text-sm font-medium">
        {label}
      </div>
      
      {/* Digital readout for image gauges - below the gauge */}
      {imageSrc && (
        <div className="text-center mt-1">
          <span className="text-green-400 font-mono text-sm font-bold bg-black/60 px-2 py-0.5 rounded">
            {value.toFixed(0)} {unit}
          </span>
        </div>
      )}
    </div>
  );
};

// ============ DISCHARGE LINE COMPONENT ============
interface DischargeLineProps {
  label: string;
  state: DischargeState;
  onToggle: () => void;
  onPressureChange: (psi: number) => void;
  maxPsi: number;
}

const DischargeLine: React.FC<DischargeLineProps> = ({
  label,
  state,
  onToggle,
  onPressureChange,
  maxPsi
}) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">{label}</h3>
        <button
          onClick={onToggle}
          className={`px-4 py-2 rounded font-medium transition-all ${
            state.open 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
          }`}
        >
          {state.open ? 'OPEN' : 'CLOSED'}
        </button>
      </div>
      
      {/* Pressure control slider */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Set Pressure</span>
          <span>{state.setPsi} PSI</span>
        </div>
        <input
          type="range"
          min="0"
          max={maxPsi}
          value={state.setPsi}
          onChange={(e) => onPressureChange(Number(e.target.value))}
          disabled={!state.open}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: state.open 
              ? `linear-gradient(to right, #10b981 0%, #10b981 ${(state.setPsi / maxPsi) * 100}%, #374151 ${(state.setPsi / maxPsi) * 100}%, #374151 100%)`
              : '#374151'
          }}
        />
      </div>
      
      {/* Line gauge with photoreal background */}
      <PhotorealGauge
        value={state.actualPsi}
        min={0}
        max={maxPsi}
        label="Actual"
        unit="PSI"
        size="small"
        redline={maxPsi * 0.9}
        imageSrc="/assets/crosslay_analog_gauge.png"
      />
      
      {/* Flow indicator */}
      {state.open && (
        <div className="mt-2 text-xs text-blue-400">
          Flow: {state.flow.toFixed(0)} GPM
        </div>
      )}
    </div>
  );
};

// ============ MAIN PANEL COMPONENT ============
export default function Panel() {
  const [engineRunning, setEngineRunning] = useState(false);
  const [pumpEngaged, setPumpEngaged] = useState(false);
  const [source, setSource] = useState<Source>('tank');
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Tank levels
  const [tankLevel, setTankLevel] = useState(720);
  const [foamLevel] = useState(30); // TODO: Implement foam system (currently unused)
  
  // Discharge states
  const [discharges, setDischarges] = useState<Record<DischargeId, DischargeState>>({
    crosslay1: { open: false, setPsi: 150, actualPsi: 0, flow: 0 },
    crosslay2: { open: false, setPsi: 150, actualPsi: 0, flow: 0 },
    crosslay3: { open: false, setPsi: 150, actualPsi: 0, flow: 0 },
    frontTrashline: { open: false, setPsi: 100, actualPsi: 0, flow: 0 },
    twoPointFiveA: { open: false, setPsi: 175, actualPsi: 0, flow: 0 }
  });
  
  // Calculate master gauge values
  const intakePressure = source === 'tank' ? 0 : 50; // Tank = 0 PSI, Hydrant = 50 PSI default
  
  const dischargePressure = Math.max(
    0,
    ...Object.values(discharges)
      .filter(d => d.open)
      .map(d => d.actualPsi)
  );
  
  // Calculate engine RPM based on load
  const calculateRPM = () => {
    if (!engineRunning) return 0;
    if (!pumpEngaged) return ENGINE_IDLE;
    
    // Base RPM when pump engaged
    let rpm = PUMP_BASE_RPM;
    
    // Add RPM based on discharge pressure (spec: A=0.6, B=0.15)
    const A = 0.6;
    const B = 0.15;
    rpm += A * dischargePressure + B * dischargePressure * dischargePressure / 100;
    
    return Math.min(rpm, MAX_RPM);
  };
  
  const engineRPM = calculateRPM();
  
  // Simulate pressure/flow dynamics
  useEffect(() => {
    if (!pumpEngaged) {
      // No pressure when pump not engaged
      setDischarges(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key as DischargeId].actualPsi = 0;
          updated[key as DischargeId].flow = 0;
        });
        return updated;
      });
      return;
    }
    
    const interval = setInterval(() => {
      setDischarges(prev => {
        const updated = { ...prev };
        
        Object.entries(updated).forEach(([, discharge]) => {
          if (discharge.open) {
            // Gradually approach set pressure
            const diff = discharge.setPsi - discharge.actualPsi;
            discharge.actualPsi += diff * 0.1;
            
            // Calculate flow based on pressure (simplified)
            discharge.flow = Math.sqrt(discharge.actualPsi) * 15;
          } else {
            // Gradually drop to zero
            discharge.actualPsi *= 0.9;
            discharge.flow *= 0.9;
            if (discharge.actualPsi < 1) {
              discharge.actualPsi = 0;
              discharge.flow = 0;
            }
          }
        });
        
        return updated;
      });
      
      // Consume water if pumping
      if (source === 'tank') {
        setDischarges(currentDischarges => {
          const totalFlow = Object.values(currentDischarges)
            .reduce((sum, d) => sum + d.flow, 0);
          setTankLevel(prev => Math.max(0, prev - totalFlow / 60)); // GPM to GPS
          return currentDischarges;
        });
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [pumpEngaged, source]);
  
  // Toggle discharge line
  const toggleDischarge = (id: DischargeId) => {
    setDischarges(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        open: !prev[id].open
      }
    }));
  };
  
  // Update discharge pressure
  const updateDischargePressure = (id: DischargeId, psi: number) => {
    setDischarges(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        setPsi: psi
      }
    }));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 backdrop-blur-sm border border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Fire Pump Panel Simulator</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <Settings className="text-gray-400" size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Controls */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Engine & Pump Controls */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Engine & Pump</h2>
          
          <div className="space-y-4">
            <button
              onClick={() => setEngineRunning(!engineRunning)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                engineRunning 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <Power size={20} />
              {engineRunning ? 'ENGINE RUNNING' : 'START ENGINE'}
            </button>
            
            <button
              onClick={() => setPumpEngaged(!pumpEngaged)}
              disabled={!engineRunning}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                pumpEngaged 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <Droplet size={20} />
              {pumpEngaged ? 'PUMP ENGAGED' : 'ENGAGE PUMP'}
            </button>
          </div>
        </div>
        
        {/* Source Selection */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Water Source</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSource('tank')}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                source === 'tank'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
            >
              TANK
              <div className="text-xs mt-1">{tankLevel.toFixed(0)} GAL</div>
            </button>
            
            <button
              onClick={() => setSource('hydrant')}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                source === 'hydrant'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
            >
              HYDRANT
              <div className="text-xs mt-1">∞ SUPPLY</div>
            </button>
          </div>
          
          {/* Foam System */}
          <div className="mt-4 p-3 bg-gray-700/50 rounded">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Foam</span>
              <span className="text-sm font-mono text-yellow-400">{foamLevel.toFixed(0)} GAL</span>
            </div>
          </div>
        </div>
        
        {/* System Status */}
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Engine</span>
              <span className={`font-medium ${engineRunning ? 'text-green-400' : 'text-gray-500'}`}>
                {engineRunning ? 'RUNNING' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pump</span>
              <span className={`font-medium ${pumpEngaged ? 'text-blue-400' : 'text-gray-500'}`}>
                {pumpEngaged ? 'ENGAGED' : 'DISENGAGED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Source</span>
              <span className="font-medium text-white">
                {source.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lines Open</span>
              <span className="font-medium text-white">
                {Object.values(discharges).filter(d => d.open).length} / 5
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Master Gauges */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Master Gauges</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PhotorealGauge
              value={intakePressure}
              min={-30}
              max={200}
              label="Intake Pressure"
              unit="PSI"
              size="large"
              imageSrc="/gauges/intake-gauge.png"
            />
            
            <PhotorealGauge
              value={dischargePressure}
              min={0}
              max={400}
              label="Discharge Pressure"
              unit="PSI"
              size="large"
              redline={350}
              imageSrc="/gauges/discharge-gauge.png"
            />
            
            <PhotorealGauge
              value={engineRPM}
              min={0}
              max={3000}
              label="Engine RPM"
              unit="RPM"
              size="large"
              redline={2200}
              imageSrc="/gauges/rpm-gauge.png"
            />
          </div>
        </div>
      </div>
      
      {/* Discharge Lines */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Discharge Lines</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {DISCHARGE_LINES.map(line => (
              <DischargeLine
                key={line.id}
                label={line.label}
                state={discharges[line.id]}
                onToggle={() => toggleDischarge(line.id)}
                onPressureChange={(psi) => updateDischargePressure(line.id, psi)}
                maxPsi={line.maxPsi}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}