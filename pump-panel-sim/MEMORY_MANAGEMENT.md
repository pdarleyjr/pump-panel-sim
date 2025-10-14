# Memory Management Guide

## Overview

This document describes the memory management strategies implemented in the Fire Pump Panel Simulator to prevent memory leaks during extended training sessions. All resource cleanup patterns follow React and JavaScript best practices for lifecycle management.

## Quick Reference

### Memory Leak Checklist
- ✅ PixiJS DisplayObjects destroyed with `destroy({ children: true })`
- ✅ PixiJS Ticker callbacks removed with `app.ticker.remove(callback)`
- ✅ Tone.js sources stopped and disposed (Oscillator, Noise, Player)
- ✅ Tone.js effects disconnected and disposed (Filter, LFO, Tremolo, Loop)
- ✅ Event listeners removed (DOM, PixiJS, custom)
- ✅ Animation frames cancelled with `cancelAnimationFrame()`
- ✅ Intervals and timeouts cleared
- ✅ React useEffect cleanup functions implemented

## Architecture

### Cleanup Utilities

[`src/utils/cleanup.ts`](src/utils/cleanup.ts:1) - Provides safe disposal functions:
- `disposeToneNode()` - Disconnect and dispose Tone.js audio nodes
- `stopAndDisposeToneSource()` - Stop and dispose audio sources
- `disposeToneLFO()` - Stop and dispose Low Frequency Oscillators
- `disposeToneLoop()` - Stop and dispose Tone.js Loops
- `removeTickerCallback()` - Remove PixiJS ticker callbacks
- `destroyDisplayObject()` - Safe PixiJS object destruction
- `ToneResourceTracker` - Automatic resource tracking and cleanup

### Memory Profiling

[`src/utils/memoryProfiler.ts`](src/utils/memoryProfiler.ts:1) - Development tools:
- `getMemoryStats()` - Snapshot of current memory usage
- `logMemoryStats()` - Console logging with formatting
- `MemoryLeakDetector` - Automated leak detection
- `mountUnmountStressTest()` - Component stress testing

## Cleanup Patterns

### 1. PixiJS Resources

#### DisplayObject Lifecycle

```typescript
// ❌ BAD - Memory leak
class BadComponent {
  private container: PIXI.Container;
  
  destroy() {
    // Missing cleanup - container stays in memory
  }
}

// ✅ GOOD - Proper cleanup
class GoodComponent {
  private container: PIXI.Container;
  
  destroy() {
    // Remove event listeners first
    this.container.removeAllListeners();
    
    // Destroy with all options
    this.container.destroy({
      children: true,
      texture: true,
      textureSource: true,
    });
  }
}
```

#### Ticker Callbacks

```typescript
// ❌ BAD - Ticker callback not removed
class BadGauge {
  create(app: PIXI.Application) {
    app.ticker.add(() => {
      // Animation code
    });
  }
}

// ✅ GOOD - Callback tracked and removed
class GoodGauge {
  private tickerCallback: ((ticker: PIXI.Ticker) => void) | null = null;
  
  create(app: PIXI.Application) {
    this.tickerCallback = (ticker) => {
      // Animation code
    };
    app.ticker.add(this.tickerCallback);
  }
  
  destroy(app?: PIXI.Application) {
    if (app && this.tickerCallback) {
      app.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
    this.container.destroy({ children: true });
  }
}
```

**Example:** [`PressureGauge.ts:374-391`](src/ui/gauges/PressureGauge.ts:374)

### 2. Tone.js Audio

#### Source Management

```typescript
// ❌ BAD - Sources not stopped or disposed
let osc: Tone.Oscillator | null = null;

function startSound() {
  osc = new Tone.Oscillator(440).toDestination();
  osc.start();
}

function stopSound() {
  osc = null; // Leak! Still playing and holding memory
}

// ✅ GOOD - Proper disposal
let osc: Tone.Oscillator | null = null;

function startSound() {
  osc = new Tone.Oscillator(440).toDestination();
  osc.start();
}

function stopSound() {
  if (osc) {
    osc.stop();
    osc.dispose();
    osc = null;
  }
}
```

