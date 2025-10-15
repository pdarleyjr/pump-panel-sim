/**
 * Main Panel React component for PixiJS application
 */

import { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { PanelManager } from './PanelManager';
import { attachWebGLGuards, exposeDebugLoseContext } from './pixi/context';
import { TextureCache } from './graphics/TextureCache';
import type { PumpState } from '../sim/model';
import type { SimulationDiagnostics } from '../sim/engine';
import type { ControlEvent } from './controls/types';

interface PanelProps {
  /** Current pump state from simulation */
  pumpState: PumpState;
  
  /** Simulation diagnostics (optional) */
  diagnostics?: SimulationDiagnostics;
  
  /** Callback when a control changes */
  onChange: (event: ControlEvent) => void;
}

/**
 * Main panel component that contains the PixiJS application
 */
export function Panel({ pumpState, diagnostics, onChange }: PanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const managerRef = useRef<PanelManager | null>(null);

  // Initialize PixiJS application
  useEffect(() => {
    if (!containerRef.current) return;

    // Configure PixiJS settings to suppress deprecated WebGL parameter warnings
    // These settings prevent the use of deprecated UNPACK_PREMULTIPLY_ALPHA_WEBGL and UNPACK_FLIP_Y_WEBGL
    PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2; // Prefer WebGL2 which doesn't have these deprecated parameters
    PIXI.settings.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = false; // Allow software rendering if needed

    // Initialize PIXI Application with metallic aluminum background
    const app = new PIXI.Application();
    
    (async () => {
      await app.init({
        width: 900,
        height: 600,
        backgroundColor: 0xB8B8B8, // Metallic aluminum base color
        resolution: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2 to prevent excessive memory usage
        autoDensity: true,
        antialias: true,
        preserveDrawingBuffer: false, // Better performance, helps prevent context loss
        preferWebGLVersion: 2, // Prefer WebGL2 to avoid deprecated parameters
      });

      // Initialize texture cache with preloading
      await TextureCache.initialize(app.renderer);

      // Append canvas to container
      const canvas = app.canvas;
      if (!containerRef.current) return;
      containerRef.current.appendChild(canvas);
      
      // Store app reference
      appRef.current = app;

      // Add metallic panel background using preloaded texture
      const backgroundTexture = TextureCache.getImageTexture('/panel-background.png');
      if (backgroundTexture) {
        const background = new PIXI.Sprite(backgroundTexture);
        
        // Scale to cover screen while maintaining aspect ratio
        const scaleX = app.screen.width / background.width;
        const scaleY = app.screen.height / background.height;
        const scale = Math.max(scaleX, scaleY);
        
        background.scale.set(scale);
        background.anchor.set(0.5);
        background.position.set(app.screen.width / 2, app.screen.height / 2);
        
        app.stage.addChild(background);
      } else {
        console.warn('Panel background texture not preloaded, falling back to dynamic loading');
        // Fallback to dynamic loading if preloading failed
        try {
          const fallbackTexture = await PIXI.Assets.load('/panel-background.png');
          const background = new PIXI.Sprite(fallbackTexture);
          
          const scaleX = app.screen.width / background.width;
          const scaleY = app.screen.height / background.height;
          const scale = Math.max(scaleX, scaleY);
          
          background.scale.set(scale);
          background.anchor.set(0.5);
          background.position.set(app.screen.width / 2, app.screen.height / 2);
          
          app.stage.addChild(background);
        } catch (error) {
          console.warn('Failed to load panel background:', error);
        }
      }

      // Attach WebGL context guards for loss/restoration handling
      attachWebGLGuards(app);
      
      // Expose debug helpers in development
      exposeDebugLoseContext(canvas);

      // Create and initialize panel manager
      const manager = new PanelManager(app, onChange);
      manager.initialize();
      managerRef.current = manager;

      // Handle window resize
      const handleResize = () => {
        if (managerRef.current) {
          managerRef.current.resize(window.innerWidth, window.innerHeight);
        }
      };
      window.addEventListener('resize', handleResize);
    })();

    // Cleanup function with comprehensive resource disposal
    return () => {
      window.removeEventListener('resize', () => {});
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy({
          removeView: true,
        });
        appRef.current = null;
      }
      // Clear texture cache
      TextureCache.clear();
    };
  }, []); // Empty dependency array - only run once on mount

  // Update gauges when pump state changes
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateGauges(pumpState, diagnostics);
    }
  }, [pumpState, diagnostics]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    />
  );
}