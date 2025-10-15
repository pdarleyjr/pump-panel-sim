# Fire Pump Panel Simulator

A web-based fire pump panel simulator with realistic hydraulics, audio feedback, and haptics support. Built for mission-critical training with strict CSP compliance, WCAG 2.1 Level AA accessibility, and Pierce PUC operational accuracy.

**Production URL**: https://pump-panel-sim.pages.dev

## Table of Contents

- [Deployment](#deployment)
- [CSP, Audio & WebGL in Production](#csp-audio--webgl-in-production)
- [Pierce PUC Pump Panel Behaviors](#pierce-puc-pump-panel-behaviors)
- [Technical Stack](#technical-stack)
- [Accessibility (WCAG 2.1 Level AA)](#accessibility-wcag-21-level-aa)
- [Performance & Memory Management](#performance--memory-management)
- [Audio System](#audio-system)
- [Keyboard Controls](#keyboard-controls)
- [Instructor Mode](#instructor-mode)

## Deployment

The application is automatically deployed to Cloudflare Pages via GitHub Actions whenever code is pushed to the `main` branch.

### Manual Deployment

To deploy manually:

```bash
npm run build
wrangler pages deploy dist --project-name=pump-panel-sim
```

### Environment Variables

The following secrets must be configured in GitHub repository settings:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Pages access
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:
1. Installs dependencies
2. Runs tests
3. Builds the application
4. Deploys to Cloudflare Pages

### Custom Domain (Optional)

To add a custom domain:

```bash
# Via Cloudflare Dashboard
# Navigate to Pages → pump-panel-sim → Custom domains
```

## CSP, Audio & WebGL in Production

> 💡 **Summary**: This simulator runs under strict Content Security Policy (CSP) and handles browser autoplay restrictions and WebGL context loss gracefully. Phase 1-2 hardening ensures production-ready security and reliability.

This simulator enforces enterprise-grade security and handles browser limitations through comprehensive CSP headers, gesture-gated audio initialization, and WebGL context recovery.

### Content Security Policy (CSP)

The application enforces strict CSP via Cloudflare Pages [`public/_headers`](public/_headers):

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self'; 
  style-src 'self'; 
  img-src 'self' data:; 
  font-src 'self'; 
  connect-src 'self' wss:; 
  worker-src 'self'; 
  media-src 'self' data:; 
  object-src 'none'; 
  base-uri 'self'; 
  frame-ancestors 'none';
```

**Key Points:**
- No `unsafe-eval` or `unsafe-inline` - fully compliant
- Pixi.js v8 default build is CSP-safe (no eval required)
- All scripts loaded from `'self'` origin only
- WebSocket connections allowed for Durable Objects instructor mode

**References:**
- [Cloudflare Pages Headers](https://developers.cloudflare.com/pages/configuration/headers/)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Pixi.js v8 CSP Support](https://github.com/pixijs/pixijs/discussions)

### Audio System (Autoplay Compliance)

The audio system uses Tone.js with gesture-gated initialization to comply with browser autoplay policies:

**Implementation:** [`src/audio/AudioProvider.tsx`](src/audio/AudioProvider.tsx)

- AudioContext creation deferred until first user gesture (click, tap, or keypress)
- Dynamic Tone.js import prevents AudioContext creation at module evaluation
- Single-use event listeners: `pointerdown` and `keydown`
- `Tone.start()` handles AudioContext resume internally

```typescript
// Gesture-gated initialization
useEffect(() => {
  const handler = async () => { await init(); };
  window.addEventListener('pointerdown', handler, { once: true });
  window.addEventListener('keydown', handler, { once: true });
  return () => {
    window.removeEventListener('pointerdown', handler);
    window.removeEventListener('keydown', handler);
  };
}, [init]);
```

**References:**
- [MDN: Autoplay Policy](https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide)
- [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay/)
- [Tone.js Context Management](https://tonejs.github.io/docs/14.7.77/Tone)

### WebGL Context Handling

The application gracefully handles WebGL context loss/restore events:

**Implementation:** [`src/ui/pixi/context.ts`](src/ui/pixi/context.ts)

```typescript
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault(); // Allow restoration
  console.warn('[WebGL] context lost');
});

canvas.addEventListener('webglcontextrestored', () => {
  console.warn('[WebGL] context restored');
  // Auto-recovery: textures reload from cache
});
```

> ⚠️ **Memory Optimization**: Device Pixel Ratio capped at 2x to reduce memory pressure on HiDPI displays.

**Memory Optimization:**
- Device Pixel Ratio capped at 2x to prevent excessive VRAM usage
- Texture cache eviction on visibility change
- Pixi v8 `cacheAsTexture` (not deprecated `cacheAsBitmap`)

**References:**
- [MDN: WebGL Context Loss](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#handle_context_lost_and_context_restored_events)
- [Pixi.js Context Loss Handling](https://pixijs.io/guides/basics/render-loop.html)

## Pierce PUC Pump Panel Behaviors

> 💡 **Summary**: The simulator accurately models Pierce Manufacturing PUC (Pump Operator's Control) pump panel behaviors per the operational manual. Phase 5 implementation includes source-aware gauges, valve interlocks, cavitation detection, and training scenarios.

The simulator accurately models Pierce Manufacturing PUC (Pump Operator's Control) pump panel behaviors per the operational manual.

### Source-Aware Master Intake Gauge

**Implementation:** [`src/sim/gauges.ts`](src/sim/gauges.ts)

- **Hydrant/Tank (Pressurized):** Displays positive PSI, warns if < 20 PSI
- **Draft:** Displays vacuum in inHg (inches of mercury), warns if > 20 inHg
- Automatically switches scale based on `waterSource` state

```typescript
export function computeMasterIntake(state: SimState): number {
  const source = primaryIntake?.source || 'hydrant';
  
  if (source === 'draft') {
    // Draft mode: show vacuum in inHg (negative pressure)
    const vacuum = Math.abs(state.pump.intakePsi) * 2.036;
    return -vacuum; // Negative for vacuum display
  }
  
  // Hydrant/Tank/Relay mode: show positive PSI
  return state.pump.intakePsi;
}
```

### Valve Changeover Sequence

**Implementation:** [`src/sim/interlocks.ts`](src/sim/interlocks.ts)

Enforces proper tank-to-hydrant changeover procedure:
1. Open gated intake valve
2. Wait for pressure stabilization
3. Close tank-to-pump valve
4. Verify intake pressure maintained

**Faults Detected:**
- Both valves open simultaneously
- No water source (all valves closed)
- Pressure drop during changeover

### Cavitation Detection

**Implementation:** [`src/sim/pump-curves.ts`](src/sim/pump-curves.ts)

Cavitation detected when:
- High vacuum on draft (> 20 inHg)
- Inadequate intake pressure (< 10 PSI)
- Unexpected flow drop despite stable throttle

### Overpressure Protection

**Thresholds:**
- **350 PSI:** Warning threshold
- **400 PSI:** Maximum safe operating pressure
- **410 PSI:** Relief valve fully open (pressure clamped)

### Training Scenarios

**Implementation:** [`src/training/definitions.ts`](src/training/definitions.ts)

Four educational scenarios:
- **Cavitation Detection** - Recognize and respond to pump cavitation
- **Tank-to-Hydrant Changeover** - Proper valve sequencing
- **Overpressure Response** - Prevent exceeding 400 PSI
- **Intake Pressure Monitoring** - Maintain adequate intake ≥ 20 PSI

### Hydrant Flow Calculations

**Implementation:** [`src/hydraulics/hydrant-flow.ts`](src/hydraulics/hydrant-flow.ts)

Static vs residual pressure analysis:
- Calculates available flow at 20 PSI residual
- Estimates available flow at 150 PSI and 250 PSI operating pressures
- Provides guidance on supply adequacy based on pressure drop percentage

## Technical Stack

> 💡 **Summary**: Modern React 18 + TypeScript 5 architecture with PixiJS v8 for hardware-accelerated rendering, Tone.js for audio, and WCAG 2.1 Level AA accessibility compliance.

- **React 18** + **TypeScript 5** - Modern type-safe UI framework
- **PixiJS v8** - Hardware-accelerated 2D WebGL rendering (CSP-compliant)
- **Tone.js** - Web Audio synthesis with gesture-gated initialization
- **Vite 5** - Fast build tool with ES2020 target
- **Cloudflare Pages** - Edge deployment with Durable Objects for instructor mode
- **WCAG 2.1 Level AA** - Accessible with 44×44px touch targets, ARIA live regions, keyboard navigation

## Accessibility (WCAG 2.1 Level AA)

> 💡 **Summary**: Full WCAG 2.1 Level AA compliance achieved in Phase 4. All interactive elements meet minimum touch target sizes, screen reader compatibility, keyboard navigation, and responsive design for desktop/tablet/mobile.

### Touch Target Sizes

All interactive elements meet WCAG 2.1 AA minimum size requirements:

**Implementation:** [`src/ui/controls/touchHelpers.ts`](src/ui/controls/touchHelpers.ts)

- Minimum touch target: **44×44 pixels**
- `expandCircularHitArea(44)` for rotary knobs
- `expandHitArea(44)` for levers and buttons
- Pointer events (not mouse events) for cross-platform compatibility

```typescript
export function expandCircularHitArea(
  displayObj: Container,
  minSize: number = 44
): void {
  const bounds = displayObj.getLocalBounds();
  const diameter = Math.max(bounds.width, bounds.height);
  if (diameter < minSize) {
    const radius = minSize / 2;
    displayObj.hitArea = new Circle(0, 0, radius);
  }
}
```

### Screen Reader Support

**Implementation:** [`src/ui/StatusHUD.tsx`](src/ui/StatusHUD.tsx)

- ARIA live regions announce critical warnings (`aria-live="assertive"`)
- Polite announcements for status updates (`aria-live="polite"`)
- `.sr-only` utility class for screen reader-only content

```tsx
<div aria-live="assertive" aria-atomic="true" className="sr-only">
  {warnings.map(w => w.message).join('. ')}
</div>
```

### Keyboard Navigation

**Implementation:** [`src/ui/keyboard/KeyboardManager.ts`](src/ui/keyboard/KeyboardManager.ts)

- **Arrow Up/Down:** Throttle ±5%
- **Space:** Toggle pump engage
- **E:** Toggle engine
- **G:** Toggle governor
- **D:** Toggle DRV
- **P:** Toggle primer

All keyboard actions logged to console for assistive technology integration.

### Responsive Design

Breakpoints ensure usability across devices:
- **Desktop (>1280px):** Full 360px HUD sidebar
- **Tablet Landscape (768-1280px):** Compact 280px HUD
- **Tablet Portrait (<768px):** Stacked layout, HUD below panel
- **Mobile (<640px):** Minimal 35vh HUD, optimized for touch

## Performance & Memory Management

> 💡 **Summary**: Phase 3-6 optimizations include WebGL memory management, mathematical grid layout with zero overlaps, and memory profiling utilities for production monitoring.

### WebGL Optimization

- **Device Pixel Ratio:** Capped at 2x to prevent excessive memory usage on HiDPI displays
- **Texture Caching:** [`src/ui/graphics/TextureCache.ts`](src/ui/graphics/TextureCache.ts) manages texture lifecycle
- **Context Loss Recovery:** Automatic texture reload from cache on `webglcontextrestored`

```typescript
// Cap DPR to reduce memory pressure
const app = new Application({
  resolution: Math.min(window.devicePixelRatio ?? 1, 2),
});
```

### Grid Layout System

**Implementation:** [`src/ui/layout/Grid.ts`](src/ui/layout/Grid.ts)

- **Design Resolution:** 1920×1080 scales to fit any viewport
- **Grid:** 8 columns × 6 rows with 24px gap and margin
- **Zero Overlaps:** Mathematical constraint-driven positioning
- **Overlap Detection:** [`src/ui/debug/OverlapGuard.ts`](src/ui/debug/OverlapGuard.ts) validates layout in development

```typescript
export interface GridConfig {
  cols: 8;
  rows: 6;
  gap: 24;
  margin: 24;
  designWidth: 1920;
  designHeight: 1080;
}
```

### Memory Profiling

**Implementation:** [`src/utils/memoryProfiler.ts`](src/utils/memoryProfiler.ts)

Tracks heap usage and provides cleanup recommendations.

```typescript
export function logMemorySnapshot(): void {
  if ('memory' in performance) {
    const mem = (performance as any).memory;
    console.log(`[Memory] Used: ${(mem.usedJSHeapSize / 1048576).toFixed(1)} MB`);
  }
}
```

## Audio System

The simulator uses Tone.js for audio playback:
- Click sounds for UI interactions
- Valve operation sounds
- Low tank alarms
- Continuous pump ambient sound

> ⚠️ **Important**: Audio must be enabled via user gesture (tap the "Enable Audio" button) due to browser autoplay policies.

### Browser Support
- ✅ Chrome/Edge: Full support (audio + vibration + gamepad haptics)
- ✅ Firefox: Full support (audio + vibration + limited gamepad)
- ⚠️ Safari: Audio only (no vibration API)
- ⚠️ iOS Safari: Audio only (no vibration, no gamepad haptics)

### Haptics
- **Vibration API**: Supported on Android Chrome, some desktop browsers
- **Gamepad Haptics**: Experimental API with limited support
- Both gracefully degrade when not available

## Keyboard Controls

The simulator supports comprehensive keyboard shortcuts for full keyboard-only operation, enabling accessibility and efficient control for power users.

### Quick Start

- Press `?` or `H` to display the interactive keyboard shortcuts help overlay
- Use arrow keys or `W`/`S` to control throttle
- Press `Space` or `P` to engage/disengage the pump
- Press `G` to toggle between RPM and PSI governor modes

### Complete Documentation

See [`KEYBOARD_CONTROLS.md`](./KEYBOARD_CONTROLS.md) for:
- Complete list of all keyboard shortcuts
- Engine, pump, governor, and DRV controls
- UI navigation shortcuts
- Accessibility features and WCAG 2.1 compliance
- Tips for efficient keyboard-only operation
- Troubleshooting guide

### Key Features

- **Full Keyboard Operation**: All simulator functions accessible via keyboard
- **Visual Feedback**: Toast notifications for all keyboard actions
- **Focus Management**: Clear focus indicators and logical tab order
- **Screen Reader Compatible**: Proper ARIA labels and live regions
- **WCAG 2.1 Level AA Compliant**: Meets accessibility standards

## Instructor Mode

The simulator includes an optional instructor mode for classroom scenarios, powered by Cloudflare Durable Objects.

### Worker Deployment

The instructor mode Worker is located in `../do-worker/` and must be deployed separately:

```bash
cd ../do-worker
npm install
npm run deploy
```

### Usage

Enable instructor mode in the simulator by connecting to a room:

```typescript
import { useInstructor } from './net/useInstructor';

const { connected, broadcast } = useInstructor(
  'classroom1',
  'wss://pump-sim-instructor.pdarleyjr.workers.dev',
  true
);
```

Instructors can broadcast control changes, scenario loads, or reset commands that sync across all connected students.

### Features

- **Room-based sessions**: Each classroom gets a separate Durable Object instance
- **Real-time WebSocket**: Instant synchronization across all participants
- **Automatic state management**: Durable Objects handle connection persistence
- **Scalable**: Built on Cloudflare's edge network for global reach

---

For development setup, build instructions, and contribution guidelines, see [`CONTRIBUTING.md`](./CONTRIBUTING.md).