#### LFO and Effects Cleanup

```typescript
// ❌ BAD - LFO not tracked or disposed
function createModulation() {
  const lfo = new Tone.LFO(2, 100, 200);
  lfo.connect(filter.frequency);
  lfo.start();
  // Leak! LFO never stopped or disposed
}

// ✅ GOOD - LFO tracked and cleaned up
let lfo: Tone.LFO | null = null;

function createModulation() {
  lfo = new Tone.LFO(2, 100, 200);
  lfo.connect(filter.frequency);
  lfo.start();
}

function cleanup() {
  if (lfo) {
    lfo.stop();
    lfo.disconnect();
    lfo.dispose();
    lfo = null;
  }
}
```

**Examples:**
- [`alarms.ts:69-119`](src/audio/alarms.ts:69) - Cavitation sound with LFO
- [`controls.ts:211-303`](src/audio/controls.ts:211) - Primer with LFO and Loop
- [`ambient.ts:19-111`](src/audio/ambient.ts:19) - Water flow with LFO

#### Synth in Loop Pattern

```typescript
// ❌ BAD - Synth not tracked separately from Loop
let loop: Tone.Loop | null = null;

function startAlarm() {
  const synth = new Tone.Synth().toDestination();
  loop = new Tone.Loop((time) => {
    synth.triggerAttackRelease('G5', '0.15', time);
  }, 0.5);
  loop.start();
  // Leak! Synth never disposed
}

// ✅ GOOD - Track both Loop and Synth
let loop: Tone.Loop | null = null;
let synth: Tone.Synth | null = null;

function startAlarm() {
  synth = new Tone.Synth().toDestination();
  loop = new Tone.Loop((time) => {
    synth?.triggerAttackRelease('G5', '0.15', time);
  }, 0.5);
  loop.start();
}

function stopAlarm() {
  if (loop) {
    loop.stop();
    loop.dispose();
    loop = null;
  }
  if (synth) {
    synth.dispose();
    synth = null;
  }
}
```

**Example:** [`alarms.ts:19-78`](src/audio/alarms.ts:19) - Overpressure alarm

### 3. React Components

#### useEffect Cleanup

```typescript
// ❌ BAD - No cleanup
useEffect(() => {
  const handleResize = () => { /* ... */ };
  window.addEventListener('resize', handleResize);
  
  const interval = setInterval(() => { /* ... */ }, 1000);
  // Leaks! Listeners and intervals never cleaned up
}, []);

// ✅ GOOD - Comprehensive cleanup
useEffect(() => {
  const handleResize = () => { /* ... */ };
  window.addEventListener('resize', handleResize);
  
  const interval = setInterval(() => { /* ... */ }, 1000);
  
  // Cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    clearInterval(interval);
  };
}, []);
```

**Example:** [`Panel.tsx:70-95`](src/ui/Panel.tsx:70)

#### Animation Frames

```typescript
// ❌ BAD - RAF not cancelled
useEffect(() => {
  const animate = () => {
    // Animation code
    requestAnimationFrame(animate);
  };
  animate();
  // Leak! Animation continues after unmount
}, []);

// ✅ GOOD - RAF tracked and cancelled
useEffect(() => {
  let rafId: number | undefined;
  
  const animate = () => {
    // Animation code
    rafId = requestAnimationFrame(animate);
  };
  
  rafId = requestAnimationFrame(animate);
  
  return () => {
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
    }
  };
}, []);
```

**Example:** [`SimulatorUI.tsx:79-110`](src/ui/SimulatorUI.tsx:79)

### 4. Event Listeners

#### Modern Approach with AbortController

```typescript
// ✅ BEST - AbortController pattern
useEffect(() => {
  const controller = new AbortController();
  
  window.addEventListener('click', handler, {
    signal: controller.signal
  });
  
  return () => controller.abort();
}, []);
```

#### Traditional Approach

```typescript
// ✅ GOOD - Manual cleanup
useEffect(() => {
  const handleClick = () => { /* ... */ };
  window.addEventListener('click', handleClick);
  
  return () => {
    window.removeEventListener('click', handleClick);
  };
}, []);
```

