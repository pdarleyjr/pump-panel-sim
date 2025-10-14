/**
 * Interactive lever control for throttle and discharge valves
 */

import * as PIXI from 'pixi.js';
import type { ControlConfig, ControlEvent } from './types';
import { createLeverGraphic } from '../graphics/createLeverGraphic';
import {
  expandHitArea,
  addTouchFeedback,
  showTouchFeedback,
  hideTouchFeedback,
  triggerHapticFeedback,
  HapticPatterns,
} from './touchHelpers';

/**
 * Interactive lever control using PixiJS
 * Supports vertical or horizontal dragging
 */
export class Lever {
  private config: ControlConfig;
  private onChange: (event: ControlEvent) => void;
  private container: PIXI.Container;
  private leverGraphic: PIXI.Container;
  private isDragging: boolean = false;
  private currentValue: number;
  private label: PIXI.Text;
  private valueText: PIXI.Text;
  private trackHeight: number = 120;
  private vertical: boolean = true;
  private touchFeedback: PIXI.Graphics | null = null;

  constructor(
    config: ControlConfig,
    onChange: (event: ControlEvent) => void,
    vertical: boolean = true,
    trackHeight: number = 120
  ) {
    this.config = config;
    this.onChange = onChange;
    this.currentValue = config.value;
    this.vertical = vertical;
    this.trackHeight = trackHeight;
    this.container = new PIXI.Container();
    this.leverGraphic = createLeverGraphic(30, trackHeight, 40, 0x6b7280, vertical);
    this.label = new PIXI.Text();
    this.valueText = new PIXI.Text();
  }

