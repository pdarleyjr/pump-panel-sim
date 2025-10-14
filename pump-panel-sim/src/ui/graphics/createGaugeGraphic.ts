/**
 * Graphics helper for creating analog gauge visuals
 */

import * as PIXI from 'pixi.js';

/**
 * Configuration options for gauge creation
 */
export interface GaugeGraphicOptions {
  /** Radius of the gauge face */
  radius?: number;
  /** Starting angle in radians */
  startAngle?: number;
  /** Ending angle in radians */
  endAngle?: number;
  /** Number of tick marks */
  numTicks?: number;
  /** Color of the gauge face */
  color?: number;
  /** Danger zone configuration (draws red arc) */
  dangerZone?: {
    /** Start value for danger zone (normalized 0-1) */
    start: number;
    /** End value for danger zone (normalized 0-1) */
    end: number;
    /** Color of danger zone */
    color?: number;
  };
  /** Compound gauge configuration (dual scale) */
  compound?: {
    /** Center point value (0 reference) */
    centerValue: number;
    /** Minimum value (left side) */
    minValue: number;
    /** Maximum value (right side) */
    maxValue: number;
    /** Label for left side */
    leftLabel?: string;
    /** Label for right side */
    rightLabel?: string;
  };
  /** Labels for major tick marks */
  tickLabels?: string[];
}

/**
 * Create an analog gauge graphic with tick marks and needle
 * @param radius - Radius of the gauge face
 * @param startAngle - Starting angle in radians (default: -3π/4 for 225°)
 * @param endAngle - Ending angle in radians (default: 3π/4 for 135°)
 * @param numTicks - Number of tick marks
 * @param color - Color of the gauge face (hex)
 * @returns Container with gauge graphic
 */
export function createGaugeGraphic(
  radius: number = 80,
  startAngle: number = -Math.PI * 3 / 4,
  endAngle: number = Math.PI * 3 / 4,
  numTicks: number = 12,
  color: number = 0xf0f0f0
): PIXI.Container {
  const container = new PIXI.Container();
  
  // Create gauge face (white/light background)
  const face = new PIXI.Graphics();
  face.circle(0, 0, radius);
  face.fill({ color: color });
  face.stroke({ width: 4, color: 0x2a2a2a });
  
  container.addChild(face);
  
  // Create tick marks
  const ticks = new PIXI.Graphics();
  const angleRange = endAngle - startAngle;
  
  for (let i = 0; i <= numTicks; i++) {
    const angle = startAngle + (angleRange * i / numTicks);
    const isMajor = i % 2 === 0; // Major ticks every other mark
    const tickLength = isMajor ? radius * 0.15 : radius * 0.08;
    const tickWidth = isMajor ? 3 : 2;
    
    const startX = Math.cos(angle) * (radius - tickLength - 5);
    const startY = Math.sin(angle) * (radius - tickLength - 5);
    const endX = Math.cos(angle) * (radius - 5);
    const endY = Math.sin(angle) * (radius - 5);
    
    ticks.moveTo(startX, startY);
    ticks.lineTo(endX, endY);
    ticks.stroke({ width: tickWidth, color: 0x000000 });
  }
  
  container.addChild(ticks);
  
  // Create center hub
  const hub = new PIXI.Graphics();
  hub.circle(0, 0, radius * 0.08);
  hub.fill({ color: 0x2a2a2a });
  
  container.addChild(hub);
  
  // Create needle (as a separate graphics for easy rotation)
  const needle = new PIXI.Graphics();
  
  // Needle shaft - from center to near edge
  needle.moveTo(0, 0);
  needle.lineTo(0, -radius * 0.75);
  needle.stroke({ width: 4, color: 0xff0000 });
  
  // Needle tip (triangle)
  needle.moveTo(-3, -radius * 0.75);
  needle.lineTo(0, -radius * 0.85);
  needle.lineTo(3, -radius * 0.75);
  needle.lineTo(-3, -radius * 0.75);
  needle.fill({ color: 0xff0000 });
  
  // Needle counterweight (optional, for visual balance)
  needle.moveTo(0, 0);
  needle.lineTo(0, radius * 0.15);
  needle.stroke({ width: 3, color: 0xff0000 });
  
  container.addChild(needle);
  
  // Store needle reference for later rotation
  (container as any).needle = needle;
  (container as any).startAngle = startAngle;
  (container as any).endAngle = endAngle;
  
  return container;
}

/**
 * Create an advanced gauge graphic with enhanced features
 * @param options - Configuration options for the gauge
 * @returns Container with gauge graphic
 */
