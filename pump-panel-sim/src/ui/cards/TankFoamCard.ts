/**
 * Tank & Foam Card Component
 * Contains tank displays, tank controls, primer, and foam system controls
 * Positioned at (720, 280) with size 180×180px
 */

import * as PIXI from 'pixi.js';
import { Lever } from '../controls/Lever';
import { RotaryKnob } from '../controls/RotaryKnob';
import { type ControlEvent } from '../controls/types';

interface TankFoamCardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onChange: (event: ControlEvent) => void;
}

export class TankFoamCard {
  private container: PIXI.Container;
  private config: TankFoamCardConfig;
  private waterTankText: PIXI.Text | null = null;
  private foamTankText: PIXI.Text | null = null;
  private tankFillRecircKnob: RotaryKnob | null = null;
  private primerButton: Lever | null = null;
  private foamEnableToggle: Lever | null = null;
  private foamPercentKnob: RotaryKnob | null = null;

  constructor(config: TankFoamCardConfig) {
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
      text: 'TANK & FOAM',
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

    // Create tank level displays
    this.createTankDisplays();

    // Create tank fill/recirc knob
    this.createTankFillRecircKnob();

    // Create primer button
    this.createPrimerButton();

    // Create foam controls
    this.createFoamControls();
  }

  private createTankDisplays(): void {
    // Water tank display
    this.waterTankText = new PIXI.Text({
      text: 'Water: 500 gal',
      style: {
        fontSize: 12,
        fill: 0x00aaff,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.waterTankText.anchor.set(0.5, 0);
    this.waterTankText.x = this.config.width / 2;
    this.waterTankText.y = 30;
    this.container.addChild(this.waterTankText);

    // Foam tank display
    this.foamTankText = new PIXI.Text({
      text: 'Foam: 20 gal',
      style: {
        fontSize: 12,
        fill: 0xff6600,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.foamTankText.anchor.set(0.5, 0);
    this.foamTankText.x = this.config.width / 2;
    this.foamTankText.y = 48;
    this.container.addChild(this.foamTankText);
  }

  private createTankFillRecircKnob(): void {
    this.tankFillRecircKnob = new RotaryKnob(
      {
        id: 'tank_fill_recirc',
        type: 'rotary',
        x: 50,
        y: 90,
        label: 'Fill/Recirc',
        min: 0,
        max: 100,
        step: 5,
        value: 0,
      },
      this.config.onChange
    );

    this.tankFillRecircKnob.create();
    this.container.addChild(this.tankFillRecircKnob.getContainer());
  }

  private createPrimerButton(): void {
    this.primerButton = new Lever(
      {
        id: 'primer',
        type: 'lever',
        x: 130,
        y: 90,
        label: 'PRIMER',
        min: 0,
        max: 1,
        step: 1,
        value: 0,
      },
      this.config.onChange,
      false, // horizontal
      40     // track width
    );

    this.primerButton.create();
    this.container.addChild(this.primerButton.getContainer());
  }

  private createFoamControls(): void {
    // Foam enable toggle
    this.foamEnableToggle = new Lever(
      {
        id: 'foam_enable',
        type: 'lever',
        x: 50,
        y: 145,
        label: 'Foam',
        min: 0,
        max: 1,
        step: 1,
        value: 0,
      },
      this.config.onChange,
      true, // vertical
      40    // track height
    );

    this.foamEnableToggle.create();
    this.container.addChild(this.foamEnableToggle.getContainer());

    // Foam percent knob
    this.foamPercentKnob = new RotaryKnob(
      {
        id: 'foam_percent',
        type: 'rotary',
        x: 130,
        y: 145,
        label: 'Foam %',
        min: 0,
        max: 6,
        step: 0.1,
        value: 0.5,
      },
      this.config.onChange
    );

    this.foamPercentKnob.create();
    this.container.addChild(this.foamPercentKnob.getContainer());
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public setWaterTankLevel(gallons: number): void {
    if (this.waterTankText) {
      this.waterTankText.text = `Water: ${Math.round(gallons)} gal`;
    }
  }

  public setFoamTankLevel(gallons: number): void {
    if (this.foamTankText) {
      this.foamTankText.text = `Foam: ${Math.round(gallons * 10) / 10} gal`;
    }
  }

  public setTankFillRecirc(value: number): void {
    if (this.tankFillRecircKnob) {
      this.tankFillRecircKnob.setValue(value);
    }
  }

  public setPrimer(value: number): void {
    if (this.primerButton) {
      this.primerButton.setValue(value);
    }
  }

  public setFoamEnable(enabled: number): void {
    if (this.foamEnableToggle) {
      this.foamEnableToggle.setValue(enabled);
    }
  }

  public setFoamPercent(percent: number): void {
    if (this.foamPercentKnob) {
      this.foamPercentKnob.setValue(percent);
    }
  }

  public destroy(): void {
    if (this.tankFillRecircKnob) {
      this.tankFillRecircKnob.destroy();
    }
    if (this.primerButton) {
      this.primerButton.destroy();
    }
    if (this.foamEnableToggle) {
      this.foamEnableToggle.destroy();
    }
    if (this.foamPercentKnob) {
      this.foamPercentKnob.destroy();
    }
    this.container.destroy({ children: true });
  }
}