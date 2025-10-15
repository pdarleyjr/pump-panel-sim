/**
 * Main Panel React component for PixiJS application
 */

import { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { PanelManager } from './PanelManager';
import { attachWebGLGuards, exposeDebugLoseContext } from './pixi/context';
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

    // Initialize PIXI Application with metallic aluminum background
    const app = new PIXI.Application();
    
    (async () => {
      await app.init({
        width: 900,
        height: 600,
        backgroundColor: 0xB8B8B8, // Metallic aluminum base color
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      // Append canvas to container
      const canvas = app.canvas;
      containerRef.current.appendChild(canvas);
      
      // Store app reference
      appRef.current = app;

      // Add metallic panel background
      try {
        const backgroundTexture = await PIXI.Assets.load('/panel-background.png');
        const background = new PIXI.Sprite(backgroundTexture);
        
        // Scale to cover screen while maintaining aspect ratio
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
          children: true,
          texture: true,
          textureSource: true,
          context: true,
        }, true);
        appRef.current = null;
      }
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