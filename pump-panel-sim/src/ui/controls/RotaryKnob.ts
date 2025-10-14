/**
 * Interactive rotary knob control for discharge valves
 */

import * as PIXI from 'pixi.js';
import type { ControlConfig, ControlEvent } from './types';
import { createKnobGraphic } from '../graphics/createKnobGraphic';
import {
  expandCircularHitArea,
  addTouchFeedback,
  showTouchFeedback,
  hideTouchFeedback,
  triggerHapticFeedback,
  HapticPatterns,
} from './touchHelpers';

/**
 * Interactive rotary knob control using PixiJS
 */
export class RotaryKnob {
  private config: ControlConfig;
  private onChange: (event: ControlEvent) => void;
  private container: PIXI.Container;
  private knobGraphic: PIXI.Container;
  private isDragging: boolean = false;
  private currentValue: number;
  private label: PIXI.Text;
  private valueText: PIXI.Text;
  private touchFeedback: PIXI.Graphics | null = null;
  private lastStepValue: number = 0;

  constructor(config: ControlConfig, onChange: (event: ControlEvent) => void) {
    this.config = config;
    this.onChange = onChange;
    this.currentValue = config.value;
    this.container = new PIXI.Container();
    this.knobGraphic = createKnobGraphic(40, 0x4a5568);
    this.label = new PIXI.Text();
    this.valueText = new PIXI.Text();
  }

  /**
   * Create and initialize the knob sprite and interactions
   */
  public create(): void {
    this.container.x = this.config.x;
    this.container.y = this.config.y;

    // Set up the knob graphic
    this.knobGraphic.x = 0;
    this.knobGraphic.y = 0;
    this.knobGraphic.eventMode = 'static';
    this.knobGraphic.cursor = 'pointer';

    // Add touch feedback for better visual response on tablets
    this.touchFeedback = addTouchFeedback(this.knobGraphic, 40);

    // Expand circular hit area for WCAG 2.1 touch target compliance (44x44px minimum)
    expandCircularHitArea(this.knobGraphic, 44);

    // Set initial rotation based on value
    this.updateRotation();

    this.container.addChild(this.knobGraphic);

    // Add label text above knob
    this.label = new PIXI.Text({
      text: this.config.label,
      style: {
        fontSize: 12,
        fill: 0xffffff,
        align: 'center',
      },
    });
    this.label.anchor.set(0.5, 1);
    this.label.x = 0;
    this.label.y = -50;
    this.container.addChild(this.label);

    // Add value text below knob
    this.valueText = new PIXI.Text({
      text: `${Math.round(this.currentValue)}%`,
      style: {
        fontSize: 14,
        fill: 0x00ff00,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.valueText.anchor.set(0.5, 0);
    this.valueText.x = 0;
    this.valueText.y = 50;
    this.container.addChild(this.valueText);

    this.setupInteraction();
  }

  /**
   * Set up pointer event handlers for dragging
   */
  private setupInteraction(): void {
    this.knobGraphic.on('pointerdown', this.onDragStart.bind(this));
    this.knobGraphic.on('pointerup', this.onDragEnd.bind(this));
    this.knobGraphic.on('pointerupoutside', this.onDragEnd.bind(this));
    this.knobGraphic.on('pointermove', this.onDrag.bind(this));
  }

  /**
   * Handle drag start
   */
  private onDragStart(event: PIXI.FederatedPointerEvent): void {
    this.isDragging = true;
    this.lastStepValue = this.currentValue;
    
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
   * Handle drag movement - calculate angle and update value
   */
  private onDrag(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDragging) return;

    // Get the global position
    const globalPos = event.global;
    
    // Convert to local position relative to the knob
    const localPos = this.knobGraphic.toLocal(globalPos);

    // Calculate angle from center
    const angle = Math.atan2(localPos.y, localPos.x);

    // Convert angle to value (0 to max)
    // Normalize angle to 0-2π range
    let normalizedAngle = angle + Math.PI / 2; // Adjust so 0° is up
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

    // Map angle to value range (allow full 360° rotation)
    const range = this.config.max - this.config.min;
    let newValue = (normalizedAngle / (Math.PI * 2)) * range + this.config.min;

    // Apply step if defined
    if (this.config.step) {
      newValue = Math.round(newValue / this.config.step) * this.config.step;
    }

    // Clamp to min/max
    newValue = Math.max(this.config.min, Math.min(this.config.max, newValue));

    // Only update if value changed
    if (newValue !== this.currentValue) {
      this.currentValue = newValue;
      this.updateRotation();
      this.updateValueText();

      // Provide subtle haptic tick when stepping through discrete values
      if (this.config.step && Math.abs(newValue - this.lastStepValue) >= this.config.step) {
        triggerHapticFeedback(HapticPatterns.TICK);
        this.lastStepValue = newValue;
      }

      // Trigger onChange callback
      this.onChange({
        controlId: this.config.id,
        value: this.currentValue,
      });
    }
  }

  /**
   * Update the visual rotation based on current value
   */
  private updateRotation(): void {
    const range = this.config.max - this.config.min;
    const normalized = (this.currentValue - this.config.min) / range;
    this.knobGraphic.rotation = normalized * Math.PI * 2;
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
  public handleKeyboard(key: string, shift: boolean = false): boolean {
    let newValue = this.currentValue;
    const step = shift ? 1 : 10; // Fine adjustment with Shift

    switch (key.toLowerCase()) {
      case '[':
        newValue = Math.max(this.config.min, this.currentValue - step);
        break;
      case ']':
        newValue = Math.min(this.config.max, this.currentValue + step);
        break;
      case 'arrowleft':
        newValue = Math.max(this.config.min, this.currentValue - step);
        break;
      case 'arrowright':
        newValue = Math.min(this.config.max, this.currentValue + step);
        break;
      default:
        return false; // Key not handled
    }

    if (newValue !== this.currentValue) {
      this.currentValue = newValue;
      this.updateRotation();
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
    
    // Draw circular focus ring around knob
    const radius = 44;
    this.focusIndicator.circle(0, 0, radius);
    this.focusIndicator.stroke({ width: 2, color: 0x3b82f6 });
  }

  /**
   * Set the knob value programmatically
   */
  public setValue(value: number): void {
    this.currentValue = Math.max(
      this.config.min,
      Math.min(this.config.max, value)
    );
    this.updateRotation();
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
    this.knobGraphic.removeAllListeners();
    
    // Clear references
    this.touchFeedback = null;
    this.focusIndicator = null;
    
    // Destroy container and all children
    this.container.destroy({ children: true });
  }
}