import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ChevronLeft, ChevronRight, Gauge, Power, Droplet, Volume2, VolumeX } from "lucide-react";

/**
 * PUC Pump Panel — Clean Rebuild v0.1 (Foundations)
 * ---------------------------------------------------------------------------
 * Purpose
 *  - Throw away all legacy CSS/graphics and render a NEW, grid-based panel.
 *  - Zero overlap using a mathematical grid + card system.
 *  - Metallic background (supply your own image URL in METAL_BG).
 *  - Start with Engine/Pump OFF; all gauges zeroed; all valves closed.
 *  - Engage pump via a Toggle Card (lights green briefly), then auto-swap to
 *    Pump Data card with back/forward arrows to flip between them.
 *  - Optional FOAM toggle enables foam-capable discharges only and shows a
 *    foam level gauge (30 gal). Water tank is 720 gal.
 *  - Sound is OFF by default; user can enable via Settings. Pump audio reacts
 *    to engine RPM.
 *  - Gauges: Analog SVG with a moving needle + digital numeric under each.
 *  - No training mode, no scenarios. Strictly the base simulator shell.
 *
 * Tech & Style
 *  - Single-file React component. Tailwind for layout classes (no external CSS).
 *  - Clean, modern, high-contrast UI. Cards with rounded-2xl & soft shadow.
 *  - Grid is responsive and prevents overlaps.
 *
 * IMPORTANT for assets:
 *  - Replace METAL_BG with the path to your metallic image
 *    (e.g., /assets/metal.jpg). The user-provided file name can be copied into
 *    /public and referenced here. For dev preview, a data URL also works.
 *  - Any photorealistic assets you generate can be placed in /public/assets and
 *    swapped into the placeholders noted below.
 */

// ======= CONFIG / CONSTANTS ==================================================
const METAL_BG = "/panel-background.png"; // metallic background image (FULL-BLEED)

const GRID = {
  cols: 12, // use a 12-col grid, responsive
  rows: 8,  // logical rows for height zoning (not strict CSS rows)
  gap: 16,  // px gap between grid items
};

const TANK_CAPACITY_GAL = 720; // water
const FOAM_CAPACITY_GAL = 30;  // foam

// Defaults that can be tuned against the Pierce manual / apparatus profile
const START_RPM = 750; // initial governor target when pump engages
const IDLE_RPM = 600;  // engine idle when pump OFF
const MAX_SAFE_PDP = 400; // PSI max safe PDP (redline visual only)

// Which discharges can flow foam in this simplified foundation build
const FOAM_ENABLED_DISCHARGES = {
  crosslay1: true,
  crosslay2: true,
  crosslay3: true,
  frontTrashline: true,
  twoPointFiveA: true, // only one 2.5" discharge supports foam
  twoPointFiveB: false,
  steamerLeft: false,
  steamerRight: false,
};

