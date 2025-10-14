/**
 * Hover glow effect for interactive controls
 * Uses DropShadowFilter for better compatibility across platforms
 */

import * as PIXI from 'pixi.js';

/**
 * Configuration options for hover glow effect
 */
export interface HoverGlowOptions {
  /** Glow color (default: cyan) */
  color?: number;
  /** Glow alpha/opacity (default: 0.6) */
  alpha?: number;
  /** Glow blur radius (default: 8) */
  blur?: number;
  /** Shadow quality (default: 3) */
  quality?: number;
}

/**
 * Attach hover glow effect to interactive objects
 * Uses DropShadowFilter instead of GlowFilter for better compatibility
 * 
 * This effect provides visual feedback when users hover over interactive
 * controls, improving discoverability and user experience.
 * 
 * @param obj - The PIXI container to attach the effect to
 * @param options - Optional configuration for the glow effect
 */
export function attachHoverGlow(
  obj: PIXI.Container,
  options: HoverGlowOptions = {}
): void {
  const {
    color = 0x00ffff,      // Cyan/aqua glow
    alpha = 0.6,
    blur = 8,
    quality = 3,
  } = options;
  
  // Make the object interactive
  obj.eventMode = 'static';
  obj.cursor = 'pointer';
  
  // Create a drop shadow that looks like a glow
  // By setting distance to 0, the shadow appears as a glow around the object
  const glowFilter = new PIXI.DropShadowFilter({
    color,
    alpha,
    blur,
    distance: 0,     // Zero distance makes it appear as a glow, not a shadow
    quality,
  });
  
  // Store reference to the filter for removal
  const glowKey = Symbol('hoverGlow');
  (obj as any)[glowKey] = glowFilter;
  
  // Add glow on hover
  obj.on('pointerover', () => {
    if (!obj.filters) {
      obj.filters = [];
    }
    if (!obj.filters.includes(glowFilter)) {
      obj.filters = [...obj.filters, glowFilter];
    }
  });
  
  // Remove glow when not hovering
  obj.on('pointerout', () => {
    if (obj.filters) {
      obj.filters = obj.filters.filter(f => f !== glowFilter);
    }
  });
}

/**
 * Remove hover glow effect from an object
 * 
 * @param obj - The PIXI container to remove the effect from
 */
export function removeHoverGlow(obj: PIXI.Container): void {
  // Remove all event listeners
  obj.off('pointerover');
  obj.off('pointerout');
  
  // Remove the filter if it exists
  if (obj.filters) {
    obj.filters = obj.filters.filter(f => !(f instanceof PIXI.DropShadowFilter));
  }
  
  // Reset cursor
  obj.cursor = 'auto';
}

/**
 * Create a pulsing glow effect (for emphasis)
 * Returns a function to stop the pulsing animation
 * 
 * @param obj - The PIXI container to animate
 * @param options - Glow configuration options
 * @returns Function to stop the pulsing effect
 */
export function attachPulsingGlow(
  obj: PIXI.Container,
  options: HoverGlowOptions = {}
): () => void {
  const {
    color = 0xffff00,      // Yellow for emphasis
    alpha = 0.8,
    blur = 12,
    quality = 3,
  } = options;
  
  const glowFilter = new PIXI.DropShadowFilter({
    color,
    alpha: 0,
    blur,
    distance: 0,
    quality,
  });
  
  obj.filters = [...(obj.filters || []), glowFilter];
  
  let phase = 0;
  let animationId: number | null = null;
  
  const animate = () => {
    phase += 0.05;
    glowFilter.alpha = alpha * (0.5 + 0.5 * Math.sin(phase));
    animationId = requestAnimationFrame(animate);
  };
  
  animate();
  
  // Return cleanup function
  return () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
    if (obj.filters) {
      obj.filters = obj.filters.filter(f => f !== glowFilter);
    }
  };
}