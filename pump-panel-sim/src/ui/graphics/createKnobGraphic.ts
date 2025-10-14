/**
 * Graphics helper for creating rotary knob visuals
 */

import * as PIXI from 'pixi.js';

/**
 * Create a circular knob graphic with an indicator line
 * @param radius - Radius of the knob in pixels
 * @param color - Color of the knob (hex)
 * @returns Container with knob and indicator
 */
export function createKnobGraphic(radius: number = 40, color: number = 0x4a5568): PIXI.Container {
  const container = new PIXI.Container();
  
  // Create the knob circle
  const knob = new PIXI.Graphics();
  
  // Outer circle (border)
  knob.circle(0, 0, radius);
  knob.fill({ color: color });
  
  // Inner highlight circle
  knob.circle(0, 0, radius * 0.9);
  knob.fill({ color: color + 0x1a1a1a });
  
  // Center dot
  knob.circle(0, 0, radius * 0.15);
  knob.fill({ color: 0x000000 });
  
  container.addChild(knob);
  
  // Create indicator line from center to edge
  const indicator = new PIXI.Graphics();
  indicator.moveTo(0, 0);
  indicator.lineTo(0, -radius * 0.8);
  indicator.stroke({ width: 4, color: 0xffffff });
  
  container.addChild(indicator);
  
  return container;
}

/**
 * Create a texture from the knob graphic for reuse
 * @param app - PIXI Application instance
 * @param radius - Radius of the knob
 * @param color - Color of the knob
 * @returns Texture that can be used to create sprites
 */
export function createKnobTexture(
  app: PIXI.Application,
  radius: number = 40,
  color: number = 0x4a5568
): PIXI.Texture {
  const container = createKnobGraphic(radius, color);
  return app.renderer.generateTexture(container);
}