## Common Pitfalls

### 1. Closure Over Disposed Resources

```typescript
// ❌ BAD - Callback references disposed object
class BadComponent {
  private container: PIXI.Container;
  
  setup(app: PIXI.Application) {
    app.ticker.add(() => {
      this.container.x += 1; // May access disposed container!
    });
  }
}

// ✅ GOOD - Check for null
class GoodComponent {
  private container: PIXI.Container | null;
  
  setup(app: PIXI.Application) {
    this.callback = () => {
      if (this.container) {
        this.container.x += 1;
      }
    };
    app.ticker.add(this.callback);
  }
}
```

### 2. Async Operations After Unmount

```typescript
// ❌ BAD - setState after unmount
useEffect(() => {
  fetchData().then(data => {
    setState(data); // Component may be unmounted!
  });
}, []);

// ✅ GOOD - Check mounted status
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(data => {
    if (isMounted) {
      setState(data);
    }
  });
  
  return () => {
    isMounted = false;
  };
}, []);
```

### 3. Multiple References to Same Resource

```typescript
// ❌ BAD - Disposing through wrong reference
let filter1: Tone.Filter = new Tone.Filter();
let filter2 = filter1;

filter1.dispose();
filter2.dispose(); // Error! Already disposed
```

## Testing

### Manual Testing with DevTools

1. **Chrome DevTools Memory Profiler:**
   ```bash
   # Open simulator
   # Press F12 → Memory tab
   # Take heap snapshot
   # Interact with simulator (mount/unmount components)
   # Take another snapshot
   # Compare snapshots for growth
   ```

2. **Performance Monitor:**
   ```bash
   # Press Ctrl+Shift+P
   # Type "Show Performance Monitor"
   # Watch JS Heap Size during usage
   ```

### Automated Leak Detection

```typescript
import { MemoryLeakDetector } from './utils/memoryProfiler';

// In browser console or test
const detector = new MemoryLeakDetector();
detector.start(app); // Pass PixiJS app if available

// Use simulator for a while...

detector.stop();
detector.report(); // Shows growth analysis
```

### Stress Testing

```typescript
import { mountUnmountStressTest } from './utils/memoryProfiler';

// Test component lifecycle
await mountUnmountStressTest(
  () => mountComponent(),
  () => unmountComponent(),
  100, // iterations
  100  // delay ms
);
```

### Browser Console Access

In development mode, memory profiler is available globally:

```javascript
// Get current stats
window.memoryProfiler.getStats();

// Log formatted stats
window.memoryProfiler.logStats();

// Start leak detector
const detector = new window.memoryProfiler.MemoryLeakDetector();
detector.start();
```

## Monitoring in Production

### Key Metrics

1. **PixiJS Object Count** - Should remain stable
2. **Tone.js Context State** - Should be 'running' when audio enabled
3. **JS Heap Size** - Should not grow continuously
4. **Active Event Listeners** - Track with `getEventListeners()` in DevTools

### Warning Signs

- Memory growth over 10MB during normal use
- PixiJS stage children count growing continuously
- Audio context never suspending
- Animation frames accumulating

## Best Practices

### 1. Defensive Cleanup

Always check for null before cleanup:

```typescript
destroy() {
  this.callback && app.ticker.remove(this.callback);
  this.node?.dispose();
  this.container?.destroy({ children: true });
}
```

### 2. Cleanup Order

Dispose resources in reverse dependency order:

```typescript
cleanup() {
  // 1. Stop loops and animations
  this.loop?.stop();
  
  // 2. Stop LFOs and effects
  this.lfo?.stop();
  this.effect?.disconnect();
  
  // 3. Stop and dispose sources
  this.source?.stop();
  
  // 4. Dispose all
  this.loop?.dispose();
  this.lfo?.dispose();
  this.effect?.dispose();
  this.source?.dispose();
}
```

### 3. Use Resource Trackers

