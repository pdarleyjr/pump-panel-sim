/**
 * Cleanup utility functions for memory management
 * Provides helpers for safe resource disposal across PixiJS, Tone.js, and React
 */

import * as PIXI from 'pixi.js';
import * as Tone from 'tone';

/**
 * Safely dispose of a Tone.js node
 * Handles disconnection and disposal with error catching
 */
export function disposeToneNode(node: Tone.ToneAudioNode | null | undefined): void {
  if (!node) return;
  
  try {
    // Disconnect first to break audio graph
    node.disconnect();
    // Then dispose to free resources
    node.dispose();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Cleanup] Error disposing Tone node:', error);
    }
  }
}

/**
 * Safely stop and dispose of a Tone.js source
 * Works with Oscillator, Noise, Player, etc.
 */
export function stopAndDisposeToneSource(
  source: Tone.Source | null | undefined
): void {
  if (!source) return;
  
  try {
    // Stop if playing
    if (source.state === 'started') {
      source.stop();
    }
    // Disconnect and dispose
    source.disconnect();
    source.dispose();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Cleanup] Error stopping/disposing Tone source:', error);
    }
  }
}

/**
 * Safely dispose of a Tone.js Loop
 */
export function disposeToneLoop(loop: Tone.Loop | null | undefined): void {
  if (!loop) return;
  
  try {
    // Stop the loop
    if (loop.state === 'started') {
      loop.stop();
    }
    // Dispose
    loop.dispose();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Cleanup] Error disposing Tone loop:', error);
    }
  }
}

/**
 * Safely dispose of a Tone.js LFO (Low Frequency Oscillator)
 */
export function disposeToneLFO(lfo: Tone.LFO | null | undefined): void {
  if (!lfo) return;
  
  try {
    // Stop the LFO
    if (lfo.state === 'started') {
      lfo.stop();
    }
    // Disconnect and dispose
    lfo.disconnect();
    lfo.dispose();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Cleanup] Error disposing Tone LFO:', error);
    }
  }
}

/**
 * Safely dispose of a Tone.js effect (Tremolo, etc.)
 */
export function disposeToneEffect(effect: Tone.Effect | null | undefined): void {
  if (!effect) return;
  
  try {
    effect.disconnect();
    effect.dispose();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Cleanup] Error disposing Tone effect:', error);
    }
  }
}

/**
 * Remove ticker callback from PixiJS application
 */
export function removeTickerCallback(
  app: PIXI.Application | null | undefined,
  callback: ((ticker: PIXI.Ticker) => void) | null | undefined
): void {
  if (!app || !callback) return;
  
  try {
    app.ticker.remove(callback);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Cleanup] Error removing ticker callback:', error);
    }
  }
}

/**
 * Safely destroy a PixiJS DisplayObject with all options
 */
export function destroyDisplayObject(
  obj: PIXI.Container | null | undefined,
  options?: {
    children?: boolean;
    texture?: boolean;
    textureSource?: boolean;
    context?: boolean;
  }
): void {
  if (!obj) return;
  
  try {
    // Remove all event listeners first
    obj.removeAllListeners?.();
    
    // Destroy with options
    obj.destroy({
      children: options?.children ?? true,
      texture: options?.texture ?? true,
      textureSource: options?.textureSource ?? true,
      ...(options?.context !== undefined && { context: options.context }),
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Cleanup] Error destroying display object:', error);
    }
  }
}

/**
 * Cancel an animation frame request safely
 */
export function cancelFrame(frameId: number | undefined): void {
  if (frameId !== undefined) {
    try {
      cancelAnimationFrame(frameId);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Cleanup] Error canceling animation frame:', error);
      }
    }
  }
}

/**
 * Clear an interval safely
 */
export function clearIntervalSafe(intervalId: number | NodeJS.Timeout | undefined): void {
  if (intervalId !== undefined) {
    try {
      clearInterval(intervalId as number);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Cleanup] Error clearing interval:', error);
      }
    }
  }
}

/**
 * Clear a timeout safely
 */
export function clearTimeoutSafe(timeoutId: number | NodeJS.Timeout | undefined): void {
  if (timeoutId !== undefined) {
    try {
      clearTimeout(timeoutId as number);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Cleanup] Error clearing timeout:', error);
      }
    }
  }
}

/**
 * Dispose of multiple Tone.js nodes at once
 */
export function disposeToneNodes(nodes: (Tone.ToneAudioNode | null | undefined)[]): void {
  nodes.forEach(node => disposeToneNode(node));
}

/**
 * Stop and dispose of multiple Tone.js sources at once
 */
export function stopAndDisposeToneSources(sources: (Tone.Source | null | undefined)[]): void {
  sources.forEach(source => stopAndDisposeToneSource(source));
}

/**
 * Helper to track and clean up Tone.js resources
 */
export class ToneResourceTracker {
  private nodes: Set<Tone.ToneAudioNode> = new Set();
  private sources: Set<Tone.Source> = new Set();
  private loops: Set<Tone.Loop> = new Set();
  private lfos: Set<Tone.LFO> = new Set();
  private effects: Set<Tone.Effect> = new Set();

  track<T extends Tone.ToneAudioNode>(node: T): T {
    this.nodes.add(node);
    return node;
  }

  trackSource<T extends Tone.Source>(source: T): T {
    this.sources.add(source);
    return source;
  }

  trackLoop(loop: Tone.Loop): Tone.Loop {
    this.loops.add(loop);
    return loop;
  }

  trackLFO(lfo: Tone.LFO): Tone.LFO {
    this.lfos.add(lfo);
    return lfo;
  }

  trackEffect<T extends Tone.Effect>(effect: T): T {
    this.effects.add(effect);
    return effect;
  }

  cleanup(): void {
    // Dispose in reverse order of dependency
    this.loops.forEach(loop => disposeToneLoop(loop));
    this.loops.clear();

    this.lfos.forEach(lfo => disposeToneLFO(lfo));
    this.lfos.clear();

    this.effects.forEach(effect => disposeToneEffect(effect));
    this.effects.clear();

    this.sources.forEach(source => stopAndDisposeToneSource(source));
    this.sources.clear();

    this.nodes.forEach(node => disposeToneNode(node));
    this.nodes.clear();
  }
}