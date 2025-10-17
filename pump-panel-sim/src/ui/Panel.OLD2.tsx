import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Power, Droplet, Volume2, VolumeX } from 'lucide-react';

/**
 * COMPLETE REWRITE - Fire Pump Panel Simulator
 * This is the ACTUAL implementation with all promised features
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

  const sweepAngle = 270; // degrees of sweep
  const startAngle = -225; // starting angle
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const needleAngle = startAngle + (normalizedValue * sweepAngle);
  
  const isOverRedline = redline !== undefined && value >= redline;

  return (
    <div className="relative inline-block">
      <div className={`relative ${sizeMap[size]}`}>
        {/* Background gauge image if provided */}
        {imageSrc && (
          <img 
            src={imageSrc} 
            alt={label}
            className="absolute inset-0 w-full h-full object-contain"
          />
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
              const value = min + (i / 5) * (max - min);
              
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
                  {Math.round(value)}
                </text>
              );
            })}
          </svg>
        )}
        
        {/* Needle */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
          <g transform={`rotate(${needleAngle} 100 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke={isOverRedline ? '#ff0000' : '#ffffff'}
              strokeWidth="3"
              strokeLinecap="round"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
            />
            <circle
              cx="100"
              cy="100"
              r="8"
              fill={isOverRedline ? '#ff0000' : '#ffffff'}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
            />
          </g>
        </svg>
        
        {/* Digital readout */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-2 py-1 rounded">
          <div className="text-green-400 font-mono text-sm font-bold">
            {value.toFixed(0)} {unit}
          </div>
        </div>
      </div>
      
      {/* Label */}
      <div className="text-center mt-2 text-white/80 text-sm font-medium">
        {label}
      </div>
    </div>
  );
};

// ============ DISCHARGE LINE COMPONENT ============
interface DischargeLineProps {
  id: DischargeId;
  label: string;
  state: DischargeState;
  onToggle: () => void;
  onPressureChange: (psi: number) => void;
  maxPsi: number;
}

const DischargeLine: React.FC<DischargeLineProps> = ({
  id,
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
      
      {/* Line gauge */}
      <PhotorealGauge
        value={state.actualPsi}
        min={0}
        max={maxPsi}
        label="Actual"
        unit="PSI"
        size="small"
        redline={maxPsi * 0.9}
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
  const [foamLevel, setFoamLevel] = useState(30);
  
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
        
        Object.entries(updated).forEach(([key, discharge]) => {
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
        const totalFlow = Object.values(discharges)
          .reduce((sum, d) => sum + d.flow, 0);
        setTankLevel(prev => Math.max(0, prev - totalFlow / 60)); // GPM to GPS
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
            />
            
            <PhotorealGauge
              value={dischargePressure}
              min={0}
              max={400}
              label="Discharge Pressure"
              unit="PSI"
              size="large"
              redline={350}
            />
            
            <PhotorealGauge
              value={engineRPM}
              min={0}
              max={3000}
              label="Engine RPM"
              unit="RPM"
              size="large"
              redline={2200}
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
                id={line.id}
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