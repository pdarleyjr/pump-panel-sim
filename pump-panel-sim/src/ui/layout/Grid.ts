/**
 * Grid Layout Engine
 * Mathematical grid system for constraint-driven layout to eliminate overlaps
 */

export type GridItem = {
  id: string;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  anchor?: 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';
};

export type GridPlacement = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Layout for a fixed design resolution; returns pixel placements scaled to viewport
 */
export function computeGrid({
  designWidth,
  designHeight,
  viewportWidth,
  viewportHeight,
  cols,
  rows,
  gap,
  margin,
  slots,
}: {
  designWidth: number;
  designHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  cols: number;
  rows: number;
  gap: number;
  margin: number;
  // mapping from itemId -> [col, row, colSpan, rowSpan]
  slots: Record<string, [number, number, number, number]>;
}): { scale: number; placements: Record<string, GridPlacement> } {
  // Calculate scale factor to fit viewport while maintaining aspect ratio
  const scaleX = viewportWidth / designWidth;
  const scaleY = viewportHeight / designHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculate cell dimensions in design space
  const cellW = (designWidth - 2 * margin - (cols - 1) * gap) / cols;
  const cellH = (designHeight - 2 * margin - (rows - 1) * gap) / rows;

  const placements: Record<string, GridPlacement> = {};

  for (const [id, [c, r, cs, rs]] of Object.entries(slots)) {
    // Calculate position and size in design space
    const x = margin + c * (cellW + gap);
    const y = margin + r * (cellH + gap);
    const w = cs * cellW + (cs - 1) * gap;
    const h = rs * cellH + (rs - 1) * gap;

    // Apply scale to get viewport coordinates
    placements[id] = {
      id,
      x: x * scale,
      y: y * scale,
      w: w * scale,
      h: h * scale,
    };
  }

  return { scale, placements };
}

/**
 * Validate that grid placements don't overlap
 */
export function validateNoOverlaps(
  placements: Record<string, GridPlacement>
): { valid: boolean; overlaps: Array<[string, string]> } {
  const items = Object.values(placements);
  const overlaps: Array<[string, string]> = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      // Check for overlap
      const overlapsX = a.x < b.x + b.w && a.x + a.w > b.x;
      const overlapsY = a.y < b.y + b.h && a.y + a.h > b.y;

      if (overlapsX && overlapsY) {
        overlaps.push([a.id, b.id]);
      }
    }
  }

  return {
    valid: overlaps.length === 0,
    overlaps,
  };
}