/**
 * Memory profiling utilities for development
 * Tracks resource counts and memory usage to identify leaks
 */

import * as PIXI from 'pixi.js';
import * as Tone from 'tone';

export interface MemoryStats {
  timestamp: number;
  pixi: {
    stageChildren: number;
    textureCacheSize: number;
    rendererType: string;
  };
  tone: {
    contextState: string;
    activeNodes: number;
  };
  browser: {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  };
}

/**
 * Get current memory statistics
 */
export function getMemoryStats(app?: PIXI.Application): MemoryStats {
  const stats: MemoryStats = {
    timestamp: Date.now(),
    pixi: {
      stageChildren: 0,
      textureCacheSize: 0,
      rendererType: 'unknown',
    },
    tone: {
      contextState: 'suspended',
      activeNodes: 0,
    },
    browser: {},
  };

  // PixiJS stats
  if (app) {
    stats.pixi.stageChildren = countDisplayObjects(app.stage);
    stats.pixi.rendererType = app.renderer.type === 1 ? 'WebGL' : 'Canvas';
  }

  // Tone.js stats - only if context exists and is safe to access
  try {
    const context = Tone.getContext();
    if (context && context.state) {
      stats.tone.contextState = context.state;
    }
  } catch (error) {
    // Context may not be initialized yet - safe to ignore
    stats.tone.contextState = 'not-started';
  }

  // Count textures in cache
  try {
    // Note: PixiJS v8 doesn't expose TextureCache directly in the same way
    // We'll need to track this differently in the app
    stats.pixi.textureCacheSize = 0; // Placeholder
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[MemoryProfiler] Could not count textures:', error);
    }
  }

  // Browser memory (Chrome only)
  if ('memory' in performance) {
    const mem = (performance as any).memory;
    stats.browser.jsHeapSizeLimit = mem.jsHeapSizeLimit;
    stats.browser.totalJSHeapSize = mem.totalJSHeapSize;
    stats.browser.usedJSHeapSize = mem.usedJSHeapSize;
  }

  return stats;
}

/**
 * Recursively count all DisplayObjects in a container
 */
function countDisplayObjects(obj: PIXI.Container): number {
  let count = 1; // Count this object
  if (obj.children) {
    obj.children.forEach((child) => {
      if (child instanceof PIXI.Container) {
        count += countDisplayObjects(child);
      } else {
        count += 1;
      }
    });
  }
  return count;
}

/**
 * Log memory statistics to console
 */
