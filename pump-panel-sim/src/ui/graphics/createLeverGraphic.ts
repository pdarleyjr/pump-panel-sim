/**
 * Graphics helper for creating lever control visuals
 */

import * as PIXI from 'pixi.js';

/**
 * Create a lever control graphic (vertical or horizontal)
 * @param width - Width of the lever base
 * @param height - Height of the lever base
 * @param handleLength - Length of the lever handle
 * @param color - Color of the lever (hex)
 * @param vertical - If true, creates a vertical lever, otherwise horizontal
 * @returns Container with lever graphic
 */
export function createLeverGraphic(
  width: number = 22.5,
  height: number = 90,
  handleLength: number = 30,
  color: number = 0x4a5568,
  vertical: boolean = true
): PIXI.Container {
  const container = new PIXI.Container();
  
  // Create the lever track/slot
  const track = new PIXI.Graphics();
  
  if (vertical) {
    // Vertical track
    track.roundRect(-width / 4, -height / 2, width / 2, height, 5);
    track.fill({ color: 0x1a1a1a });
    track.stroke({ width: 2, color: 0x2a2a2a });
  } else {
    // Horizontal track
    track.roundRect(-height / 2, -width / 4, height, width / 2, 5);
    track.fill({ color: 0x1a1a1a });
    track.stroke({ width: 2, color: 0x2a2a2a });
  }
  
  container.addChild(track);
  
  // Create the lever handle
  const handle = new PIXI.Graphics();
  
  // Handle base (the part that slides in the track)
  handle.circle(0, 0, width / 2);
  handle.fill({ color: color });
  handle.stroke({ width: 2, color: color - 0x202020 });
  
  // Handle grip (the part you grab)
  if (vertical) {
    handle.roundRect(-handleLength / 2, -10, handleLength, 20, 5);
  } else {
    handle.roundRect(-10, -handleLength / 2, 20, handleLength, 5);
  }
  handle.fill({ color: color });
  handle.stroke({ width: 2, color: color - 0x202020 });
  
  container.addChild(handle);
  
  return container;
}

/**
 * Create a texture from the lever graphic for reuse
 * @param app - PIXI Application instance
 * @param width - Width of the lever
 * @param height - Height of the lever
 * @param handleLength - Length of handle
 * @param color - Color of the lever
 * @param vertical - Orientation
 * @returns Texture that can be used to create sprites
 */
export function createLeverTexture(
  app: PIXI.Application,
  width: number = 30,
  height: number = 120,
  handleLength: number = 40,
  color: number = 0x4a5568,
  vertical: boolean = true
): PIXI.Texture {
  const container = createLeverGraphic(width, height, handleLength, color, vertical);
  return app.renderer.generateTexture(container);
}