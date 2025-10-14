/**
 * Performance monitoring utilities for FPS tracking and profiling
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  avgFrameTime: number;
  minFPS: number;
  maxFPS: number;
  renderCalls: number;
}

/**
 * Performance Monitor for tracking FPS and frame times
 */
export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private fpsHistory: number[] = [];
  private readonly maxHistorySize = 60; // Keep last 60 frames
  private renderCallCount: number = 0;
  private enabled: boolean = false;

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
  }

  /**
   * Call this at the start of each frame
   */
  startFrame(): void {
    if (!this.enabled) return;
    
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // Track frame times
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxHistorySize) {
      this.frameTimes.shift();
    }
    
    // Calculate FPS
    const fps = 1000 / frameTime;
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift();
    }
    
    this.frameCount++;
  }

  /**
   * Increment render call counter
   */
  incrementRenderCalls(): void {
    if (!this.enabled) return;
    this.renderCallCount++;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    if (!this.enabled || this.frameTimes.length === 0) {
      return {
        fps: 0,
        frameTime: 0,
        avgFrameTime: 0,
        minFPS: 0,
        maxFPS: 0,
        renderCalls: 0,
      };
    }

    const currentFrameTime = this.frameTimes[this.frameTimes.length - 1];
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const currentFPS = 1000 / currentFrameTime;
    const minFPS = Math.min(...this.fpsHistory);
    const maxFPS = Math.max(...this.fpsHistory);

    return {
      fps: Math.round(currentFPS),
      frameTime: Math.round(currentFrameTime * 100) / 100,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      minFPS: Math.round(minFPS),
      maxFPS: Math.round(maxFPS),
      renderCalls: this.renderCallCount,
    };
  }

  /**
   * Reset counters
   */
  reset(): void {
    this.frameTimes = [];
    this.fpsHistory = [];
    this.frameCount = 0;
    this.renderCallCount = 0;
    this.lastFrameTime = performance.now();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.reset();
    }
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Performance marks for measuring specific operations
 */
export class PerformanceMarker {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();

  /**
   * Mark the start of an operation
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure time since mark
   */
  measure(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    
    // Store measurement
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);
    
    // Keep only last 100 measurements
    const measurements = this.measures.get(name)!;
    if (measurements.length > 100) {
      measurements.shift();
    }

    return duration;
  }

  /**
   * Get average measurement time
   */
  getAverage(name: string): number {
    const measurements = this.measures.get(name);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  /**
   * Get all averages
   */
  getAllAverages(): Record<string, number> {
    const averages: Record<string, number> = {};
    for (const [name] of this.measures) {
      averages[name] = this.getAverage(name);
    }
    return averages;
  }

  /**
   * Clear all marks and measurements
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

// Export singleton instances
export const perfMonitor = new PerformanceMonitor(
  // Enable in development mode
  import.meta.env.DEV
);

export const perfMarker = new PerformanceMarker();