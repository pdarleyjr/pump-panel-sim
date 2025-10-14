/**
 * Touch Debug Overlay Component
 * Visual debugging tool for multi-touch testing on tablets
 * 
 * Features:
 * - Display touch points with unique IDs
 * - Show touch coordinates and event types
 * - Track pressure/force when available
 * - FPS counter during touch interactions
 * - Real-time event log
 */

import { useEffect, useRef, useState } from 'react';
import './TouchDebugOverlay.css';

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  force: number;
  type: 'start' | 'move' | 'end' | 'cancel';
  target: string;
  timestamp: number;
}

interface TouchEvent {
  id: number;
  type: string;
  touches: number;
  target: string;
  timestamp: number;
}

interface TouchDebugOverlayProps {
  enabled: boolean;
}

export function TouchDebugOverlay({ enabled }: TouchDebugOverlayProps) {
  const [touchPoints, setTouchPoints] = useState<Map<number, TouchPoint>>(new Map());
  const [events, setEvents] = useState<TouchEvent[]>([]);
  const [fps, setFps] = useState(60);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number>();

  // Track FPS during touch interactions
  useEffect(() => {
    if (!enabled) return;

    const updateFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      const avgDelta = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const currentFps = Math.round(1000 / avgDelta);
      setFps(currentFps);

      animationFrameRef.current = requestAnimationFrame(updateFPS);
    };

    animationFrameRef.current = requestAnimationFrame(updateFPS);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled]);

  // Touch event handlers
  useEffect(() => {
    if (!enabled) {
      setTouchPoints(new Map());
      setEvents([]);
      return;
    }

    const getTargetInfo = (element: EventTarget | null): string => {
      if (!element || !(element instanceof Element)) return 'unknown';
      return element.tagName + (element.id ? `#${element.id}` : '') + 
             (element.className ? `.${element.className.split(' ').join('.')}` : '');
    };

    const addEvent = (type: string, touches: number, target: string) => {
      setEvents(prev => {
        const newEvent: TouchEvent = {
          id: Date.now(),
          type,
          touches,
          target,
          timestamp: Date.now(),
        };
        return [newEvent, ...prev].slice(0, 10); // Keep last 10 events
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = getTargetInfo(e.target);
      addEvent('touchstart', e.touches.length, target);

      setTouchPoints(prev => {
        const newPoints = new Map(prev);
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          newPoints.set(touch.identifier, {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            force: touch.force || 0,
            type: 'start',
            target,
            timestamp: Date.now(),
          });
        }
        return newPoints;
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = getTargetInfo(e.target);

      setTouchPoints(prev => {
        const newPoints = new Map(prev);
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          newPoints.set(touch.identifier, {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            force: touch.force || 0,
            type: 'move',
            target,
            timestamp: Date.now(),
          });
        }
        return newPoints;
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const target = getTargetInfo(e.target);
      addEvent('touchend', e.touches.length, target);

      setTouchPoints(prev => {
        const newPoints = new Map(prev);
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          newPoints.delete(touch.identifier);
        }
        return newPoints;
      });
    };

    const handleTouchCancel = (e: TouchEvent) => {
      const target = getTargetInfo(e.target);
      addEvent('touchcancel', e.touches.length, target);

      setTouchPoints(prev => {
        const newPoints = new Map(prev);
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          newPoints.delete(touch.identifier);
        }
        return newPoints;
      });
    };

    // Add listeners with passive: false for debugging (normally passive: true for performance)
    const options = { passive: false, capture: true };
    document.addEventListener('touchstart', handleTouchStart as any, options);
    document.addEventListener('touchmove', handleTouchMove as any, options);
    document.addEventListener('touchend', handleTouchEnd as any, options);
    document.addEventListener('touchcancel', handleTouchCancel as any, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart as any, options);
      document.removeEventListener('touchmove', handleTouchMove as any, options);
      document.removeEventListener('touchend', handleTouchEnd as any, options);
      document.removeEventListener('touchcancel', handleTouchCancel as any, options);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="touch-debug-overlay" aria-live="polite" aria-label="Touch debug overlay">
      {/* Touch point indicators */}
      {Array.from(touchPoints.values()).map(point => (
        <div
          key={point.id}
          className={`touch-point touch-point-${point.type}`}
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`,
          }}
        >
          <div className="touch-point-inner">
            <span className="touch-id">#{point.id}</span>
            {point.force > 0 && (
              <div 
                className="touch-force" 
                style={{ 
                  width: `${point.force * 100}%`,
                  height: `${point.force * 100}%`,
                }}
              />
            )}
          </div>
          <div className="touch-coords">
            {Math.round(point.x)}, {Math.round(point.y)}
          </div>
        </div>
      ))}

      {/* Debug info panel */}
      <div className="touch-debug-panel">
        <div className="debug-header">
          <h3>Touch Debug</h3>
          <div className={`fps-indicator ${fps < 55 ? 'fps-warning' : fps < 30 ? 'fps-critical' : ''}`}>
            {fps} FPS
          </div>
        </div>
        
        <div className="debug-stats">
          <div className="stat">
            <span className="stat-label">Active Touches:</span>
            <span className="stat-value">{touchPoints.size}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Multi-Touch:</span>
            <span className="stat-value">{touchPoints.size > 1 ? 'YES' : 'NO'}</span>
          </div>
        </div>

        <div className="event-log">
          <h4>Recent Events</h4>
          <div className="event-list">
            {events.map(event => (
              <div key={event.id} className="event-item">
                <span className={`event-type event-type-${event.type}`}>
                  {event.type}
                </span>
                <span className="event-touches">{event.touches}👆</span>
                <span className="event-target">{event.target}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="debug-info">
          <p className="info-text">
            Touch an element to see debug information. 
            Multiple simultaneous touches will be tracked with unique IDs.
          </p>
          <p className="info-text">
            Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>T</kbd> to toggle this overlay.
          </p>
        </div>
      </div>
    </div>
  );
}