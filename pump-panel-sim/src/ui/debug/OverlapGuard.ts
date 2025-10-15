/**
 * Overlap Detection Debug Tool
 * Validates that no UI elements overlap and highlights violations
 */

import * as PIXI from 'pixi.js';

/**
 * Extended container type that includes debug graphics
 */
interface ContainerWithDebug extends PIXI.Container {
  __debug?: PIXI.Graphics;
}

/**
 * Highlight overlapping containers with red borders
 * Returns the number of overlapping pairs detected
 */
export function highlightOverlaps(containers: PIXI.Container[]): number {
  // Clear any existing debug graphics
  containers.forEach((c) => {
    const container = c as ContainerWithDebug;
    const existingDebug = container.__debug;
    if (existingDebug) {
      existingDebug.clear();
      existingDebug.destroy();
      container.__debug = undefined;
    }
  });

  // Get bounding rectangles for all containers
  const rects = containers.map((c) => {
    const bounds = c.getBounds();
    return {
      container: c,
      rect: new PIXI.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height),
    };
  });

  // Detect overlaps
  const overlaps: Array<[PIXI.Container, PIXI.Container]> = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].rect;
      const b = rects[j].rect;

      // Check for intersection
      const overlapsX = a.x < b.x + b.width && a.x + a.width > b.x;
      const overlapsY = a.y < b.y + b.height && a.y + a.height > b.y;

      if (overlapsX && overlapsY) {
        overlaps.push([rects[i].container, rects[j].container]);
      }
    }
  }

  // Highlight overlapping containers
  overlaps.forEach(([containerA, containerB]) => {
    [containerA, containerB].forEach((container) => {
      const bounds = container.getBounds();
      const debugGraphics = new PIXI.Graphics()
        .rect(0, 0, bounds.width, bounds.height)
        .stroke({ width: 3, color: 0xff0000 });

      (container as ContainerWithDebug).__debug = debugGraphics;
      container.addChild(debugGraphics);
    });
  });

  // Log results
  if (overlaps.length > 0) {
    console.error(`[OverlapGuard] Found ${overlaps.length} overlapping pairs`);
    overlaps.forEach(([a, b], index) => {
      const aName = (a as ContainerWithDebug).name || 'unnamed';
      const bName = (b as ContainerWithDebug).name || 'unnamed';
      console.error(`  ${index + 1}. "${aName}" overlaps with "${bName}"`);
    });
  } else {
    console.log('[OverlapGuard] ✅ No overlaps detected');
  }

  return overlaps.length;
}

/**
 * Check if two rectangles overlap
 */
export function checkRectOverlap(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  const overlapsX =
    rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x;
  const overlapsY =
    rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;

  return overlapsX && overlapsY;
}