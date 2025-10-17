import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Gauge, Power, Droplet, Volume2, VolumeX } from "lucide-react";

/**
 * Fire Pump Panel Simulator - Spec-Compliant Implementation
 * 
 * FEATURES:
 * - Source selection (Tank/Hydrant) with correct intake behavior
 * - Master gauges: Intake (0 for tank, 50 default for hydrant), Discharge (max of open lines), Engine RPM
 * - Per-discharge gauges with photoreal face plates and SVG needles
 * - Engine RPM mapping: idle=650, pump base=750, rises with discharge pressure
 * - Gesture-gated Web Audio (no autoplay violations)
 * - 5 discharge lines with individual open/closed state and setPsi
 */

// ======= CONSTANTS ==================================================
const METAL_BG = "/assets/ChatGPT_Image_Oct_14_2025_05_32_49_PM.png";
const XLAY_GAUGE_FACE = "/assets/crosslay_analog_gauge.png";

const TANK_CAPACITY_GAL = 720;
const FOAM_CAPACITY_GAL = 30;

// Engine RPM constants per spec
const ENGINE_IDLE = 650;         // diesel idle
const PUMP_BASE_IDLE = 750;      // RPM after pump engagement
const MAX_RPM = 2200;            // Maximum engine RPM

// Type definitions
type Source = 'tank' | 'hydrant';
type DischargeId = 'crosslay1' | 'crosslay2' | 'crosslay3' | 'frontTrashline' | 'twoPointFiveA';

type DischargeState = {
  open: boolean;
  setPsi: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// ======= GESTURE-GATED WEB AUDIO ========================================
function useEngineAudio(enabled: boolean) {
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode; osc: OscillatorNode } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    async function init() {
      if (audioRef.current) return;
      
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      // Resume context only after user gesture
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      osc.connect(filter).connect(gain).connect(ctx.destination);
      gain.gain.value = 0;
      osc.start();
      audioRef.current = { ctx, gain, osc };
    }

    const gestureInit = () => {
      init().catch(err => console.warn('Audio init failed:', err));
    };
    
    window.addEventListener("pointerdown", gestureInit, { once: true });
    window.addEventListener("keydown", gestureInit, { once: true });
    
    return () => {
      window.removeEventListener("pointerdown", gestureInit);
      window.removeEventListener("keydown", gestureInit);
      if (audioRef.current) {
        audioRef.current.osc.stop();
        audioRef.current.ctx.close();
      }
    };
  }, [enabled]);

  const setLevel = (rpm: number, engaged: boolean) => {
    const a = audioRef.current;
    if (!a || a.ctx.state !== 'running') return;
    
    const norm = clamp((rpm - 400) / 2000, 0, 1);
    a.gain.gain.linearRampToValueAtTime(engaged ? norm * 0.15 : 0, a.ctx.currentTime + 0.05);
    const freq = 40 + norm * 140;
    a.osc.frequency.linearRampToValueAtTime(freq, a.ctx.currentTime + 0.05);
  };

  const kill = () => {
    const a = audioRef.current;
    if (!a) return;
    a.gain.gain.value = 0;
  };

  return { setLevel, kill };
}

// ======= ANALOG GAUGE (MASTER GAUGES) ==================================================
interface AnalogGaugeProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
  redline?: number;
}

