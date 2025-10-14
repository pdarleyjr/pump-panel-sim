/**
 * Analog pressure/flow gauge display
 */

import * as PIXI from 'pixi.js';
import { createGaugeGraphic, createAdvancedGaugeGraphic, type GaugeGraphicOptions } from '../graphics/createGaugeGraphic';
import { DampedValue, DampedValuePresets } from './DampedValue';

/**
 * Configuration for a pressure gauge
 */
export interface GaugeConfig {
  /** Unique identifier */
  id: string;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Display label */
  label: string;
  /** Minimum value on gauge */
  min: number;
  /** Maximum value on gauge */
  max: number;
  /** Units to display (e.g., "PSI", "GPM") */
  units: string;
  /** Current value */
  value: number;
  /** Gauge radius */
  radius?: number;
  /** Compound gauge configuration (for dual scale gauges) */
  compound?: {
    /** Center value (zero point) */
    centerValue: number;
    /** Units for negative side (e.g., "inHg" for vacuum) */
    negativeUnits?: string;
    /** Units for positive side (e.g., "PSI" for pressure) */
    positiveUnits?: string;
  };
  /** Danger zone configuration */
  dangerZone?: {
    /** Start of danger zone (value) */
    startValue: number;
    /** End of danger zone (value) */
    endValue: number;
    /** Warning threshold (needle turns red) */
    warningThreshold?: number;
  };
  /** Whether this is a master gauge (larger, more prominent) */
  isMaster?: boolean;
}

/**
 * Analog gauge display for pressure, flow, or other readings
 */
export class PressureGauge {
  private config: GaugeConfig;
  private container: PIXI.Container;
  private gaugeGraphic: PIXI.Container;
  private needle: PIXI.Graphics;
  private label: PIXI.Text;
  private valueText: PIXI.Text;
  private currentValue: number;
  private startAngle: number = -Math.PI * 3 / 4; // -135°
  private endAngle: number = Math.PI * 3 / 4;    // 135°
  private tickerUpdateBound: ((ticker: PIXI.Ticker) => void) | null = null;

  constructor(config: GaugeConfig) {
    this.config = config;
    this.currentValue = config.value;
    this.container = new PIXI.Container();
    
    // Determine if we need advanced gauge features
    const needsAdvanced = config.compound || config.dangerZone || config.isMaster;
    
    if (needsAdvanced) {
      // Build gauge options for advanced gauge
      const gaugeOptions: GaugeGraphicOptions = {
        radius: config.radius || 80,
        startAngle: this.startAngle,
        endAngle: this.endAngle,
        numTicks: 12,
        color: 0xf0f0f0,
      };

      // Add compound gauge configuration
      if (config.compound) {
        gaugeOptions.compound = {
          centerValue: config.compound.centerValue,
          minValue: config.min,
          maxValue: config.max,
          leftLabel: config.compound.negativeUnits || 'inHg',
          rightLabel: config.compound.positiveUnits || 'PSI',
        };
      }

      // Add danger zone configuration
      if (config.dangerZone) {
        const range = config.max - config.min;
        const dangerStart = (config.dangerZone.startValue - config.min) / range;
        const dangerEnd = (config.dangerZone.endValue - config.min) / range;
        gaugeOptions.dangerZone = {
          start: dangerStart,
          end: dangerEnd,
          color: 0xff0000,
        };
      }

      // Add tick labels for master gauges
      if (config.isMaster) {
        gaugeOptions.tickLabels = this.generateTickLabels();
      }

      this.gaugeGraphic = createAdvancedGaugeGraphic(gaugeOptions);
    } else {
      // Use basic gauge for regular gauges
      this.gaugeGraphic = createGaugeGraphic(
        config.radius || 80,
        this.startAngle,
        this.endAngle,
        12,
        0xf0f0f0
      );
    }
    
    this.needle = new PIXI.Graphics();
    this.label = new PIXI.Text();
    this.valueText = new PIXI.Text();
  }

