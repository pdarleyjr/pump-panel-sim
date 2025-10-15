/**
 * Large Diameter Discharge Card Component
 * Grid of 2.5" discharge lines, deck gun, and rear discharge
 * Properly sized with 30px radius knobs and adequate spacing
 */

import * as PIXI from 'pixi.js';
import { RotaryKnob } from '../controls/RotaryKnob';
import { type ControlEvent } from '../controls/types';
import type { DischargeId } from '../../sim/model';

interface LargeDiameterCardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onChange: (event: ControlEvent) => void;
}

export class LargeDiameterCard {
  private container: PIXI.Container;
  private config: LargeDiameterCardConfig;
  private dischargeKnobs: Map<DischargeId, RotaryKnob> = new Map();

  constructor(config: LargeDiameterCardConfig) {
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
      text: 'LARGE DIAMETER DISCHARGE',
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

    // Create discharge controls grid
    this.createDischargeGrid();
  }

  private createDischargeGrid(): void {
    const discharges: Array<{ id: DischargeId; label: string }> = [
      { id: 'd2_5_a', label: '2½" A' },
      { id: 'd2_5_b', label: '2½" B' },
      { id: 'd2_5_c', label: '2½" C' },
      { id: 'd2_5_d', label: '2½" D' },
      { id: 'deck', label: 'Deck Gun' },
      { id: 'rear_ldh', label: 'Rear LDH' },
    ];

    const cols = 3;
    const rows = 2;
    const knobDiameter = 60; // 30px radius * 2
    const labelHeight = 40; // Space for label + value text
    const totalKnobHeight = knobDiameter + labelHeight;
    // Adjusted horizontal spacing for reduced card width (500px max)
    const horizontalSpacing = Math.max((this.config.width - 80) / cols, knobDiameter + 15);
    const verticalSpacing = Math.max((this.config.height - 40) / rows, totalKnobHeight + 10);
    const startY = 45;

    discharges.forEach((discharge, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = 40 + col * horizontalSpacing + horizontalSpacing / 2;
      const y = startY + row * verticalSpacing;

      const knob = new RotaryKnob(
        {
          id: `discharge_${discharge.id}`,
          type: 'rotary',
          x: x,
          y: y,
          label: discharge.label,
          min: 0,
          max: 100,
          step: 5,
          value: 0,
        },
        this.config.onChange
      );

      knob.create();
      this.container.addChild(knob.getContainer());
      this.dischargeKnobs.set(discharge.id, knob);
    });
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public setDischargeValue(id: DischargeId, value: number): void {
    const knob = this.dischargeKnobs.get(id);
    if (knob) {
      knob.setValue(value);
    }
  }

  public destroy(): void {
    this.dischargeKnobs.forEach(knob => knob.destroy());
    this.dischargeKnobs.clear();
    this.container.destroy({ children: true });
  }
}