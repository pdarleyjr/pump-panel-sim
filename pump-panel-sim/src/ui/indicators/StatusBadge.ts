/**
 * Status badge indicator for color-coded system status
 * Shows pressure, temperature, and warning states with visual feedback
 */

import * as PIXI from 'pixi.js';
import type { StatusBadgeConfig, StatusLevel } from './types';
import { StatusColors } from './types';

/**
 * Status badge with color coding and optional flashing
 */
export class StatusBadge {
  private config: StatusBadgeConfig;
  private container: PIXI.Container;
  private background: PIXI.Graphics;
  private border: PIXI.Graphics;
  private label: PIXI.Text;
  private valueText: PIXI.Text;
  private currentStatus: StatusLevel;
  private flashTime: number = 0;
  private isFlashing: boolean = false;
  private tickerCallback: ((delta: PIXI.Ticker) => void) | null = null;

  private readonly width: number = 120;
  private readonly height: number = 40;

  constructor(config: StatusBadgeConfig) {
    this.config = config;
    this.currentStatus = config.status;
    this.container = new PIXI.Container();
    this.background = new PIXI.Graphics();
    this.border = new PIXI.Graphics();
    this.label = new PIXI.Text();
    this.valueText = new PIXI.Text();
  }

  /**
   * Create and initialize the status badge
   */
  public create(): void {
    this.container.x = this.config.x;
    this.container.y = this.config.y;

    // Create background
    this.background.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    this.background.fill({ color: 0x1a1a1a, alpha: 0.8 });
    this.container.addChild(this.background);

    // Create border (color-coded by status)
    this.border.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    this.border.stroke({ width: 2, color: StatusColors[this.currentStatus] });
    this.container.addChild(this.border);

    // Create label text
    this.label = new PIXI.Text({
      text: this.config.label,
      style: {
        fontSize: 10,
        fill: 0xcccccc,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.label.anchor.set(0.5, 1);
    this.label.x = 0;
    this.label.y = -5;
    this.container.addChild(this.label);

    // Create value text (if provided)
    if (this.config.value) {
      this.valueText = new PIXI.Text({
        text: this.config.value,
        style: {
          fontSize: 14,
          fill: StatusColors[this.currentStatus],
          align: 'center',
          fontWeight: 'bold',
        },
      });
      this.valueText.anchor.set(0.5, 0);
      this.valueText.x = 0;
      this.valueText.y = 0;
      this.container.addChild(this.valueText);
    }

    // Initial update
    this.updateVisual();
  }

  /**
   * Update the status level
   */
  public setStatus(status: StatusLevel, value?: string): void {
    this.currentStatus = status;
    if (value !== undefined) {
      this.config.value = value;
    }
    this.updateVisual();
  }

  /**
   * Update the display value
   */
  public setValue(value: string): void {
    this.config.value = value;
    if (this.valueText) {
      this.valueText.text = value;
    }
  }

  /**
   * Update the visual appearance
   */
  private updateVisual(): void {
    const color = StatusColors[this.currentStatus];

    // Update border color
    this.border.clear();
    this.border.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    this.border.stroke({ width: 2, color: color });

    // Update background with subtle color tint
    this.background.clear();
    this.background.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    this.background.fill({ color: 0x1a1a1a, alpha: 0.8 });
    
    // Add status color overlay
    const overlay = new PIXI.Graphics();
    overlay.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
    overlay.fill({ color: color, alpha: 0.15 });
    this.container.addChildAt(overlay, 1);

    // Update value text color if it exists
    if (this.valueText && this.config.value) {
      this.valueText.text = this.config.value;
      this.valueText.style.fill = color;
    }
  }

  /**
   * Start flashing animation for critical alerts
   */
  public startFlashing(app: PIXI.Application): void {
    if (this.tickerCallback) return; // Already flashing

    this.isFlashing = true;
    this.flashTime = 0;

    this.tickerCallback = (ticker: PIXI.Ticker) => {
      if (!this.isFlashing) return;

      this.flashTime += ticker.deltaTime * 0.016; // Convert to seconds

      // Flash at 2 Hz
      const alpha = 0.5 + Math.sin(this.flashTime * Math.PI * 4) * 0.5;

      // Update border alpha for flashing effect
      const color = StatusColors[this.currentStatus];
      this.border.clear();
      this.border.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 5);
      this.border.stroke({ width: 3, color: color, alpha: alpha });

      // Flash value text too
      if (this.valueText) {
        this.valueText.alpha = alpha;
      }
    };

    app.ticker.add(this.tickerCallback);
  }

  /**
   * Stop flashing animation
   */
  public stopFlashing(app: PIXI.Application): void {
    if (this.tickerCallback) {
      app.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
    this.isFlashing = false;

    // Reset to full opacity
    if (this.valueText) {
      this.valueText.alpha = 1;
    }
    this.updateVisual();
  }

  /**
   * Show or hide the badge
   */
  public setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * Get the container to add to the stage
   */
  public getContainer(): PIXI.Container {
    return this.container;
  }

  /**
   * Clean up resources
   */
  public destroy(app?: PIXI.Application): void {
    if (app && this.tickerCallback) {
      this.stopFlashing(app);
    }
    this.container.destroy({ children: true });
  }
}