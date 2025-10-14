/**
 * Ripple Effect Component
 * Material Design-style ripple animation for touch feedback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import './RippleEffect.css';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleEffectProps {
  /**
   * Duration of ripple animation in ms
   * @default 600
   */
  duration?: number;
  /**
   * Color of ripple effect
   * @default 'rgba(255, 255, 255, 0.6)'
   */
  color?: string;
  /**
   * Theme variant
   * @default 'light'
   */
  variant?: 'light' | 'dark';
}

/**
 * RippleEffect component that creates expanding circular ripples on click/touch
 * 
 * Usage:
 * ```tsx
 * <button className="with-ripple">
 *   <RippleEffect />
 *   Button Text
 * </button>
 * ```
 */
export function RippleEffect({ 
  duration = 600, 
  color,
  variant = 'light'
}: RippleEffectProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextRippleId = useRef(0);

  // Default color based on variant
  const rippleColor = color || (variant === 'light' 
    ? 'rgba(255, 255, 255, 0.6)' 
    : 'rgba(0, 0, 0, 0.3)');

  /**
   * Create a new ripple at the click/touch position
   */
  const createRipple = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    // Get position relative to button
    let x: number, y: number;
    
    if ('touches' in event && event.touches.length > 0) {
      // Touch event
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else if ('clientX' in event) {
      // Mouse event
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else {
      // Fallback to center
      x = rect.width / 2;
      y = rect.height / 2;
    }

    // Calculate size to cover entire button
    const size = Math.max(rect.width, rect.height) * 2;

    const newRipple: Ripple = {
      id: nextRippleId.current++,
      x,
      y,
      size,
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, duration);
  }, [duration]);

  /**
   * Attach event listeners to parent button
   */
  useEffect(() => {
    const parentElement = document.querySelector('.with-ripple');
    if (!parentElement) return;

    const handleInteraction = (e: Event) => {
      createRipple(e as any);
    };

    parentElement.addEventListener('mousedown', handleInteraction);
    parentElement.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      parentElement.removeEventListener('mousedown', handleInteraction);
      parentElement.removeEventListener('touchstart', handleInteraction);
    };
  }, [createRipple]);

  return (
    <span className="ripple-container" aria-hidden="true">
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple-effect"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </span>
  );
}

/**
 * Hook to create ripple effect programmatically
 * Useful for programmatic triggers or custom implementations
 */
export function useRipple(duration: number = 600) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextRippleId = useRef(0);

  const trigger = useCallback((x: number, y: number, size: number) => {
    const newRipple: Ripple = {
      id: nextRippleId.current++,
      x,
      y,
      size,
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, duration);
  }, [duration]);

  const clear = useCallback(() => {
    setRipples([]);
  }, []);

  return { ripples, trigger, clear };
}