export function createAdvancedGaugeGraphic(options: GaugeGraphicOptions): PIXI.Container {
  const {
    radius = 80,
    startAngle = -Math.PI * 3 / 4,
    endAngle = Math.PI * 3 / 4,
    numTicks = 12,
    color = 0xf0f0f0,
    dangerZone,
    compound,
    tickLabels
  } = options;

  const container = new PIXI.Container();
  
  // Create gauge face (white/light background)
  const face = new PIXI.Graphics();
  face.circle(0, 0, radius);
  face.fill({ color: color });
  face.stroke({ width: 4, color: 0x2a2a2a });
  
  container.addChild(face);

  // Draw danger zone arc if specified
  if (dangerZone) {
    const dangerGraphic = new PIXI.Graphics();
    const angleRange = endAngle - startAngle;
    const dangerStartAngle = startAngle + (angleRange * dangerZone.start);
    const dangerEndAngle = startAngle + (angleRange * dangerZone.end);
    const dangerColor = dangerZone.color || 0xff0000;
    
    // Draw arc for danger zone
    dangerGraphic.moveTo(
      Math.cos(dangerStartAngle) * (radius - 15),
      Math.sin(dangerStartAngle) * (radius - 15)
    );
    
    for (let angle = dangerStartAngle; angle <= dangerEndAngle; angle += 0.05) {
      dangerGraphic.lineTo(
        Math.cos(angle) * (radius - 15),
        Math.sin(angle) * (radius - 15)
      );
    }
    
    dangerGraphic.lineTo(
      Math.cos(dangerEndAngle) * (radius - 15),
      Math.sin(dangerEndAngle) * (radius - 15)
    );
    
    dangerGraphic.stroke({ width: 12, color: dangerColor, alpha: 0.5 });
    container.addChild(dangerGraphic);
  }
  
  // Create tick marks
  const ticks = new PIXI.Graphics();
  const angleRange = endAngle - startAngle;
  
  for (let i = 0; i <= numTicks; i++) {
    const angle = startAngle + (angleRange * i / numTicks);
    const isMajor = i % 2 === 0; // Major ticks every other mark
    const tickLength = isMajor ? radius * 0.15 : radius * 0.08;
    const tickWidth = isMajor ? 3 : 2;
    
    const startX = Math.cos(angle) * (radius - tickLength - 5);
    const startY = Math.sin(angle) * (radius - tickLength - 5);
    const endX = Math.cos(angle) * (radius - 5);
    const endY = Math.sin(angle) * (radius - 5);
    
    ticks.moveTo(startX, startY);
    ticks.lineTo(endX, endY);
    ticks.stroke({ width: tickWidth, color: 0x000000 });
  }
  
  container.addChild(ticks);

  // Add tick labels if provided
  if (tickLabels && tickLabels.length > 0) {
    const labelDistance = radius - 30;
    for (let i = 0; i < tickLabels.length; i++) {
      const angle = startAngle + (angleRange * i / (tickLabels.length - 1));
      const labelX = Math.cos(angle) * labelDistance;
      const labelY = Math.sin(angle) * labelDistance;
      
      const label = new PIXI.Text({
        text: tickLabels[i],
        style: {
          fontSize: 12,
          fill: 0x000000,
          align: 'center',
          fontWeight: 'bold',
        },
      });
      label.anchor.set(0.5, 0.5);
      label.x = labelX;
      label.y = labelY;
      container.addChild(label);
    }
  }

  // Add compound gauge labels if specified
  if (compound) {
    // Left side label (vacuum/negative)
    if (compound.leftLabel) {
      const leftLabel = new PIXI.Text({
        text: compound.leftLabel,
        style: {
          fontSize: 10,
          fill: 0x666666,
          align: 'center',
        },
      });
      leftLabel.anchor.set(0.5, 0);
      leftLabel.x = -radius * 0.6;
      leftLabel.y = radius * 0.6;
      container.addChild(leftLabel);
    }

    // Right side label (pressure/positive)
    if (compound.rightLabel) {
      const rightLabel = new PIXI.Text({
        text: compound.rightLabel,
        style: {
          fontSize: 10,
          fill: 0x666666,
          align: 'center',
        },
      });
      rightLabel.anchor.set(0.5, 0);
      rightLabel.x = radius * 0.6;
      rightLabel.y = radius * 0.6;
      container.addChild(rightLabel);
    }

    // Center zero mark
    const zeroMark = new PIXI.Graphics();
    zeroMark.moveTo(0, -radius + 5);
    zeroMark.lineTo(0, -radius + 20);
    zeroMark.stroke({ width: 4, color: 0x000000 });
    container.addChild(zeroMark);
  }
  
  // Create center hub
  const hub = new PIXI.Graphics();
  hub.circle(0, 0, radius * 0.08);
  hub.fill({ color: 0x2a2a2a });
  
  container.addChild(hub);
  
  // Create needle (as a separate graphics for easy rotation)
  const needle = new PIXI.Graphics();
  
  // Needle shaft - from center to near edge
  needle.moveTo(0, 0);
  needle.lineTo(0, -radius * 0.75);
  needle.stroke({ width: 4, color: 0x000000 });
  
  // Needle tip (triangle)
  needle.moveTo(-3, -radius * 0.75);
  needle.lineTo(0, -radius * 0.85);
  needle.lineTo(3, -radius * 0.75);
  needle.lineTo(-3, -radius * 0.75);
  needle.fill({ color: 0x000000 });
  
  // Needle counterweight (optional, for visual balance)
  needle.moveTo(0, 0);
  needle.lineTo(0, radius * 0.15);
  needle.stroke({ width: 3, color: 0x000000 });
  
  container.addChild(needle);
  
  // Store needle reference and metadata for later use
  (container as any).needle = needle;
  (container as any).startAngle = startAngle;
  (container as any).endAngle = endAngle;
  (container as any).compound = compound;
  
  return container;
}

/**
 * Create a texture from the gauge graphic for reuse
 * @param app - PIXI Application instance
 * @param radius - Radius of the gauge
 * @param startAngle - Start angle
 * @param endAngle - End angle
 * @param numTicks - Number of ticks
 * @param color - Face color
 * @returns Texture that can be used to create sprites
 */
export function createGaugeTexture(
  app: PIXI.Application,
  radius: number = 80,
  startAngle: number = -Math.PI * 3 / 4,
  endAngle: number = Math.PI * 3 / 4,
  numTicks: number = 12,
  color: number = 0xf0f0f0
): PIXI.Texture {
  const container = createGaugeGraphic(radius, startAngle, endAngle, numTicks, color);
  return app.renderer.generateTexture(container);
}