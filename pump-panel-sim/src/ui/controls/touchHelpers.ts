/**
 * Touch Helper Utilities
 * Provides utilities for improving touch interactions on tablet devices
 */

import * as PIXI from 'pixi.js';

/**
 * WCAG 2.1 minimum touch target size
 * Level AA: 44x44 CSS pixels
 * Level AAA: 44x44 CSS pixels
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Recommended comfortable touch target size for controls
 */
export const RECOMMENDED_TOUCH_TARGET_SIZE = 48;

/**
 * Expand hit area for a PixiJS display object to meet touch target size requirements
 * 
 * @param displayObject - The PixiJS object to expand hit area for
 * @param minSize - Minimum size in pixels (default: 44px for WCAG AA)
 * @returns The expanded hit area rectangle
 */
export function expandHitArea(
  displayObject: PIXI.Container,
  minSize: number = MIN_TOUCH_TARGET_SIZE
): PIXI.Rectangle {
  const bounds = displayObject.getLocalBounds();
  const width = Math.max(bounds.width, minSize);
  const height = Math.max(bounds.height, minSize);
  
  // Center the hit area on the visual element
  const x = bounds.x - (width - bounds.width) / 2;
  const y = bounds.y - (height - bounds.height) / 2;
  
  const hitArea = new PIXI.Rectangle(x, y, width, height);
  displayObject.hitArea = hitArea;
  
  return hitArea;
}

/**
 * Create a circular hit area for rotary controls
 * 
 * @param displayObject - The PixiJS object
 * @param minDiameter - Minimum diameter in pixels
 * @returns The circular hit area
 */
export function expandCircularHitArea(
  displayObject: PIXI.Container,
  minDiameter: number = MIN_TOUCH_TARGET_SIZE
): PIXI.Circle {
  const bounds = displayObject.getLocalBounds();
  const visualRadius = Math.max(bounds.width, bounds.height) / 2;
  const targetRadius = Math.max(visualRadius, minDiameter / 2);
  
  // Center on the visual element
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  
  const hitArea = new PIXI.Circle(centerX, centerY, targetRadius);
  displayObject.hitArea = hitArea;
  
  return hitArea;
}

/**
 * Add visual touch feedback to a control
 * Creates a subtle highlight when the control is being touched
 * 
 * @param container - The control container
 * @param radius - Radius for circular controls (if not rectangular)
 * @returns The touch feedback graphic
 */
export function addTouchFeedback(
  container: PIXI.Container,
  radius?: number
): PIXI.Graphics {
  const feedback = new PIXI.Graphics();
  feedback.alpha = 0; // Start invisible
  feedback.visible = false;
  
  if (radius) {
    // Circular feedback for knobs
    feedback.circle(0, 0, radius + 5);
    feedback.fill({ color: 0xffffff, alpha: 0.2 });
    feedback.stroke({ width: 2, color: 0x00ff00, alpha: 0.5 });
  } else {
    // Rectangular feedback for levers
    const bounds = container.getLocalBounds();
    feedback.roundRect(
      bounds.x - 5,
      bounds.y - 5,
      bounds.width + 10,
      bounds.height + 10,
      8
    );
    feedback.fill({ color: 0xffffff, alpha: 0.2 });
    feedback.stroke({ width: 2, color: 0x00ff00, alpha: 0.5 });
  }
  
  container.addChildAt(feedback, 0); // Add behind other elements
  return feedback;
}

/**
 * Show touch feedback animation
 */
export function showTouchFeedback(feedback: PIXI.Graphics): void {
  feedback.visible = true;
  feedback.alpha = 0;
  
  // Fade in animation
  const fadeIn = () => {
    if (feedback.alpha < 1) {
      feedback.alpha = Math.min(1, feedback.alpha + 0.1);
      requestAnimationFrame(fadeIn);
    }
  };
  fadeIn();
}

/**
 * Hide touch feedback animation
 */
export function hideTouchFeedback(feedback: PIXI.Graphics): void {
  // Fade out animation
  const fadeOut = () => {
    if (feedback.alpha > 0) {
      feedback.alpha = Math.max(0, feedback.alpha - 0.2);
      requestAnimationFrame(fadeOut);
    } else {
      feedback.visible = false;
    }
  };
  fadeOut();
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get the recommended control size for current device
 * Returns larger size for touch devices
 */
export function getRecommendedControlSize(baseSize: number): number {
  if (isTouchDevice()) {
    return Math.max(baseSize, RECOMMENDED_TOUCH_TARGET_SIZE);
  }
  return baseSize;
}

/**
 * Debounce touch events to prevent over-firing
 * Useful for preventing rapid-fire touch events
 * 
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle touch events for performance
 * Useful for high-frequency events like touchmove
 * 
 * @param fn - Function to throttle
 * @param delay - Minimum delay between calls in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Haptic feedback helper
 * Triggers device vibration if supported
 * 
 * @param pattern - Vibration pattern (number or array)
 */
export function triggerHapticFeedback(
  pattern: number | number[] = 10
): void {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail if vibration not supported
      console.debug('Haptic feedback not available:', e);
    }
  }
}

/**
 * Touch-specific patterns for different interactions
 */
export const HapticPatterns = {
  // Light tap for button press
  TAP: 10,
  
  // Double tap for toggle
  DOUBLE_TAP: [10, 50, 10],
  
  // Continuous for drag start
  DRAG_START: 20,
  
  // Success confirmation
  SUCCESS: [10, 30, 10, 30, 10],
  
  // Error/warning
  ERROR: [50, 100, 50, 100, 50],
  
  // Subtle tick for rotary knob steps
  TICK: 5,
} as const;