```typescript
import { ToneResourceTracker } from './utils/cleanup';

class AudioSystem {
  private tracker = new ToneResourceTracker();
  
  createSound() {
    const osc = this.tracker.trackSource(new Tone.Oscillator());
    const filter = this.tracker.track(new Tone.Filter());
    const lfo = this.tracker.trackLFO(new Tone.LFO());
    // ...
  }
  
  cleanup() {
    this.tracker.cleanup(); // Disposes everything
  }
}
```

### 4. Document Lifecycle

Add comments explaining cleanup strategy:

```typescript
/**
 * Cleanup strategy:
 * 1. Stop ticker callback (prevents further updates)
 * 2. Remove event listeners
 * 3. Destroy graphics (frees GPU memory)
 * 4. Clear references (allows GC)
 */
destroy(app?: PIXI.Application) {
  // Implementation...
}
```

## Modified Files

### Core Utilities
- [`src/utils/cleanup.ts`](src/utils/cleanup.ts:1) - Cleanup helper functions
- [`src/utils/memoryProfiler.ts`](src/utils/memoryProfiler.ts:1) - Memory profiling tools

### PixiJS Components
- [`src/ui/Panel.tsx`](src/ui/Panel.tsx:1) - Fixed duplicate cleanup
- [`src/ui/controls/Lever.ts`](src/ui/controls/Lever.ts:1) - Added missing properties, enhanced cleanup
- [`src/ui/controls/RotaryKnob.ts`](src/ui/controls/RotaryKnob.ts:1) - Added missing properties, enhanced cleanup
- [`src/ui/gauges/PressureGauge.ts`](src/ui/gauges/PressureGauge.ts:1) - Added ticker callback tracking

### Audio System
- [`src/audio/alarms.ts`](src/audio/alarms.ts:1) - Fixed LFO and synth disposal
- [`src/audio/controls.ts`](src/audio/controls.ts:1) - Fixed LFO disposal in primer
- [`src/audio/ambient.ts`](src/audio/ambient.ts:1) - Fixed LFO disposal in water flow and foam

## Results

### Memory Leak Fixes

1. **PixiJS Ticker Callbacks** - All indicator and gauge animations now properly remove ticker callbacks
2. **Tone.js LFOs** - 6 LFO instances now properly stopped and disposed
3. **Tone.js Loops** - 3 loop instances now properly tracked and cleaned up
4. **Tone.js Effects** - Tremolo effect now properly disposed
5. **Missing Properties** - Focus indicators and feedback graphics now properly initialized
6. **Duplicate Cleanup** - Removed duplicate cleanup code in Panel.tsx

### Expected Behavior

- **Memory Stable:** JS heap should remain stable during extended use
- **PixiJS Objects:** Stage children count should not grow continuously
- **Audio Resources:** All Tone.js nodes disposed when sounds stop
- **No Warnings:** No console errors about disposed objects

## Maintenance

### Adding New Components

When adding new PixiJS or Tone.js components:

1. Use cleanup utilities from [`cleanup.ts`](src/utils/cleanup.ts:1)
2. Test with `MemoryLeakDetector`
3. Document cleanup strategy
4. Add to stress test suite

### Code Review Checklist

- [ ] All PixiJS DisplayObjects have destroy() called
- [ ] All Ticker callbacks tracked and removed
- [ ] All Tone.js sources stopped and disposed
- [ ] All Tone.js effects disconnected and disposed
- [ ] All LFOs stopped, disconnected, and disposed
- [ ] All event listeners removed
- [ ] All animation frames cancelled
- [ ] All intervals and timeouts cleared
- [ ] useEffect returns cleanup function
- [ ] Async operations check mounted status

## Additional Resources

- [PixiJS Destroy Options](https://pixijs.download/release/docs/scene.Container.html#destroy)
- [Tone.js Dispose](https://tonejs.github.io/docs/latest/classes/Tone.html#dispose)
- [React useEffect Cleanup](https://react.dev/reference/react/useEffect#cleaning-up)
- [Chrome DevTools Memory Profiler](https://developer.chrome.com/docs/devtools/memory-problems/)

---

**Last Updated:** 2025-01-14  
**Memory Management Implementation:** Phase 5.2 Complete