export function logMemoryStats(app?: PIXI.Application, label: string = 'Memory Stats'): void {
  const stats = getMemoryStats(app);
  
  console.group(`📊 ${label}`);
  console.log('Timestamp:', new Date(stats.timestamp).toISOString());
  
  console.group('PixiJS');
  console.log('Stage Children:', stats.pixi.stageChildren);
  console.log('Texture Cache Size:', stats.pixi.textureCacheSize);
  console.log('Renderer Type:', stats.pixi.rendererType);
  console.groupEnd();
  
  console.group('Tone.js');
  console.log('Context State:', stats.tone.contextState);
  console.log('Active Nodes:', stats.tone.activeNodes);
  console.groupEnd();
  
  if (stats.browser.usedJSHeapSize) {
    console.group('Browser Memory');
    console.log('Used Heap:', formatBytes(stats.browser.usedJSHeapSize));
    console.log('Total Heap:', formatBytes(stats.browser.totalJSHeapSize));
    console.log('Heap Limit:', formatBytes(stats.browser.jsHeapSizeLimit));
    console.log(
      'Usage:',
      `${((stats.browser.usedJSHeapSize / stats.browser.totalJSHeapSize!) * 100).toFixed(1)}%`
    );
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) return 'N/A';
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Memory leak detector
 * Tracks memory growth over time to identify potential leaks
 */
export class MemoryLeakDetector {
  private samples: MemoryStats[] = [];
  private maxSamples: number;
  private samplingInterval: number;
  private intervalId: number | null = null;
  private app?: PIXI.Application;

  constructor(maxSamples: number = 100, samplingInterval: number = 1000) {
    this.maxSamples = maxSamples;
    this.samplingInterval = samplingInterval;
  }

  /**
   * Start monitoring memory
   */
  start(app?: PIXI.Application): void {
    if (this.intervalId !== null) {
      console.warn('[MemoryLeakDetector] Already monitoring');
      return;
    }

    this.app = app;
    this.samples = [];

    // Take initial sample
    this.takeSample();

    // Start periodic sampling
    this.intervalId = window.setInterval(() => {
      this.takeSample();
    }, this.samplingInterval);

    console.log(
      `[MemoryLeakDetector] Started monitoring (${this.samplingInterval}ms interval, max ${this.maxSamples} samples)`
    );
  }

  /**
   * Stop monitoring memory
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[MemoryLeakDetector] Stopped monitoring');
    }
  }

  /**
   * Take a memory sample
   */
  private takeSample(): void {
    const stats = getMemoryStats(this.app);
    this.samples.push(stats);

    // Keep only the most recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  /**
   * Analyze samples for memory growth
   */
  analyze(): {
    pixiGrowth: number;
    memoryGrowth: number;
    leakDetected: boolean;
  } {
    if (this.samples.length < 2) {
      return {
        pixiGrowth: 0,
        memoryGrowth: 0,
        leakDetected: false,
      };
    }

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];

    // Calculate growth rates
    const pixiGrowth = last.pixi.stageChildren - first.pixi.stageChildren;
    const memoryGrowth = last.browser.usedJSHeapSize && first.browser.usedJSHeapSize
      ? last.browser.usedJSHeapSize - first.browser.usedJSHeapSize
      : 0;

    // Simple leak detection: sustained growth over time
    const leakDetected = pixiGrowth > 50 || memoryGrowth > 10 * 1024 * 1024; // 10MB threshold

    return {
      pixiGrowth,
      memoryGrowth,
      leakDetected,
    };
  }

  /**
   * Generate report
   */
  report(): void {
    const analysis = this.analyze();

    console.group('🔍 Memory Leak Detector Report');
    console.log('Samples Collected:', this.samples.length);
    console.log('Duration:', `${(this.samples.length * this.samplingInterval) / 1000}s`);
    console.log('PixiJS Objects Growth:', analysis.pixiGrowth);
    console.log('Memory Growth:', formatBytes(analysis.memoryGrowth));
    console.log('Leak Detected:', analysis.leakDetected ? '⚠️ YES' : '✅ NO');

    if (analysis.leakDetected) {
      console.warn('Potential memory leak detected!');
      console.log('Consider checking:');
      console.log('- Event listeners not removed');
      console.log('- PixiJS objects not destroyed');
      console.log('- Tone.js nodes not disposed');
      console.log('- Animation frames not cancelled');
    }

    console.groupEnd();
  }

  /**
   * Get all samples
   */
  getSamples(): MemoryStats[] {
    return [...this.samples];
  }

  /**
   * Clear all samples
   */
  clear(): void {
    this.samples = [];
  }
}

/**
 * Mount/unmount stress test
 * Repeatedly mounts and unmounts a component to detect leaks
 */
export async function mountUnmountStressTest(
  mountFn: () => void | Promise<void>,
  unmountFn: () => void | Promise<void>,
  iterations: number = 100,
  delayMs: number = 100
): Promise<void> {
  console.log(`[StressTest] Starting ${iterations} iterations...`);

  const detector = new MemoryLeakDetector(iterations + 10, delayMs);
  detector.start();

  for (let i = 0; i < iterations; i++) {
    await mountFn();
    await new Promise((resolve) => setTimeout(resolve, delayMs / 2));
    await unmountFn();
    await new Promise((resolve) => setTimeout(resolve, delayMs / 2));

    if ((i + 1) % 10 === 0) {
      console.log(`[StressTest] Completed ${i + 1}/${iterations} iterations`);
    }
  }

  // Wait a bit for GC
  await new Promise((resolve) => setTimeout(resolve, 1000));

  detector.stop();
  detector.report();
}

/**
 * Export profiler for debugging in browser console
 */
if (import.meta.env.DEV) {
  (window as any).memoryProfiler = {
    getStats: getMemoryStats,
    logStats: logMemoryStats,
    MemoryLeakDetector,
    mountUnmountStressTest,
  };
}