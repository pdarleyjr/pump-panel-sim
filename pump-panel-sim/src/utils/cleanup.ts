/**
 * Cleanup utility functions for memory management
 * Provides helpers for safe resource disposal across PixiJS and React
 */

import * as PIXI from 'pixi.js';

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