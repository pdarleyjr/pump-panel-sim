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
// Create PIXI application with optimized settings
const app = new PIXI.Application();

app.init({
  resizeTo: window,
  background: '#0b0e17',
  antialias: true,
  resolution: Math.min(window.devicePixelRatio ?? 1, 2), // Cap at 2x for performance
  preference: 'webgl2',
  autoDensity: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false, // Better performance
  clearBeforeRender: true,
}).then(() => {
    }).then(() => {
      if (!containerRef.current) return;
      
      // Append canvas to container
      const canvas = app.canvas;
      containerRef.current.appendChild(canvas);
      
      // Store app reference
      appRef.current = app;

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

      // Cleanup function with comprehensive resource disposal
      return () => {
        window.removeEventListener('resize', handleResize);
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
    });
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