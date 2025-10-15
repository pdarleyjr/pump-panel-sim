/**
 * Crosslay/Trashline Unified Card Component
 * Single component with 4-way selector and integrated controls
 * Properly sized with 30px radius knobs and gauges
 */

import * as PIXI from 'pixi.js';
import { RotaryKnob } from '../controls/RotaryKnob';
import { PressureGauge, type GaugeConfig } from '../gauges/PressureGauge';
import { type ControlEvent } from '../controls/types';

type CrosslayOption = 'xlay1' | 'xlay2' | 'xlay3' | 'trash';

interface CrosslayCardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onChange: (event: ControlEvent) => void;
}

interface OptionButton extends PIXI.Container {
  bg: PIXI.Graphics;
  text: PIXI.Text;
}

export class CrosslayCard {
  private container: PIXI.Container;
  private config: CrosslayCardConfig;
  private selectedOption: CrosslayOption = 'xlay1';
  private valveKnob: RotaryKnob | null = null;
  private gauge: PressureGauge | null = null;
  private optionButtons: Map<CrosslayOption, OptionButton> = new Map();

  constructor(config: CrosslayCardConfig) {
    this.config = config;
    this.container = new PIXI.Container();
    this.container.x = config.x;
    this.container.y = config.y;
  }

  public create(): void {
    // Create card background
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, this.config.width, this.config.height, 8);
    bg.fill({ color: 0x323232, alpha: 0.85 });
    bg.stroke({ width: 2, color: 0x606060 });
    this.container.addChild(bg);

    // Create title
    const title = new PIXI.Text({
      text: 'CROSSLAY / TRASH',
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    title.anchor.set(0.5, 0);
    title.x = this.config.width / 2;
    title.y = 10;
    this.container.addChild(title);

    // Create 4-way selector
    this.createSelector();

    // Create integrated gauge
    this.createGauge();

    // Create valve control knob
    this.createValveKnob();
  }

  private createSelector(): void {
    const selectorY = 35;
    const buttonWidth = (this.config.width - 60) / 2;
    const buttonHeight = 25;
    const gap = 8;

    const options: Array<{ id: CrosslayOption; label: string; row: number; col: number }> = [
      { id: 'xlay1', label: 'NO. 1', row: 0, col: 0 },
      { id: 'xlay2', label: 'NO. 2', row: 0, col: 1 },
      { id: 'xlay3', label: 'NO. 3', row: 1, col: 0 },
      { id: 'trash', label: 'TRASH', row: 1, col: 1 },
    ];

    for (const option of options) {
      const btnX = 20 + option.col * (buttonWidth + gap);
      const btnY = selectorY + option.row * (buttonHeight + gap);

      const button = this.createOptionButton(option.id, option.label, btnX, btnY, buttonWidth, buttonHeight);
      this.optionButtons.set(option.id, button);
      this.container.addChild(button);
    }

    // Set initial selection
    this.updateSelection('xlay1');
  }

  private createOptionButton(
    id: CrosslayOption,
    label: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): OptionButton {
    const button = new PIXI.Container() as OptionButton;
    button.x = x;
    button.y = y;

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, width, height, 4);
    bg.fill({ color: 0x8c8c8c });
    bg.stroke({ width: 2, color: 0xb8b8b8 });
    button.addChild(bg);

    const text = new PIXI.Text({
      text: label,
      style: {
        fontSize: 12,
        fill: 0xe0e0e0,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    text.anchor.set(0.5);
    text.x = width / 2;
    text.y = height / 2;
    button.addChild(text);

    // Store references for styling updates
    button.bg = bg;
    button.text = text;

    // Make interactive
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerdown', () => this.selectOption(id));

    return button;
  }

  private selectOption(option: CrosslayOption): void {
    if (this.selectedOption === option) return;
    
    this.selectedOption = option;
    this.updateSelection(option);

    // Notify parent of selection change
    this.config.onChange({
      controlId: 'crosslay_selector',
      value: this.getOptionValue(option),
    });
  }

  private updateSelection(option: CrosslayOption): void {
    // Update all button styles
    for (const [optionId, button] of this.optionButtons.entries()) {
      const bg = button.bg;
      const text = button.text;

      if (optionId === option) {
        // Active state
        bg.clear();
        bg.roundRect(0, 0, (this.config.width - 60) / 2, 25, 4);
        bg.fill({ color: 0x00ff00 });
        bg.stroke({ width: 2, color: 0x00ff00 });
        text.style.fill = 0x000000;
      } else {
        // Inactive state
        bg.clear();
        bg.roundRect(0, 0, (this.config.width - 60) / 2, 25, 4);
        bg.fill({ color: 0x8c8c8c });
        bg.stroke({ width: 2, color: 0xb8b8b8 });
        text.style.fill = 0xe0e0e0;
      }
    }
  }

  private getOptionValue(option: CrosslayOption): number {
    const map = { xlay1: 1, xlay2: 2, xlay3: 3, trash: 4 };
    return map[option];
  }

  private createGauge(): void {
    const gaugeConfig: GaugeConfig = {
      id: 'crosslay_gauge',
      x: this.config.width / 2,
      y: 105,
      label: '',
      min: 0,
      max: 200,
      units: 'PSI',
      value: 0,
      radius: 30, // 60px diameter gauge
    };

    this.gauge = new PressureGauge(gaugeConfig);
    this.gauge.create();
    this.container.addChild(this.gauge.getContainer());
  }

  private createValveKnob(): void {
    this.valveKnob = new RotaryKnob(
      {
        id: 'crosslay_valve',
        type: 'rotary',
        x: this.config.width / 2,
        y: 105,
        label: 'VALVE',
        min: 0,
        max: 100,
        step: 5,
        value: 0,
      },
      this.config.onChange
    );

    this.valveKnob.create();
    this.container.addChild(this.valveKnob.getContainer());
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public setValue(option: CrosslayOption, pressure: number, valvePosition: number): void {
    this.selectOption(option);
    if (this.gauge) {
      this.gauge.setValue(pressure);
    }
    if (this.valveKnob) {
      this.valveKnob.setValue(valvePosition);
    }
  }

  public destroy(): void {
    if (this.gauge) {
      this.gauge.destroy();
    }
    if (this.valveKnob) {
      this.valveKnob.destroy();
    }
    this.container.destroy({ children: true });
  }
}