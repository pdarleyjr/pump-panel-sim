/**
 * Flow rate indicator with visual flow representation
 * Shows water flow with animated bars and color coding
 */

import * as PIXI from 'pixi.js';
import type { FlowIndicatorConfig } from './types';

/**
 * Visual indicator for flow rate with animated bars
 */
export class FlowIndicator {
  private config: FlowIndicatorConfig;
  private container: PIXI.Container;
  private flowBars: PIXI.Graphics[] = [];
  private label: PIXI.Text;
  private valueText: PIXI.Text;
  private currentFlowGpm: number = 0;
  private animationOffset: number = 0;
  private tickerCallback: ((delta: PIXI.Ticker) => void) | null = null;

  private readonly barCount: number = 5;
  private readonly barWidth: number = 8;
  private readonly barHeight: number = 40;
  private readonly barSpacing: number = 4;

  constructor(config: FlowIndicatorConfig) {
    this.config = config;
    this.currentFlowGpm = config.flowGpm;
    this.container = new PIXI.Container();
    this.label = new PIXI.Text();
    this.valueText = new PIXI.Text();
  }

  /**
   * Create and initialize the flow indicator
   */
  public create(): void {
    this.container.x = this.config.x;
    this.container.y = this.config.y;

    // Create label
    this.label = new PIXI.Text({
      text: 'FLOW',
      style: {
        fontSize: 10,
        fill: 0xcccccc,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.label.anchor.set(0.5, 1);
    this.label.x = (this.barCount * (this.barWidth + this.barSpacing)) / 2;
    this.label.y = -5;
    this.container.addChild(this.label);

    // Create flow bars
    const totalWidth = this.barCount * (this.barWidth + this.barSpacing);
    for (let i = 0; i < this.barCount; i++) {
      const bar = new PIXI.Graphics();
      bar.x = i * (this.barWidth + this.barSpacing);
      bar.y = 0;
      this.flowBars.push(bar);
      this.container.addChild(bar);
    }

    // Create value text
    this.valueText = new PIXI.Text({
      text: '0 GPM',
      style: {
        fontSize: 12,
        fill: 0x00aaff,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.valueText.anchor.set(0.5, 0);
    this.valueText.x = totalWidth / 2;
    this.valueText.y = this.barHeight + 5;
    this.container.addChild(this.valueText);

    // Initial update
    this.updateVisual();
  }

  /**
   * Set the current flow rate
   */
  public setFlow(flowGpm: number): void {
    this.currentFlowGpm = Math.max(0, flowGpm);
    this.updateVisual();
  }

  /**
   * Update the visual representation
   */
  private updateVisual(): void {
    // Update value text
    this.valueText.text = `${Math.round(this.currentFlowGpm)} GPM`;

    // Determine color based on flow rate
    const normalized = this.currentFlowGpm / this.config.maxFlowGpm;
    const color = this.getFlowColor(normalized);
    this.valueText.style.fill = color;

    // Update bars
    const activeBars = Math.ceil(normalized * this.barCount);
    
    for (let i = 0; i < this.barCount; i++) {
      const bar = this.flowBars[i];
      bar.clear();

      if (i < activeBars) {
        // Active bar - show with gradient effect
        const barAlpha = Math.min(1, (normalized * this.barCount) - i);
        const barColor = this.getFlowColor(Math.min(1, (i + 1) / this.barCount));
        
        bar.rect(0, this.barHeight * (1 - barAlpha), this.barWidth, this.barHeight * barAlpha);
        bar.fill({ color: barColor, alpha: 0.8 });
        bar.stroke({ width: 1, color: barColor });
      } else {
        // Inactive bar - show gray outline
        bar.rect(0, 0, this.barWidth, this.barHeight);
        bar.stroke({ width: 1, color: 0x444444 });
      }
    }
  }

  /**
   * Get color based on flow rate (blue -> cyan -> white)
   */
  private getFlowColor(normalized: number): number {
    if (normalized < 0.3) {
      // Low flow - Blue (0x0066ff)
      return 0x0066ff;
    } else if (normalized < 0.7) {
      // Medium flow - Cyan (0x00ccff)
      return 0x00ccff;
    } else {
      // High flow - White-ish cyan (0x99ffff)
      return 0x99ffff;
    }
  }

  /**
   * Start animated flow effect
   */
  public startAnimation(app: PIXI.Application): void {
    if (this.tickerCallback) return; // Already animating

    this.tickerCallback = (ticker: PIXI.Ticker) => {
      if (this.currentFlowGpm <= 0) return;

      // Animate flow bars moving upward
      this.animationOffset += ticker.deltaTime * 0.05;

      // Create ripple effect on active bars
      const normalized = this.currentFlowGpm / this.config.maxFlowGpm;
      const activeBars = Math.ceil(normalized * this.barCount);

      for (let i = 0; i < activeBars; i++) {
        const bar = this.flowBars[i];
        const phase = (this.animationOffset + i * 0.5) % 1;
        const pulse = 0.8 + Math.sin(phase * Math.PI * 2) * 0.2;

        bar.clear();
        const barAlpha = Math.min(1, (normalized * this.barCount) - i);
        const barColor = this.getFlowColor(Math.min(1, (i + 1) / this.barCount));

        bar.rect(0, this.barHeight * (1 - barAlpha), this.barWidth, this.barHeight * barAlpha);
        bar.fill({ color: barColor, alpha: 0.6 * pulse });
        bar.stroke({ width: 1, color: barColor });
      }
    };

    app.ticker.add(this.tickerCallback);
  }

  /**
   * Stop animation
   */
  public stopAnimation(app: PIXI.Application): void {
    if (this.tickerCallback) {
      app.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
    this.updateVisual(); // Reset to static state
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
      this.stopAnimation(app);
    }
    this.container.destroy({ children: true });
  }
}