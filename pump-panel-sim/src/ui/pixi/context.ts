/**
 * WebGL Context Management
 * Handles WebGL context loss and restoration with proper recovery
 */

import { Application } from 'pixi.js';

export interface ContextGuards {
  isContextLost: () => boolean;
}

/**
 * Attach WebGL context loss/restoration handlers to the PixiJS application
 * 
 * Note: Firefox may emit deprecation warnings about alpha-premult and y-flip.
 * These are upstream WebGL implementation details and are safe to ignore.
 * See: https://github.com/pixijs/pixijs/issues/9428
 * 
 * @param app - The PixiJS Application instance
 * @returns Object with context status methods
 */
export function attachWebGLGuards(app: Application): ContextGuards {
  const canvas = app.canvas as HTMLCanvasElement;
  let contextLost = false;

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); // CRITICAL: enables restoration
    contextLost = true;
    
    if (import.meta.env.DEV) {
      console.warn('WebGL context lost - awaiting restoration');
    }
    
    // Optional: show user-facing toast/indicator
  }, false);

  canvas.addEventListener('webglcontextrestored', () => {
    if (import.meta.env.DEV) {
      console.log('WebGL context restored - rebuilding renderer');
    }
    
    contextLost = false;
    app.renderer.reset();
    app.stage.updateTransform();
    
    // Force re-render
    app.render();
  }, false);

  return {
    isContextLost: () => contextLost,
  };
}

/**
 * Debug helper for testing context loss in development
 * Exposes global functions to manually trigger context loss/restoration
 * 
 * Usage in browser console:
 * - __debugLoseWebGLContext() to simulate context loss
 * - __debugRestoreWebGLContext() to simulate restoration
 * 
 * @param canvas - The canvas element to attach debug helpers to
 */
export function exposeDebugLoseContext(canvas: HTMLCanvasElement): void {
  if (import.meta.env.DEV) {
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_lose_context');
    
    if (ext) {
      (window as any).__debugLoseWebGLContext = () => {
        ext.loseContext();
        console.log('WebGL context loss simulated');
      };
      (window as any).__debugRestoreWebGLContext = () => {
        ext.restoreContext();
        console.log('WebGL context restoration simulated');
      };
      console.log('Debug: Use __debugLoseWebGLContext() and __debugRestoreWebGLContext() to test');
    }
  }
}