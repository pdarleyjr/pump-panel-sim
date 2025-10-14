/**
 * useTouchFeedback Hook
 * Custom React hook for consistent touch feedback across components
 * 
 * Provides:
 * - Touch state tracking
 * - Haptic feedback integration
 * - Visual feedback timing
 * - Accessible press handlers
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { triggerHapticFeedback, HapticPatterns } from '../controls/touchHelpers';

export interface TouchFeedbackOptions {
  /**
   * Type of haptic feedback to trigger
   * @default 'tap'
   */
  hapticType?: keyof typeof HapticPatterns;
  
  /**
   * Whether haptic feedback is enabled
   * @default true
   */
  enableHaptics?: boolean;
  
  /**
   * Callback when press action completes (on touchend/mouseup)
   */
  onPress?: (event: React.MouseEvent | React.TouchEvent) => void;
  
  /**
   * Callback when press starts (on touchstart/mousedown)
   */
  onPressStart?: (event: React.MouseEvent | React.TouchEvent) => void;
  
  /**
   * Callback when press ends without completing (drag away)
   */
  onPressCancel?: () => void;
  
  /**
   * Debounce delay in ms to prevent rapid firing
   * @default 0
   */
  debounceMs?: number;
  
  /**
   * Enable ripple effect
   * @default false
   */
  enableRipple?: boolean;
  
  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
}

export interface TouchFeedbackReturn {
  /**
   * Whether the element is currently being touched
   */
  isTouched: boolean;
  
  /**
   * Whether the element is currently pressed (active)
   */
  isPressed: boolean;
  
  /**
   * Props to spread onto the interactive element
   */
  touchProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: () => void;
    className?: string;
    'aria-pressed'?: boolean;
  };
  
  /**
   * Whether to show ripple effect
   */
  showRipple: boolean;
  
  /**
   * Manually trigger haptic feedback
   */
  triggerHaptic: () => void;
}

/**
 * Custom hook for touch feedback management
 * 
 * @example
 * ```tsx
 * const { isTouched, touchProps, showRipple } = useTouchFeedback({
 *   hapticType: 'tap',
 *   enableRipple: true,
 *   onPress: handleButtonClick
 * });
 * 
 * return (
 *   <button {...touchProps} className={isTouched ? 'touched' : ''}>
 *     {showRipple && <RippleEffect />}
 *     Click Me
 *   </button>
 * );
 * ```
 */
export function useTouchFeedback(options: TouchFeedbackOptions = {}): TouchFeedbackReturn {
  const {
    hapticType = 'TAP',
    enableHaptics = true,
    onPress,
    onPressStart,
    onPressCancel,
    debounceMs = 0,
    enableRipple = false,
    disabled = false,
  } = options;

  const [isTouched, setIsTouched] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  
  const isPressedRef = useRef(false);
  const lastPressTime = useRef(0);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  /**
   * Trigger haptic feedback based on type
   */
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && !disabled) {
      const pattern = HapticPatterns[hapticType];
      triggerHapticFeedback(pattern);
    }
  }, [enableHaptics, hapticType, disabled]);

  /**
   * Handle press start (mousedown/touchstart)
   */
  const handlePressStart = useCallback((
    event: React.MouseEvent | React.TouchEvent
  ) => {
    if (disabled) return;

    // Store touch position for drag detection
    if ('touches' in event && event.touches.length > 0) {
      touchStartPos.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    } else if ('clientX' in event) {
      touchStartPos.current = {
        x: event.clientX,
        y: event.clientY,
      };
    }

    setIsTouched(true);
    setIsPressed(true);
    isPressedRef.current = true;

    if (enableRipple) {
      setShowRipple(true);
    }

    // Trigger haptic on press start
    triggerHaptic();

    if (onPressStart) {
      onPressStart(event);
    }
  }, [disabled, enableRipple, triggerHaptic, onPressStart]);

  /**
   * Handle press end (mouseup/touchend)
   */
  const handlePressEnd = useCallback((
    event: React.MouseEvent | React.TouchEvent
  ) => {
    if (disabled) return;

    setIsTouched(false);
    setIsPressed(false);

    // Check if we're still in pressed state and not dragged away
    if (isPressedRef.current) {
      isPressedRef.current = false;

      // Debounce check
      const now = Date.now();
      if (now - lastPressTime.current < debounceMs) {
        return;
      }
      lastPressTime.current = now;

      // Verify touch didn't drag away significantly
      let shouldTrigger = true;
      if ('changedTouches' in event && event.changedTouches.length > 0 && touchStartPos.current) {
        const touch = event.changedTouches[0];
        const dx = Math.abs(touch.clientX - touchStartPos.current.x);
        const dy = Math.abs(touch.clientY - touchStartPos.current.y);
        const dragThreshold = 10; // pixels
        
        if (dx > dragThreshold || dy > dragThreshold) {
          shouldTrigger = false;
          if (onPressCancel) {
            onPressCancel();
          }
        }
      }

      if (shouldTrigger && onPress) {
        onPress(event);
      }
    }

    touchStartPos.current = null;

    // Reset ripple after a short delay
    if (enableRipple) {
      setTimeout(() => setShowRipple(false), 100);
    }
  }, [disabled, debounceMs, onPress, onPressCancel, enableRipple]);

  /**
   * Handle press cancel (mouseleave/touchcancel)
   */
  const handlePressCancel = useCallback(() => {
    if (disabled) return;

    setIsTouched(false);
    setIsPressed(false);
    isPressedRef.current = false;
    touchStartPos.current = null;

    if (enableRipple) {
      setShowRipple(false);
    }

    if (onPressCancel) {
      onPressCancel();
    }
  }, [disabled, enableRipple, onPressCancel]);

  /**
   * Touch props to spread onto element
   */
  const touchProps = useMemo(() => ({
    onMouseDown: handlePressStart,
    onMouseUp: handlePressEnd,
    onMouseLeave: handlePressCancel,
    onTouchStart: handlePressStart,
    onTouchEnd: handlePressEnd,
    onTouchCancel: handlePressCancel,
    className: disabled ? 'disabled' : undefined,
    'aria-pressed': isPressed ? true : undefined,
  }), [handlePressStart, handlePressEnd, handlePressCancel, disabled, isPressed]);

  return {
    isTouched,
    isPressed,
    touchProps,
    showRipple,
    triggerHaptic,
  };
}

/**
 * Simple touch feedback hook without callbacks
 * Just tracks touch state for styling
 */
export function useSimpleTouchState() {
  const [isTouched, setIsTouched] = useState(false);

  const touchProps = useMemo(() => ({
    onMouseDown: () => setIsTouched(true),
    onMouseUp: () => setIsTouched(false),
    onMouseLeave: () => setIsTouched(false),
    onTouchStart: () => setIsTouched(true),
    onTouchEnd: () => setIsTouched(false),
    onTouchCancel: () => setIsTouched(false),
  }), []);

  return { isTouched, touchProps };
}