  /**
   * Create and initialize the lever sprite and interactions
   */
  public create(): void {
    this.container.x = this.config.x;
    this.container.y = this.config.y;

    // Set up the lever graphic
    this.leverGraphic.x = 0;
    this.leverGraphic.y = 0;
    this.leverGraphic.eventMode = 'static';
    this.leverGraphic.cursor = 'pointer';

    // Add touch feedback for better visual response on tablets
    this.touchFeedback = addTouchFeedback(this.leverGraphic);

    // Expand hit area for WCAG 2.1 touch target compliance (44x44px minimum)
    expandHitArea(this.leverGraphic, 44);

    // Set initial position based on value
    this.updatePosition();

    this.container.addChild(this.leverGraphic);

    // Add label text
    const labelOffset = this.vertical ? -this.trackHeight / 2 - 20 : this.trackHeight / 2 + 20;
    this.label = new PIXI.Text({
      text: this.config.label,
      style: {
        fontSize: 12,
        fill: 0xffffff,
        align: 'center',
      },
    });
    this.label.anchor.set(0.5, this.vertical ? 1 : 0.5);
    this.label.x = 0;
    this.label.y = labelOffset;
    this.container.addChild(this.label);

    // Add value text
    const valueOffset = this.vertical ? this.trackHeight / 2 + 30 : -this.trackHeight / 2 - 30;
    this.valueText = new PIXI.Text({
      text: `${Math.round(this.currentValue)}%`,
      style: {
        fontSize: 14,
        fill: 0x00ff00,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.valueText.anchor.set(0.5, this.vertical ? 0 : 1);
    this.valueText.x = 0;
    this.valueText.y = valueOffset;
    this.container.addChild(this.valueText);

    this.setupInteraction();
  }

  /**
   * Set up pointer event handlers for dragging
   */
  private setupInteraction(): void {
    this.leverGraphic.on('pointerdown', this.onDragStart.bind(this));
    this.leverGraphic.on('pointerup', this.onDragEnd.bind(this));
    this.leverGraphic.on('pointerupoutside', this.onDragEnd.bind(this));
    this.leverGraphic.on('pointermove', this.onDrag.bind(this));
  }

  /**
   * Handle drag start
   */
  private onDragStart(event: PIXI.FederatedPointerEvent): void {
    this.isDragging = true;
    
    // Show visual touch feedback
    if (this.touchFeedback) {
      showTouchFeedback(this.touchFeedback);
    }
    
    // Provide haptic feedback if supported
    triggerHapticFeedback(HapticPatterns.DRAG_START);
    
    this.onDrag(event);
  }

  /**
   * Handle drag end
   */
  private onDragEnd(): void {
    this.isDragging = false;
    
    // Hide visual touch feedback
    if (this.touchFeedback) {
      hideTouchFeedback(this.touchFeedback);
    }
  }

  /**
   * Handle drag movement - calculate position and update value
   */
  private onDrag(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDragging) return;

    // Get the global position
    const globalPos = event.global;
    
    // Convert to local position relative to the container
    const localPos = this.container.toLocal(globalPos);

    let newValue: number;

    if (this.vertical) {
      // Vertical lever: map Y position to value
      // Y increases downward, so we need to invert
      const minY = -this.trackHeight / 2;
      const maxY = this.trackHeight / 2;
      const normalizedPos = (localPos.y - minY) / (maxY - minY);
      
      // Invert so top = max, bottom = min
      const range = this.config.max - this.config.min;
      newValue = this.config.max - (normalizedPos * range);
    } else {
      // Horizontal lever: map X position to value
      const minX = -this.trackHeight / 2;
      const maxX = this.trackHeight / 2;
      const normalizedPos = (localPos.x - minX) / (maxX - minX);
      
      const range = this.config.max - this.config.min;
      newValue = this.config.min + (normalizedPos * range);
    }

    // Apply step if defined
    if (this.config.step) {
      newValue = Math.round(newValue / this.config.step) * this.config.step;
    }

    // Clamp to min/max
    newValue = Math.max(this.config.min, Math.min(this.config.max, newValue));

    // Only update if value changed
    if (newValue !== this.currentValue) {
      this.currentValue = newValue;
      this.updatePosition();
      this.updateValueText();

      // Trigger onChange callback
      this.onChange({
        controlId: this.config.id,
        value: this.currentValue,
      });
    }
  }

  /**
   * Update the visual position based on current value
   */
  private updatePosition(): void {
    const range = this.config.max - this.config.min;
    const normalized = (this.currentValue - this.config.min) / range;

    if (this.vertical) {
      // Invert so max value = top position
      const minY = -this.trackHeight / 2;
      const maxY = this.trackHeight / 2;
      const targetY = maxY - (normalized * (maxY - minY));
      
      // Find the handle within the lever graphic and move it
      if (this.leverGraphic.children.length > 1) {
        this.leverGraphic.children[1].y = targetY;
      }
    } else {
      // Horizontal positioning
      const minX = -this.trackHeight / 2;
      const maxX = this.trackHeight / 2;
      const targetX = minX + (normalized * (maxX - minX));
      
      if (this.leverGraphic.children.length > 1) {
        this.leverGraphic.children[1].x = targetX;
      }
    }
  }

  /**
   * Update the value text display
   */
  private updateValueText(): void {
    this.valueText.text = `${Math.round(this.currentValue)}%`;
  }

  /**
   * Handle keyboard input for control
   */
  public handleKeyboard(key: string, shift: boolean = false, ctrl: boolean = false): boolean {
    let newValue = this.currentValue;
    const step = shift ? 1 : 10; // Fine adjustment with Shift

    switch (key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        newValue = Math.min(this.config.max, this.currentValue + step);
        break;
      case 'arrowdown':
      case 's':
        newValue = Math.max(this.config.min, this.currentValue - step);
        break;
      case 'home':
        if (ctrl) newValue = this.config.min;
        break;
      case 'end':
        if (ctrl) newValue = this.config.max;
        break;
      default:
        return false; // Key not handled
    }

    if (newValue !== this.currentValue) {
      this.currentValue = newValue;
      this.updatePosition();
      this.updateValueText();
      this.onChange({
        controlId: this.config.id,
        value: this.currentValue,
      });
      
      // Provide haptic feedback
      triggerHapticFeedback(HapticPatterns.TICK);
      return true;
    }
    
    return false;
  }

  /**
   * Set keyboard focus state
   */
  public setFocus(focused: boolean): void {
    this.hasFocus = focused;
    if (this.focusIndicator) {
      this.focusIndicator.visible = focused;
      this.focusIndicator.alpha = focused ? 1.0 : 0.3;
    }
  }

  /**
   * Update focus indicator visual
   */
  private updateFocusIndicator(): void {
    if (!this.focusIndicator) return;

    this.focusIndicator.clear();
    
    // Draw focus ring around control
    const padding = 8;
    if (this.vertical) {
      this.focusIndicator.rect(
        -20 - padding,
        -this.trackHeight / 2 - padding,
        40 + padding * 2,
        this.trackHeight + padding * 2
      );
    } else {
      this.focusIndicator.rect(
        -this.trackHeight / 2 - padding,
        -20 - padding,
        this.trackHeight + padding * 2,
        40 + padding * 2
      );
    }
    
    this.focusIndicator.stroke({ width: 2, color: 0x3b82f6 });
  }

  /**
   * Set the lever value programmatically
   */
  public setValue(value: number): void {
    this.currentValue = Math.max(
      this.config.min,
      Math.min(this.config.max, value)
    );
    this.updatePosition();
    this.updateValueText();
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
  public destroy(): void {
    // Remove all event listeners
    this.leverGraphic.removeAllListeners();
    
    // Clear references
    this.touchFeedback = null;
    this.focusIndicator = null;
    
    // Destroy container and all children
    this.container.destroy({ children: true });
  }
}