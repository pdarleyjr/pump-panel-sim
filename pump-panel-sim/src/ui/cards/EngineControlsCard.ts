/**
 * Engine Controls Card Component
 * Contains throttle, governor, DRV controls, and pump engagement
 * Positioned at (520, 280) with size 180×260px
 */

import * as PIXI from 'pixi.js';
import { Lever } from '../controls/Lever';
import { RotaryKnob } from '../controls/RotaryKnob';
import { type ControlEvent } from '../controls/types';

interface EngineControlsCardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onChange: (event: ControlEvent) => void;
}

export class EngineControlsCard {
  private container: PIXI.Container;
  private config: EngineControlsCardConfig;
  private throttleLever: Lever | null = null;
  private governorToggle: Lever | null = null;
  private drvToggle: Lever | null = null;
  private drvSetpoint: RotaryKnob | null = null;
  private pumpEngageToggle: Lever | null = null;

  constructor(config: EngineControlsCardConfig) {
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
      text: 'ENGINE CONTROLS',
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

    // Create controls in vertical layout
    this.createThrottle();
    this.createGovernorToggle();
    this.createDRVToggle();
    this.createDRVSetpoint();
    this.createPumpEngageToggle();
  }

  private createThrottle(): void {
    this.throttleLever = new Lever(
      {
        id: 'throttle',
        type: 'lever',
        x: 50,
        y: 50,
        label: 'Throttle',
        min: 0,
        max: 100,
        step: 1,
        value: 0,
      },
      this.config.onChange,
      true, // vertical
      80    // track height
    );

    this.throttleLever.create();
    this.container.addChild(this.throttleLever.getContainer());
  }

  private createGovernorToggle(): void {
    this.governorToggle = new Lever(
      {
        id: 'governor_toggle',
        type: 'lever',
        x: 130,
        y: 50,
        label: 'Gov Mode',
        min: 0,
        max: 1,
        step: 1,
        value: 1, // Default to PRESSURE mode
      },
      this.config.onChange,
      true, // vertical
      60    // track height
    );

    this.governorToggle.create();
    this.container.addChild(this.governorToggle.getContainer());
  }

  private createDRVToggle(): void {
    this.drvToggle = new Lever(
      {
        id: 'drv_toggle',
        type: 'lever',
        x: 50,
        y: 140,
        label: 'Relief Valve',
        min: 0,
        max: 1,
        step: 1,
        value: 1, // Default ON for safety
      },
      this.config.onChange,
      true, // vertical
      60    // track height
    );

    this.drvToggle.create();
    this.container.addChild(this.drvToggle.getContainer());
  }

  private createDRVSetpoint(): void {
    this.drvSetpoint = new RotaryKnob(
      {
        id: 'drv_setpoint',
        type: 'rotary',
        x: 130,
        y: 165,
        label: 'Relief PSI',
        min: 75,
        max: 300,
        step: 5,
        value: 200, // Default 200 PSI
      },
      this.config.onChange
    );

    this.drvSetpoint.create();
    this.container.addChild(this.drvSetpoint.getContainer());
  }

  private createPumpEngageToggle(): void {
    this.pumpEngageToggle = new Lever(
      {
        id: 'pump_engage',
        type: 'lever',
        x: this.config.width / 2,
        y: 230,
        label: 'PUMP ENGAGE',
        min: 0,
        max: 1,
        step: 1,
        value: 0,
      },
      this.config.onChange,
      false, // horizontal
      60     // track width
    );

    this.pumpEngageToggle.create();
    this.container.addChild(this.pumpEngageToggle.getContainer());
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public setThrottle(value: number): void {
    if (this.throttleLever) {
      this.throttleLever.setValue(value);
    }
  }

  public setGovernorMode(mode: number): void {
    if (this.governorToggle) {
      this.governorToggle.setValue(mode);
    }
  }

  public setDRVToggle(enabled: number): void {
    if (this.drvToggle) {
      this.drvToggle.setValue(enabled);
    }
  }

  public setDRVSetpoint(psi: number): void {
    if (this.drvSetpoint) {
      this.drvSetpoint.setValue(psi);
    }
  }

  public setPumpEngage(engaged: number): void {
    if (this.pumpEngageToggle) {
      this.pumpEngageToggle.setValue(engaged);
    }
  }

  public destroy(): void {
    if (this.throttleLever) {
      this.throttleLever.destroy();
    }
    if (this.governorToggle) {
      this.governorToggle.destroy();
    }
    if (this.drvToggle) {
      this.drvToggle.destroy();
    }
    if (this.drvSetpoint) {
      this.drvSetpoint.destroy();
    }
    if (this.pumpEngageToggle) {
      this.pumpEngageToggle.destroy();
    }
    this.container.destroy({ children: true });
  }
}