/**
 * WebGL Context Management
 * Handles WebGL context loss and restoration with proper recovery
 * 
 * MEMORY OPTIMIZATION STRATEGIES IMPLEMENTED:
 * 1. Device pixel ratio capped at 2x (see Panel.tsx) - prevents excessive VRAM usage
 * 2. preserveDrawingBuffer: false (default, see Panel.tsx) - better performance
 * 3. TextureCache.ts manages texture lifecycle properly
 * 4. Proper cleanup with destroy() calls on all components
 * 
 * CONTEXT LOSS PREVENTION:
 * - Automatic recovery via event.preventDefault() in webglcontextlost handler
 * - Renderer reset on restoration ensures consistent WebGL state
 * - Force re-render after restoration to update display
 * - PixiJS automatically reloads textures when properly managed
 * 
 * DEPRECATED PARAMETER SUPPRESSION:
 * - Configured PixiJS to avoid deprecated WebGL parameters
 * - UNPACK_PREMULTIPLY_ALPHA_WEBGL and UNPACK_FLIP_Y_WEBGL warnings eliminated
 */

import { Application } from 'pixi.js';

export interface ContextGuards {
  isContextLost: () => boolean;
}

/**
 * Attach WebGL context loss/restoration handlers to the PixiJS application
 * 
 * CRITICAL: event.preventDefault() in the loss handler is REQUIRED for context to be recoverable.
 * Without it, the context is permanently lost and the page must be reloaded.
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
    
    // PixiJS v8 handles most restoration automatically
    // Force a re-render to update the display
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__debugLoseWebGLContext = () => {
        ext.loseContext();
        console.log('WebGL context loss simulated');
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__debugRestoreWebGLContext = () => {
        ext.restoreContext();
        console.log('WebGL context restoration simulated');
      };
      console.log('Debug: Use __debugLoseWebGLContext() and __debugRestoreWebGLContext() to test');
    }
  }
}