  /**
   * Generate tick labels for the gauge based on min/max values
   */
  private generateTickLabels(): string[] {
    const labels: string[] = [];
    const range = this.config.max - this.config.min;
    const numLabels = 9; // 0, 50, 100, 150, 200, 250, 300, 350, 400 for 0-400 PSI

    // For compound gauges, handle differently
    if (this.config.compound) {
      const center = this.config.compound.centerValue;
      const negativeRange = center - this.config.min;
      const positiveRange = this.config.max - center;
      
      // Create labels from min to center to max
      for (let i = 0; i < numLabels; i++) {
        const t = i / (numLabels - 1);
        const value = this.config.min + range * t;
        if (value < center) {
          labels.push(`${Math.abs(Math.round(value))}`);
        } else if (value === center) {
          labels.push('0');
        } else {
          labels.push(`${Math.round(value)}`);
        }
      }
    } else {
      // Regular gauge labels
      for (let i = 0; i < numLabels; i++) {
        const value = this.config.min + (range * i / (numLabels - 1));
        labels.push(`${Math.round(value)}`);
      }
    }

    return labels;
  }

  /**
   * Create and initialize the gauge
   */
  public create(): void {
    this.container.x = this.config.x;
    this.container.y = this.config.y;

    // Add the gauge graphic
    this.gaugeGraphic.x = 0;
    this.gaugeGraphic.y = 0;
    
    // PERFORMANCE: Cache static gauge face as bitmap to reduce draw calls
    this.gaugeGraphic.cacheAsBitmap = true;
    
    this.container.addChild(this.gaugeGraphic);

    // Get the needle reference from the gauge graphic
    this.needle = (this.gaugeGraphic as any).needle;

    // Add label text above gauge
    const radius = this.config.radius || 80;
    const fontSize = this.config.isMaster ? 18 : 14;
    this.label = new PIXI.Text({
      text: this.config.label,
      style: {
        fontSize: fontSize,
        fill: 0xffffff,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.label.anchor.set(0.5, 1);
    this.label.x = 0;
    this.label.y = -radius - (this.config.isMaster ? 15 : 10);
    this.container.addChild(this.label);

    // Add min/max labels
    const minLabel = new PIXI.Text({
      text: `${this.config.min}`,
      style: {
        fontSize: 10,
        fill: 0xcccccc,
        align: 'center',
      },
    });
    minLabel.anchor.set(1, 0.5);
    minLabel.x = -radius * 0.7;
    minLabel.y = radius * 0.5;
    this.container.addChild(minLabel);

    const maxLabel = new PIXI.Text({
      text: `${this.config.max}`,
      style: {
        fontSize: 10,
        fill: 0xcccccc,
        align: 'center',
      },
    });
    maxLabel.anchor.set(0, 0.5);
    maxLabel.x = radius * 0.7;
    maxLabel.y = radius * 0.5;
    this.container.addChild(maxLabel);

    // Add digital value text at bottom of gauge
    const valueFontSize = this.config.isMaster ? 20 : 16;
    this.valueText = new PIXI.Text({
      text: this.formatValueText(this.currentValue),
      style: {
        fontSize: valueFontSize,
        fill: 0x00ff00,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.valueText.anchor.set(0.5, 0);
    this.valueText.x = 0;
    this.valueText.y = radius * 0.3;
    this.container.addChild(this.valueText);

    // Set initial needle position
    this.updateNeedleRotation();
  }

  /**
   * Update the gauge to show a new value
   * @param value - New value to display
   */
  public setValue(value: number): void {
    // Clamp value to min/max
    this.currentValue = Math.max(
      this.config.min,
      Math.min(this.config.max, value)
    );

    this.updateNeedleRotation();
    this.updateValueText();
  }

  /**
   * Update the needle rotation based on current value
   */
  private updateNeedleRotation(): void {
    const range = this.config.max - this.config.min;
    const normalized = (this.currentValue - this.config.min) / range;
    
    // Map normalized value to angle range
    const angleRange = this.endAngle - this.startAngle;
    const targetAngle = this.startAngle + (normalized * angleRange);
    
    this.needle.rotation = targetAngle;
  }

  /**
   * Format the value text based on gauge type
   */
  private formatValueText(value: number): string {
    const displayValue = Math.round(value * 10) / 10;
    
    if (this.config.compound) {
      const center = this.config.compound.centerValue;
      if (value < center) {
        // Vacuum/negative side
        const absValue = Math.abs(displayValue);
        return `${absValue} ${this.config.compound.negativeUnits || 'inHg'}`;
      } else {
        // Pressure/positive side
        return `${displayValue} ${this.config.compound.positiveUnits || 'PSI'}`;
      }
    }
    
    return `${displayValue} ${this.config.units}`;
  }

  /**
   * Update the digital value text
   */
  private updateValueText(): void {
    this.valueText.text = this.formatValueText(this.currentValue);
    
    // Color code based on value and danger zones
    let color = 0x00ff00; // Green for normal
    
    if (this.config.dangerZone) {
      // Check if in warning threshold
      if (this.config.dangerZone.warningThreshold &&
          this.currentValue >= this.config.dangerZone.warningThreshold) {
        color = 0xffaa00; // Orange for warning
      }
      // Check if in danger zone
      if (this.currentValue >= this.config.dangerZone.startValue) {
        color = 0xff0000; // Red for danger
      }
    } else {
      // Default color coding
      const normalized = (this.currentValue - this.config.min) / (this.config.max - this.config.min);
      if (normalized > 0.9) {
        color = 0xff0000; // Red for danger zone
      } else if (normalized > 0.7) {
        color = 0xffaa00; // Orange for caution
      }
    }
    
    this.valueText.style.fill = color;
    
    // Update needle color if in danger zone
    if (this.config.dangerZone &&
        this.config.dangerZone.warningThreshold &&
        this.currentValue >= this.config.dangerZone.warningThreshold) {
      this.updateNeedleColor(0xff0000); // Red needle
    } else {
      this.updateNeedleColor(0x000000); // Black needle
    }
  }

  /**
   * Update the needle color (only if changed to avoid expensive Graphics operations)
   */
  private updateNeedleColor(color: number): void {
    // PERFORMANCE: Skip redraw if color hasn't changed
    if (this.currentNeedleColor === color) return;
    
    this.currentNeedleColor = color;
    const radius = this.config.radius || 80;
    
    // Clear and redraw needle
    this.needle.clear();
    
    // Needle shaft
    this.needle.moveTo(0, 0);
    this.needle.lineTo(0, -radius * 0.75);
    this.needle.stroke({ width: 4, color: color });
    
    // Needle tip (triangle)
    this.needle.moveTo(-3, -radius * 0.75);
    this.needle.lineTo(0, -radius * 0.85);
    this.needle.lineTo(3, -radius * 0.75);
    this.needle.lineTo(-3, -radius * 0.75);
    this.needle.fill({ color: color });
    
    // Needle counterweight
    this.needle.moveTo(0, 0);
    this.needle.lineTo(0, radius * 0.15);
    this.needle.stroke({ width: 3, color: color });
  }

  /**
   * Get the container to add to the stage
   */
  public getContainer(): PIXI.Container {
    return this.container;
  }

  /**
   * Remove ticker callback if it was set up
   */
  public removeTicker(app?: PIXI.Application): void {
    if (this.tickerUpdateBound && app) {
      app.ticker.remove(this.tickerUpdateBound);
      this.tickerUpdateBound = null;
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(app?: PIXI.Application): void {
    // Remove ticker callback
    this.removeTicker(app);
    
    // Destroy container and children
    this.container.destroy({ children: true });
  }
}