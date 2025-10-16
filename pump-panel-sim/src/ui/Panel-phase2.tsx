import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ChevronLeft, ChevronRight, Gauge, Power, Droplet, Volume2, VolumeX } from "lucide-react";

/**
 * PUC Pump Panel — Phase 2: Toggle Engagement System
 * ---------------------------------------------------------------------------
 * - Horizontal 3-tile strip layout for ToggleCard
 * - Green flash animation with "ENGAGED" text
 * - 500ms delay before card swap
 * - Middle button styled as disabled/non-functional
 */

// ======= CONFIG / CONSTANTS ==================================================
const METAL_BG = "/assets/ChatGPT_Image_Oct_14_2025_05_32_49_PM.png";

const GRID = {
  cols: 12,
  rows: 8,
  gap: 16,
};

const TANK_CAPACITY_GAL = 720;
const FOAM_CAPACITY_GAL = 30;

const START_RPM = 750;
const IDLE_RPM = 600;
const MAX_SAFE_PDP = 400;

const FOAM_ENABLED_DISCHARGES = {
  crosslay1: true,
  crosslay2: true,
  crosslay3: true,
  frontTrashline: true,
  twoPointFiveA: true,
  twoPointFiveB: false,
  steamerLeft: false,
  steamerRight: false,
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// ======= AUDIO ENGINE ========================================
function useEngineAudio(enabled: boolean) {
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode; osc: OscillatorNode } | null>(null);

  useEffect(() => {
    async function init() {
      if (!enabled || audioRef.current) return;
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
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

    const gestureInit = () => init();
    window.addEventListener("pointerdown", gestureInit, { once: true });
    window.addEventListener("keydown", gestureInit, { once: true });
    return () => {
      window.removeEventListener("pointerdown", gestureInit);
      window.removeEventListener("keydown", gestureInit);
    };
  }, [enabled]);

  const setLevel = (rpm: number, engaged: boolean) => {
    const a = audioRef.current; if (!a) return;
    const norm = clamp((rpm - 400) / 2000, 0, 1);
    a.gain.gain.linearRampToValueAtTime(engaged ? norm * 0.15 : 0, a.ctx.currentTime + 0.05);
    const freq = 40 + norm * 140;
    (a.osc as OscillatorNode).frequency.linearRampToValueAtTime(freq, a.ctx.currentTime + 0.05);
  };

  const kill = () => {
    const a = audioRef.current; if (!a) return;
    a.gain.gain.value = 0;
  };

  return { setLevel, kill };
}

// ======= ANALOG GAUGE ==================================================
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
          stroke="white"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <circle cx={100} cy={130} r={6} fill="white" />
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

  // Simulation state
  const [rpm, setRpm] = useState(IDLE_RPM);
  const [pdp, setPdp] = useState(0);
  const [intakePsi, setIntakePsi] = useState(0);
  const [waterGal] = useState(TANK_CAPACITY_GAL);
  const [foamGal] = useState(FOAM_CAPACITY_GAL);

  // Audio bind
  const audio = useEngineAudio(soundOn);
  useEffect(() => { audio.setLevel(rpm, pumpEngaged); }, [audio, rpm, pumpEngaged]);

  // Engage/disengage handlers with green flash animation
  const engagePump = (mode: "water" | "foam") => {
    // Trigger engagement animation
    setEngaging(mode);
    
    // After 500ms delay, complete the engagement
    setTimeout(() => {
      if (mode === "foam") setFoamEnabled(true); else setFoamEnabled(false);
      setPumpEngaged(true);
      setRpm(START_RPM);
      setCardIndex(1); // Swap to Pump Data card
      setEngaging(null); // Reset animation state
    }, 500);
  };

  const disengagePump = () => {
    setPumpEngaged(false);
    setFoamEnabled(false);
    setRpm(IDLE_RPM);
    setPdp(0);
    audio.kill();
    setCardIndex(0);
    setEngaging(null);
  };

  // PDP <-> RPM coupling
  useEffect(() => {
    if (!pumpEngaged) { setPdp(0); return; }
    const next = Math.round((rpm - IDLE_RPM) * 0.25 + Math.max(intakePsi, 0) * 0.2);
    setPdp(clamp(next, 0, MAX_SAFE_PDP));
  }, [rpm, intakePsi, pumpEngaged]);

  const gridClass = `grid grid-cols-12 gap-${GRID.gap/4}`;

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
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setCardIndex(0)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  disabled={cardIndex === 0}
                  aria-label="Show Toggle Card"
                >
                  <ChevronLeft className="inline" /> Back
                </button>
                <div className="text-sm opacity-80">Card {cardIndex + 1} / 2</div>
                <button
                  onClick={() => setCardIndex(1)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  disabled={cardIndex === 1}
                  aria-label="Show Pump Data Card"
                >
                  Forward <ChevronRight className="inline" />
                </button>
              </div>

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
                      onDisengage={disengagePump}
                      intakeGauge={<AnalogGauge label="Intake" unit="PSI" min={-30} max={600} value={intakePsi} />}
                      dischargeGauge={<AnalogGauge label="Discharge" unit="PSI" min={0} max={600} value={pdp} redline={350} />}
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
              <div className="text-lg font-semibold mb-3">Crosslays</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "crosslay1", name: "No. 1", foam: FOAM_ENABLED_DISCHARGES.crosslay1 },
                  { id: "crosslay2", name: "No. 2", foam: FOAM_ENABLED_DISCHARGES.crosslay2 },
                  { id: "crosslay3", name: "No. 3", foam: FOAM_ENABLED_DISCHARGES.crosslay3 },
                ].map(s => (
                  <div key={s.id} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center justify-between text-sm opacity-85 mb-1">
                      <span>{s.name}</span>
                      {s.foam && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">Foam OK</span>}
                    </div>
                    <AnalogGauge label="Line" unit="PSI" min={0} max={400} value={pumpEngaged ? pdp : 0} redline={350} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Levels & Misc */}
          <div className="col-span-12 lg:col-span-3">
            <div className="rounded-2xl shadow-xl bg-white/5 border border-white/10 p-4 min-h-[260px] flex flex-col">
              <div className="flex-1 grid grid-cols-2 gap-4">
                <LevelBar label="WATER" gallons={waterGal} capacity={TANK_CAPACITY_GAL} colorClass="bg-sky-400" />
                {foamEnabled && <LevelBar label="FOAM" gallons={foamGal} capacity={FOAM_CAPACITY_GAL} colorClass="bg-rose-400" />}
              </div>
              <div className="mt-4 text-sm opacity-75">Misc. Action Card (reserved)</div>
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
                  <div className="text-sm opacity-70">Starts OFF. Enable to hear pump/engine audio that tracks RPM.</div>
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
  onDisengage: () => void;
  intakeGauge?: React.ReactNode;
  dischargeGauge?: React.ReactNode;
  engineGauge?: React.ReactNode;
}

function PumpDataCard({ rpm, setRpm, intakePsi, setIntakePsi, onDisengage, intakeGauge, dischargeGauge, engineGauge }: PumpDataCardProps) {
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
          <div className="text-sm opacity-70 mb-2">Adjust intake pressure:</div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">Adj:</span>
            <input 
              type="range" 
              min={-10} 
              max={200} 
              value={intakePsi} 
              onChange={(e) => setIntakePsi(parseInt(e.target.value))} 
              className="w-full"
              style={{
                height: '8px',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((intakePsi + 10) / 210 * 100)}%, #4b5563 ${((intakePsi + 10) / 210 * 100)}%, #4b5563 100%)`,
                borderRadius: '4px',
                outline: 'none',
                cursor: 'pointer',
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
              min={IDLE_RPM} 
              max={2200} 
              value={rpm} 
              onChange={(e) => setRpm(parseInt(e.target.value))} 
              className="w-full"
              style={{
                height: '8px',
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((rpm - IDLE_RPM) / (2200 - IDLE_RPM) * 100)}%, #4b5563 ${((rpm - IDLE_RPM) / (2200 - IDLE_RPM) * 100)}%, #4b5563 100%)`,
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

// ======= LEVEL BAR =======
interface LevelBarProps {
  label: string;
  gallons: number;
  capacity: number;
  colorClass: string;
}

function LevelBar({ label, gallons, capacity, colorClass }: LevelBarProps) {
  const pct = clamp(gallons / capacity, 0, 1);
  return (
    <div className="flex flex-col items-center">
      <div className="h-48 w-12 rounded-xl border border-white/20 bg-white/5 overflow-hidden flex items-end">
        <div className={`${colorClass} w-full`} style={{ height: `${pct * 100}%` }} />
      </div>
      <div className="mt-2 text-xs opacity-70">{label}</div>
      <div className="text-sm tabular-nums">{Math.round(gallons)} / {capacity} gal</div>
    </div>
  );
}