// Small helper to clamp numbers
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// ======= AUDIO ENGINE (gesture-gated) ========================================
function useEngineAudio(enabled: boolean) {
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode; osc: OscillatorNode } | null>(null);

  useEffect(() => {
    async function init() {
      if (!enabled || audioRef.current) return;
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth"; // engine-like timbre; filtered below
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      osc.connect(filter).connect(gain).connect(ctx.destination);
      gain.gain.value = 0; // start muted
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
    const norm = clamp((rpm - 400) / 2000, 0, 1); // normalize rough RPM range
    a.gain.gain.linearRampToValueAtTime(engaged ? norm * 0.15 : 0, a.ctx.currentTime + 0.05);
    const freq = 40 + norm * 140; // base engine note
    (a.osc as OscillatorNode).frequency.linearRampToValueAtTime(freq, a.ctx.currentTime + 0.05);
  };

  const kill = () => {
    const a = audioRef.current; if (!a) return;
    a.gain.gain.value = 0;
  };

  return { setLevel, kill };
}

// ======= ANALOG GAUGE (SVG) ==================================================
interface AnalogGaugeProps {
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
  redline?: number; // draw arc in red above this value
}

const AnalogGauge: React.FC<AnalogGaugeProps> = ({ label, unit, min, max, value, redline }) => {
  // 220-degree sweep: -110° (left) to +110° (right)
  const sweepDeg = 220;
  const startDeg = -110;
  const pct = clamp((value - min) / (max - min), 0, 1);
  const angle = startDeg + pct * sweepDeg; // -110 to +110

  return (
    <div className="flex flex-col items-center select-none">
      <svg viewBox="0 0 200 140" className="w-full max-w-[260px]">
        {/* gauge arc */}
        <path d="M10,130 A90,90 0 1,1 190,130" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={14} />
        {/* redline */}
        {redline !== undefined && (
          <path
            d={describeArc(100, 130, 90, valueToDeg(redline, min, max, startDeg, sweepDeg), 110)}
            fill="none"
            stroke="rgba(255,0,0,0.65)"
            strokeWidth={14}
          />
        )}
        {/* needle pivot */}
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
        {/* ticks */}
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

// Describe arc helper for redline path
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
export default function PanelClean() {
  // Core state
  const [pumpEngaged, setPumpEngaged] = useState(false);
  const [foamEnabled, setFoamEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(false); // starts OFF per requirements
  const [cardIndex, setCardIndex] = useState<0 | 1>(0); // 0=Toggle card, 1=Pump Data

  // Simulation state (foundation only)
  const [rpm, setRpm] = useState(IDLE_RPM);
  const [pdp, setPdp] = useState(0); // pump discharge pressure (PSI)
  const [intakePsi, setIntakePsi] = useState(0);
  const [waterGal] = useState(TANK_CAPACITY_GAL);
  const [foamGal] = useState(FOAM_CAPACITY_GAL);

  // Audio bind
  const audio = useEngineAudio(soundOn);
  useEffect(() => { audio.setLevel(rpm, pumpEngaged); }, [audio, rpm, pumpEngaged]);

  // Engage/disengage handlers
  const engagePump = (mode: "water" | "foam") => {
    // Toggle card flashes green then swaps to Pump Data
    if (mode === "foam") setFoamEnabled(true); else setFoamEnabled(false);
    setPumpEngaged(true);
    setRpm(START_RPM);
    setTimeout(() => setCardIndex(1), 500); // brief confirmation before swap
  };

  const disengagePump = () => {
    setPumpEngaged(false);
    setFoamEnabled(false);
    setRpm(IDLE_RPM);
    setPdp(0);
    audio.kill();
    setCardIndex(0);
  };

  // Simple PDP <-> RPM coupling (placeholder logic; replace with physics engine later)
  useEffect(() => {
    if (!pumpEngaged) { setPdp(0); return; }
    // naive mapping for now: PDP rises with RPM and intake head
    const next = Math.round((rpm - IDLE_RPM) * 0.25 + Math.max(intakePsi, 0) * 0.2);
    setPdp(clamp(next, 0, MAX_SAFE_PDP));
  }, [rpm, intakePsi, pumpEngaged]);

  // Layout helpers
  const gridClass = `grid grid-cols-12 gap-${GRID.gap/4}`; // Tailwind gap-4 if 16px

  return (
    <div className="relative w-full h-full min-h-[720px] text-white" style={{
      backgroundImage: `url(${METAL_BG})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      {/* overlay tint for contrast */}
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
          {/* ROW 1: Top Section */}
          {/* LEFT: Card Zone (Toggle Card <-> Pump Data) - NOW col-span-3 */}
          <div className="col-span-12 lg:col-span-3">
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
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CENTER: Master Gauges Section - ALWAYS VISIBLE col-span-6 */}
          <div className="col-span-12 lg:col-span-6">
            <MasterGaugesSection
              intakePsi={intakePsi}
              dischargePsi={pdp}
              engineRpm={rpm}
            />
          </div>

          {/* RIGHT: Pierce Control Panel Placeholder - col-span-3 */}
          <div className="col-span-12 lg:col-span-3">
            <PierceControlPanelPlaceholder />
          </div>

          {/* ROW 2: Center Section */}
          {/* Crosslays/Discharges scaffold - NOW col-span-8 */}
          <div className="col-span-12 lg:col-span-8">
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

          {/* RIGHT: Levels & Misc - NOW col-span-4 */}
          <div className="col-span-12 lg:col-span-4">
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

// ======= SUBCOMPONENTS =======================================================

// Master Gauges Section - ALWAYS VISIBLE at top center
interface MasterGaugesSectionProps {
  intakePsi: number;
  dischargePsi: number;
  engineRpm: number;
}

function MasterGaugesSection({ intakePsi, dischargePsi, engineRpm }: MasterGaugesSectionProps) {
  return (
    <div className="rounded-2xl shadow-xl bg-white/5 border border-white/10 p-4 min-h-[260px]">
      <div className="text-lg font-semibold mb-3 text-center">Master Gauges</div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <AnalogGauge label="Intake" unit="PSI" min={-30} max={600} value={intakePsi} />
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <AnalogGauge label="Discharge" unit="PSI" min={0} max={600} value={dischargePsi} redline={350} />
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <AnalogGauge label="Engine" unit="RPM" min={0} max={2200} value={engineRpm} />
        </div>
      </div>
    </div>
  );
}

// Pierce Control Panel Placeholder - Phase 5 implementation
function PierceControlPanelPlaceholder() {
  return (
    <div className="rounded-2xl shadow-xl bg-white/5 border border-white/10 p-4 min-h-[260px] flex flex-col items-center justify-center">
      <div className="text-lg font-semibold mb-2">Pierce Control Panel</div>
      <div className="text-sm opacity-70 text-center">
        Engage/Disengage Controls
        <br />
        (Phase 5)
      </div>
    </div>
  );
}

interface ToggleCardProps {
  engaged: boolean;
  foam: boolean;
  onEngageWater: () => void;
  onEngageFoam: () => void;
  onDisengage: () => void;
}

function ToggleCard({ engaged, foam, onEngageWater, onEngageFoam, onDisengage }: ToggleCardProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1 rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col items-center justify-center text-center min-h-[180px]">
        <div className="uppercase text-[11px] tracking-wider opacity-70 mb-1">Water Pump</div>
        <Power className={`w-9 h-9 ${engaged && !foam ? "text-emerald-400" : "text-white/70"}`} />
        <button
          className={`mt-3 w-full px-3 py-2 rounded-xl border ${engaged && !foam ? "bg-emerald-600/80 border-emerald-400" : "bg-white/10 border-white/20 hover:bg-white/20"}`}
          onClick={onEngageWater}
        >
          {engaged && !foam ? "ENGAGED" : "ENGAGE"}
        </button>
      </div>

      <div className="col-span-1 rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col items-center justify-center text-center min-h-[180px]">
        <div className="uppercase text-[11px] tracking-wider opacity-70 mb-1">OK to Pump & Roll</div>
        <Gauge className="w-9 h-9 text-lime-400" />
        <div className="mt-2 text-xs opacity-70">(visual only in v0.1)</div>
      </div>

      <div className="col-span-1 rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col items-center justify-center text-center min-h-[180px]">
        <div className="uppercase text-[11px] tracking-wider opacity-70 mb-1">Foam System</div>
        <Droplet className={`w-9 h-9 ${engaged && foam ? "text-emerald-400" : "text-white/70"}`} />
        <button
          className={`mt-3 w-full px-3 py-2 rounded-xl border ${engaged && foam ? "bg-emerald-600/80 border-emerald-400" : "bg-white/10 border-white/20 hover:bg-white/20"}`}
          onClick={onEngageFoam}
        >
          {engaged && foam ? "FOAM READY" : "ENABLE FOAM"}
        </button>
      </div>

      <div className="col-span-3">
        <button
          className="w-full mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20"
          onClick={onDisengage}
        >
          Disengage Pump
        </button>
      </div>
    </div>
  );
}

interface PumpDataCardProps {
  rpm: number;
  setRpm: (n: number) => void;
  intakePsi: number;
  setIntakePsi: (n: number) => void;
  onDisengage: () => void;
}

function PumpDataCard({ rpm, setRpm, intakePsi, setIntakePsi, onDisengage }: PumpDataCardProps) {
  return (
    <div>
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
                background: 'linear-gradient(to right, #10b981 0%, #10b981 ' + ((intakePsi + 10) / 210 * 100) + '%, #4b5563 ' + ((intakePsi + 10) / 210 * 100) + '%, #4b5563 100%)',
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
                background: 'linear-gradient(to right, #10b981 0%, #10b981 ' + ((rpm - IDLE_RPM) / (2200 - IDLE_RPM) * 100) + '%, #4b5563 ' + ((rpm - IDLE_RPM) / (2200 - IDLE_RPM) * 100) + '%, #4b5563 100%)',
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