const AnalogGauge: React.FC<AnalogGaugeProps> = ({ label, unit, min, max, value, redline }) => {
  const sweepDeg = 220;
  const startDeg = -110;
  const pct = clamp((value - min) / (max - min), 0, 1);
  const angle = startDeg + pct * sweepDeg;

  const needleColor = redline !== undefined && value >= redline ? "red" : "white";

  return (
    <div className="flex flex-col items-center select-none">
      <svg viewBox="0 0 200 140" className="w-full max-w-[260px]">
        <path d="M10,130 A90,90 0 1,1 190,130" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={14} />
        {redline !== undefined && (
          <path
            d={describeArc(100, 130, 90, valueToDeg(redline, min, max, startDeg, sweepDeg), 110)}
            fill="none"
            stroke="rgba(255,0,0,0.65)"
            strokeWidth={14}
          />
        )}
        <line
          x1={100}
          y1={130}
          x2={100 + 80 * Math.cos((Math.PI / 180) * angle)}
          y2={130 + 80 * Math.sin((Math.PI / 180) * angle)}
          stroke={needleColor}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <circle cx={100} cy={130} r={6} fill={needleColor} />
        {Array.from({ length: 11 }).map((_, i) => {
          const tPct = i / 10;
          const tAngle = startDeg + tPct * sweepDeg;
          const x1 = 100 + 86 * Math.cos((Math.PI / 180) * tAngle);
          const y1 = 130 + 86 * Math.sin((Math.PI / 180) * tAngle);
          const x2 = 100 + 96 * Math.cos((Math.PI / 180) * tAngle);
          const y2 = 130 + 96 * Math.sin((Math.PI / 180) * tAngle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={2} />;
        })}
      </svg>
      <div className="mt-1 text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{Math.round(value)}</div>
      <div className="text-xs opacity-65">{unit}</div>
    </div>
  );
};

function valueToDeg(val: number, min: number, max: number, startDeg: number, sweepDeg: number) {
  const pct = clamp((val - min) / (max - min), 0, 1);
  return startDeg + pct * sweepDeg;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg - 90) * (Math.PI / 180.0);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
  ].join(" ");
}

// ======= LINE ANALOG GAUGE (PER-DISCHARGE) ==================================================
function LineAnalogGauge({
  label, psi, min = 0, max = 400
}: { label: string; psi: number; min?: number; max?: number; }) {
  const SWEEP = 240, START = -120;
  const pct = Math.max(0, Math.min(1, (psi - min) / (max - min)));
  const angle = START + pct * SWEEP;

  return (
    <div className="relative w-40 h-40 mx-auto select-none">
      <img 
        src={XLAY_GAUGE_FACE}
        alt=""
        className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
      />
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        <circle cx="100" cy="100" r="5" fill="white" />
        <line
          x1="100" y1="100"
          x2={100 + 70 * Math.cos((Math.PI / 180) * angle)}
          y2={100 + 70 * Math.sin((Math.PI / 180) * angle)}
          stroke="white" strokeWidth="4" strokeLinecap="round"
        />
      </svg>
      <div className="absolute -bottom-5 w-full text-center text-sm font-semibold tabular-nums">
        {Math.round(psi)} PSI
      </div>
      <div className="absolute -top-5 w-full text-center text-[10px] tracking-wider opacity-80">
        {label}
      </div>
    </div>
  );
}

// ======= CROSSLAY CARD ==================================================
function CrosslayCard({ 
  id, name, discharges, setDischarges 
}: { 
  id: DischargeId; 
  name: string; 
  discharges: Record<DischargeId, DischargeState>;
  setDischarges: React.Dispatch<React.SetStateAction<Record<DischargeId, DischargeState>>>;
}) {
  const line = discharges[id];
  const psi = line.open ? line.setPsi : 0;

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">{name}</span>
        <button
          className={`text-xs px-2 py-0.5 rounded ${line.open ? 'bg-emerald-600/70' : 'bg-white/10'}`}
          onClick={() => setDischarges(d => ({ 
            ...d, 
            [id]: { ...d[id], open: !d[id].open } 
          }))}
        >
          {line.open ? 'Open' : 'Closed'}
        </button>
      </div>

      <LineAnalogGauge label="Line" psi={psi} />

      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="opacity-70 w-14">Set PSI</span>
        <input
          type="range" 
          min={0} 
          max={400} 
          value={line.setPsi}
          onChange={e => setDischarges(d => ({ 
            ...d, 
            [id]: { ...d[id], setPsi: parseInt(e.target.value) } 
          }))}
          className="flex-1"
        />
        <span className="w-10 text-right tabular-nums">{line.setPsi}</span>
      </div>
    </div>
  );
}

