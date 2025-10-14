/**
 * LED indicator component with glow effects
 * Provides visual feedback with realistic LED-style lights
 */

import * as PIXI from 'pixi.js';
import type { LEDIndicatorConfig, LEDState } from './types';

/**
 * LED indicator with glow effect and optional pulsing
 */
export class LEDIndicator {
  private config: LEDIndicatorConfig;
  private container: PIXI.Container;
  private ledCircle: PIXI.Graphics;
  private glowCircle: PIXI.Graphics;
  private label: PIXI.Text;
  private state: LEDState;
  private pulseTime: number = 0;
  private tickerCallback: ((delta: PIXI.Ticker) => void) | null = null;

  constructor(config: LEDIndicatorConfig) {
    this.config = config;
    this.state = { ...config.initialState };
    this.container = new PIXI.Container();
    this.ledCircle = new PIXI.Graphics();
    this.glowCircle = new PIXI.Graphics();
    this.label = new PIXI.Text();
  }

  /**
   * Create and initialize the LED indicator
   */
  public create(): void {
    this.container.x = this.config.x;
    this.container.y = this.config.y;

    const radius = this.config.radius || 12;

    // Create glow layer (background)
    this.glowCircle.circle(0, 0, radius * 1.8);
    this.glowCircle.fill({ color: this.state.color, alpha: 0 });
    this.container.addChild(this.glowCircle);

    // Create LED circle (main indicator)
    this.ledCircle.circle(0, 0, radius);
    this.ledCircle.fill({ color: 0x333333 }); // Off state
    this.ledCircle.stroke({ width: 2, color: 0x666666 });
    this.container.addChild(this.ledCircle);

    // Create label text
    this.label = new PIXI.Text({
      text: this.config.label,
      style: {
        fontSize: 12,
        fill: 0xcccccc,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.label.anchor.set(0.5, 0);
    this.label.x = 0;
    this.label.y = radius + 5;
    this.container.addChild(this.label);

    // Update to initial state
    this.updateVisual();
  }

  /**
   * Update the LED state
   */
  public setState(newState: Partial<LEDState>): void {
    this.state = { ...this.state, ...newState };
    this.updateVisual();
  }

  /**
   * Turn the LED on
   */
  public turnOn(color?: number, pulsing?: boolean): void {
    this.setState({
      on: true,
      color: color !== undefined ? color : this.state.color,
      pulsing: pulsing !== undefined ? pulsing : this.state.pulsing,
    });
  }

  /**
   * Turn the LED off
   */
  public turnOff(): void {
    this.setState({ on: false, pulsing: false });
  }

  /**
   * Toggle the LED state
   */
  public toggle(): void {
    this.setState({ on: !this.state.on });
  }

  /**
   * Update the visual appearance based on current state
   */
  private updateVisual(): void {
    const radius = this.config.radius || 12;

    this.ledCircle.clear();
    this.glowCircle.clear();

    if (this.state.on) {
      // LED is on - show bright color
      this.ledCircle.circle(0, 0, radius);
      this.ledCircle.fill({ color: this.state.color });
      this.ledCircle.stroke({ width: 2, color: this.brightenColor(this.state.color, 1.5) });

      // Add glow effect
      this.glowCircle.circle(0, 0, radius * 1.8);
      this.glowCircle.fill({ color: this.state.color, alpha: 0.4 });

      // Add inner highlight for 3D effect
      const highlight = new PIXI.Graphics();
      highlight.circle(-radius * 0.3, -radius * 0.3, radius * 0.4);
      highlight.fill({ color: 0xffffff, alpha: 0.6 });
      this.ledCircle.addChild(highlight);
    } else {
      // LED is off - show dark gray
      this.ledCircle.circle(0, 0, radius);
      this.ledCircle.fill({ color: 0x333333 });
      this.ledCircle.stroke({ width: 2, color: 0x666666 });

      // No glow when off
      this.glowCircle.circle(0, 0, radius * 1.8);
      this.glowCircle.fill({ color: this.state.color, alpha: 0 });
    }
  }

  /**
   * Start pulsing animation
   */
  public startPulsing(app: PIXI.Application): void {
    if (this.tickerCallback) return; // Already pulsing

    this.state.pulsing = true;
    this.pulseTime = 0;

    this.tickerCallback = (ticker: PIXI.Ticker) => {
      if (!this.state.pulsing || !this.state.on) return;

      const speed = this.state.pulseSpeed || 2; // Default 2 Hz
      this.pulseTime += ticker.deltaTime * 0.016 * speed; // Convert to seconds

      // Sine wave for smooth pulsing
      const alpha = 0.2 + Math.sin(this.pulseTime * Math.PI * 2) * 0.3;

      // Update glow alpha
      this.glowCircle.clear();
      const radius = this.config.radius || 12;
      this.glowCircle.circle(0, 0, radius * 1.8);
      this.glowCircle.fill({ color: this.state.color, alpha: alpha });
    };

    app.ticker.add(this.tickerCallback);
  }

  /**
   * Stop pulsing animation
   */
  public stopPulsing(app: PIXI.Application): void {
    if (this.tickerCallback) {
      app.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
    this.state.pulsing = false;
    this.updateVisual();
  }

  /**
   * Brighten a color by a factor
   */
  private brightenColor(color: number, factor: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) * factor);
    const g = Math.min(255, ((color >> 8) & 0xff) * factor);
    const b = Math.min(255, (color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
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
      this.stopPulsing(app);
    }
    this.container.destroy({ children: true });
  }
}