// ======= MAIN PANEL ===========================================================
export default function Panel() {
  // Core state
  const [pumpEngaged, setPumpEngaged] = useState(false);
  const [foamEnabled, setFoamEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [cardIndex, setCardIndex] = useState<0 | 1>(0);
  
  // Animation state for engagement
  const [engaging, setEngaging] = useState<null | 'water' | 'foam'>(null);

  // Source selection and intake
  const [source, setSource] = useState<Source>('tank');
  const [intakePsi, setIntakePsi] = useState(0);
  const [rpm, setRpm] = useState(ENGINE_IDLE);
  const [waterGal] = useState(TANK_CAPACITY_GAL);
  const [foamGal] = useState(FOAM_CAPACITY_GAL);

  // Discharge state model - individual tracking with setpoints
  const [discharges, setDischarges] = useState<Record<DischargeId, DischargeState>>({
    crosslay1: { open: false, setPsi: 0 },
    crosslay2: { open: false, setPsi: 0 },
    crosslay3: { open: false, setPsi: 0 },
    frontTrashline: { open: false, setPsi: 0 },
    twoPointFiveA: { open: false, setPsi: 0 },
  });

  // Calculate Master Discharge as highest open discharge setpoint
  const openLinePressures = Object.values(discharges)
    .filter(d => d.open)
    .map(d => d.setPsi);
  const masterDischargePsi = openLinePressures.length > 0 
    ? Math.min(Math.max(...openLinePressures), 400) 
    : 0;

  // Audio bind
  const audio = useEngineAudio(soundOn);
  useEffect(() => { audio.setLevel(rpm, pumpEngaged); }, [audio, rpm, pumpEngaged]);
  
  // Source behavior: Tank forces 0, Hydrant defaults to 50
  useEffect(() => {
    if (source === 'tank') {
      setIntakePsi(0);
    } else if (source === 'hydrant' && intakePsi === 0) {
      setIntakePsi(50); // Default to 50 PSI for hydrant
    }
  }, [source, intakePsi]);

  // Engine RPM logic with discharge pressure coupling per spec
  useEffect(() => {
    const A = 0.6;     // rpm gain per PSI of highest open line
    const B = 0.15;    // rpm relief per PSI of positive hydrant intake
    
    let target = ENGINE_IDLE;

    if (pumpEngaged) {
      target = PUMP_BASE_IDLE
             + A * masterDischargePsi
             - (source === 'hydrant' ? B * intakePsi : 0);
    }

    target = Math.max(ENGINE_IDLE, Math.min(MAX_RPM, Math.round(target)));
    setRpm(prev => prev + Math.sign(target - prev) * Math.min(50, Math.abs(target - prev)));
  }, [pumpEngaged, masterDischargePsi, source, intakePsi]);

  // Engage/disengage handlers with green flash animation
  const engagePump = (mode: "water" | "foam") => {
    setSource('tank'); // Always start on tank
    setEngaging(mode);
    
    setTimeout(() => {
      if (mode === "foam") setFoamEnabled(true); else setFoamEnabled(false);
      setPumpEngaged(true);
      setCardIndex(1);
      setEngaging(null);
    }, 500);
  };

  const disengagePump = () => {
    setPumpEngaged(false);
    setFoamEnabled(false);
    setRpm(ENGINE_IDLE);
    audio.kill();
    setCardIndex(0);
    setEngaging(null);
  };

  const gridClass = `grid grid-cols-12 gap-4`;

  return (
    <div className="relative w-full h-full min-h-[720px] text-white" style={{
      backgroundImage: `url(${METAL_BG})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <div className="absolute inset-0 bg-black/40" />

      {/* SETTINGS BUTTON */}
      <button
        aria-label="Settings"
        className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 backdrop-blur px-3 py-2 rounded-2xl flex items-center gap-2"
        onClick={() => setShowSettings(true)}
      >
        <Settings size={18} /> Settings
      </button>

      {/* PANEL GRID */}
      <div className="relative z-10 p-6 mx-auto max-w-7xl">
        <div className={gridClass}>
          {/* LEFT: Card Zone */}
          <div className="col-span-12 lg:col-span-5">
            <div className="rounded-2xl shadow-xl bg-white/5 border border-white/10 p-4 min-h-[260px]">
              <AnimatePresence mode="wait">
                {cardIndex === 0 ? (
                  <motion.div key="toggle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <ToggleCard
                      engaged={pumpEngaged}
                      foam={foamEnabled}
                      engaging={engaging}
                      onEngageWater={() => engagePump("water")}
                      onEngageFoam={() => engagePump("foam")}
                      onDisengage={disengagePump}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="pumpdata" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <PumpDataCard
                      rpm={rpm}
                      setRpm={setRpm}
                      intakePsi={intakePsi}
                      setIntakePsi={setIntakePsi}
                      source={source}
                      setSource={setSource}
                      onDisengage={disengagePump}
                      intakeGauge={<AnalogGauge label="Intake" unit="PSI" min={-10} max={200} value={source==='tank' ? 0 : intakePsi} />}
                      dischargeGauge={<AnalogGauge label="Discharge" unit="PSI" min={0} max={400} value={masterDischargePsi} redline={350} />}
                      engineGauge={<AnalogGauge label="Engine" unit="RPM" min={0} max={2200} value={rpm} />}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CENTER: Crosslays Section */}
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl shadow-xl bg-white/5 border border-white/10 p-4 min-h-[260px]">
              <div className="text-lg font-semibold mb-3">Discharge Lines</div>
              <div className="space-y-4">
                {/* Three Crosslay Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <CrosslayCard 
                    id="crosslay1" 
                    name="No. 1" 
                    discharges={discharges}
                    setDischarges={setDischarges}
                  />
                  <CrosslayCard 
                    id="crosslay2" 
                    name="No. 2" 
                    discharges={discharges}
                    setDischarges={setDischarges}
                  />
                  <CrosslayCard 
                    id="crosslay3" 
                    name="No. 3" 
                    discharges={discharges}
                    setDischarges={setDischarges}
                  />
                </div>

                {/* Front Trashline */}
                <CrosslayCard 
                  id="frontTrashline" 
                  name="Front Trashline" 
                  discharges={discharges}
                  setDischarges={setDischarges}
                />

                {/* 2.5" Line */}
                <CrosslayCard 
                  id="twoPointFiveA" 
                  name='2.5" Line' 
                  discharges={discharges}
                  setDischarges={setDischarges}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Levels & Misc */}
          <div className="col-span-12 lg:col-span-3">
            <div className="rounded-2xl shadow-xl bg-white/5 border border-white/10 p-4 min-h-[260px] flex flex-col">
              {/* Source Indicators */}
              <div className="flex gap-2 mb-4">
                <div className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${
                  source === 'tank' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  Tank: {source === 'tank' ? 'ON' : 'OFF'}
                </div>
                <div className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${
                  source === 'hydrant' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  Hydrant: {source === 'hydrant' ? 'ON' : 'OFF'}
                </div>
              </div>
              
              <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: foamEnabled ? '1fr 1fr' : '1fr' }}>
                <div className="space-y-2">
                  <div className="text-white text-sm">Water: {waterGal}/720 gal</div>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div 
                      className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                      style={{width: `${(waterGal / 720) * 100}%`}}
                    />
                  </div>
                </div>
                
                {foamEnabled && (
                  <div className="space-y-2">
                    <div className="text-white text-sm">Foam: {foamGal}/30 gal</div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div 
                        className="bg-yellow-500 h-4 rounded-full transition-all duration-300"
                        style={{width: `${(foamGal / 30) * 100}%`}}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Misc Action Card */}
              <div className="mt-4 rounded-xl bg-gray-800 p-4 border border-gray-600">
                <h4 className="text-white text-sm font-medium mb-2">Misc Actions</h4>
                <div className="text-gray-400 text-xs">Placeholder for future features</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-[520px] max-w-[92vw] rounded-2xl bg-neutral-900 border border-white/10 p-6"
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">Settings</div>
                <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20" onClick={() => setShowSettings(false)}>Close</button>
              </div>

              <div className="flex items-center gap-3">
                <div className="shrink-0 p-2 rounded-xl bg-white/5 border border-white/10">
                  {soundOn ? <Volume2 /> : <VolumeX />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">Sound</div>
                  <div className="text-sm opacity-70">Enable to hear pump/engine audio that tracks RPM. Starts only after user interaction.</div>
                </div>
                <button
                  className={`px-4 py-2 rounded-xl border ${soundOn ? "bg-emerald-600/80 border-emerald-400" : "bg-white/10 border-white/20"}`}
                  onClick={() => setSoundOn(v => !v)}
                >
                  {soundOn ? "ON" : "OFF"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ======= TOGGLE CARD WITH HORIZONTAL LAYOUT AND GREEN FLASH =======
interface ToggleCardProps {
  engaged: boolean;
  foam: boolean;
  engaging: null | 'water' | 'foam';
  onEngageWater: () => void;
  onEngageFoam: () => void;
  onDisengage: () => void;
}

function ToggleCard({ engaged, foam, engaging, onEngageWater, onEngageFoam, onDisengage }: ToggleCardProps) {
  const isWaterEngaging = engaging === 'water';
  const isFoamEngaging = engaging === 'foam';
  
  return (
    <div>
      {/* Horizontal 3-tile strip */}
      <div className="flex gap-2 w-full mb-4">
        {/* Water Pump Button */}
        <motion.button
          className={`
            flex-1 rounded-xl border p-4 min-h-[140px]
            flex flex-col items-center justify-center
            transition-all duration-300
            ${isWaterEngaging 
              ? 'bg-emerald-500 border-emerald-400 text-white animate-pulse' 
              : engaged && !foam 
                ? 'bg-emerald-600/80 border-emerald-400' 
                : 'bg-white/10 border-white/20 hover:bg-white/20 hover:brightness-110'
            }
          `}
          onClick={onEngageWater}
          disabled={engaged || engaging !== null}
          animate={isWaterEngaging ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Power className={`w-10 h-10 mb-2 ${(engaged && !foam) || isWaterEngaging ? "text-white" : "text-white/70"}`} />
          <div className="uppercase text-sm font-semibold tracking-wider">
            {isWaterEngaging ? "ENGAGED" : "Water Pump"}
          </div>
        </motion.button>

        {/* OK to Pump & Roll (Visual Only - Disabled) */}
        <button
          className="
            flex-1 rounded-xl border p-4 min-h-[140px]
            flex flex-col items-center justify-center
            bg-white/5 border-white/10 opacity-50 cursor-not-allowed
          "
          disabled
        >
          <Gauge className="w-10 h-10 mb-2 text-white/40" />
          <div className="uppercase text-sm font-semibold tracking-wider text-white/40">
            OK to Pump & Roll
          </div>
          <div className="text-xs opacity-70 mt-1">(Visual Only)</div>
        </button>

        {/* Foam System Button */}
        <motion.button
          className={`
            flex-1 rounded-xl border p-4 min-h-[140px]
            flex flex-col items-center justify-center
            transition-all duration-300
            ${isFoamEngaging 
              ? 'bg-emerald-500 border-emerald-400 text-white animate-pulse' 
              : engaged && foam 
                ? 'bg-emerald-600/80 border-emerald-400' 
                : 'bg-white/10 border-white/20 hover:bg-white/20 hover:brightness-110'
            }
          `}
          onClick={onEngageFoam}
          disabled={engaged || engaging !== null}
          animate={isFoamEngaging ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Droplet className={`w-10 h-10 mb-2 ${(engaged && foam) || isFoamEngaging ? "text-white" : "text-white/70"}`} />
          <div className="uppercase text-sm font-semibold tracking-wider">
            {isFoamEngaging ? "ENGAGED" : engaged && foam ? "Foam Ready" : "Foam System"}
          </div>
        </motion.button>
      </div>

      {/* Disengage Button */}
      <button
        className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
        onClick={onDisengage}
        disabled={!engaged || engaging !== null}
      >
        Disengage Pump
      </button>
    </div>
  );
}

// ======= PUMP DATA CARD =======
interface PumpDataCardProps {
  rpm: number;
  setRpm: (n: number) => void;
  intakePsi: number;
  setIntakePsi: (n: number) => void;
  source: 'tank'|'hydrant';
  setSource: (s: 'tank'|'hydrant') => void;
  onDisengage: () => void;
  intakeGauge?: React.ReactNode;
  dischargeGauge?: React.ReactNode;
  engineGauge?: React.ReactNode;
}

function PumpDataCard({ rpm, setRpm, intakePsi, setIntakePsi, source, setSource, onDisengage, intakeGauge, dischargeGauge, engineGauge }: PumpDataCardProps) {
  const intakeDisabled = source === 'tank';
  
  return (
    <div>
      {(intakeGauge || dischargeGauge || engineGauge) && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {intakeGauge && <div className="rounded-xl bg-white/5 border border-white/10 p-2">{intakeGauge}</div>}
          {dischargeGauge && <div className="rounded-xl bg-white/5 border border-white/10 p-2">{dischargeGauge}</div>}
          {engineGauge && <div className="rounded-xl bg-white/5 border border-white/10 p-2">{engineGauge}</div>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="mb-2 font-medium">Pump Intake</div>
          
          {/* Source Switcher */}
          <div className="mb-2 flex gap-2 text-sm">
            <span className="opacity-70">Source:</span>
            <button 
              className={`px-2 py-1 rounded ${source==='tank'?'bg-emerald-600/70':'bg-white/10'}`} 
              onClick={() => setSource('tank')}
            >
              Tank
            </button>
            <button 
              className={`px-2 py-1 rounded ${source==='hydrant'?'bg-emerald-600/70':'bg-white/10'}`} 
              onClick={() => setSource('hydrant')}
            >
              Hydrant
            </button>
          </div>
          
          <div className="text-sm opacity-70 mb-2">Adjust intake pressure:</div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">Adj:</span>
            <input 
              type="range" 
              min={0} 
              max={200} 
              disabled={intakeDisabled}
              value={intakePsi} 
              onChange={(e) => setIntakePsi(parseInt(e.target.value))} 
              className={`w-full ${intakeDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                height: '8px',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${(intakePsi / 200 * 100)}%, #4b5563 ${(intakePsi / 200 * 100)}%, #4b5563 100%)`,
                borderRadius: '4px',
                outline: 'none',
                cursor: intakeDisabled ? 'not-allowed' : 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>
          <div className="mt-2 text-center text-xl font-semibold tabular-nums">{Math.round(intakePsi)} PSI</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="mb-2 font-medium">Engine RPM</div>
          <div className="text-sm opacity-70 mb-2">Adjust throttle:</div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">Throttle:</span>
            <input 
              type="range" 
              min={ENGINE_IDLE} 
              max={2200} 
              value={rpm} 
              onChange={(e) => setRpm(parseInt(e.target.value))} 
              className="w-full"
              style={{
                height: '8px',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((rpm - ENGINE_IDLE) / (2200 - ENGINE_IDLE) * 100)}%, #4b5563 ${((rpm - ENGINE_IDLE) / (2200 - ENGINE_IDLE) * 100)}%, #4b5563 100%)`,
                borderRadius: '4px',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
          </div>
          <div className="mt-2 text-center text-xl font-semibold tabular-nums">{Math.round(rpm)} RPM</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20" onClick={onDisengage}>Disengage Pump</button>
      </div>
    </div>
  );
}
