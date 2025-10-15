/**
 * Master Gauges Card Component
 * Contains the three primary gauges: Master Discharge, Compound Intake, and RPM
 * Positioned at (20, 20) with size 280×260px
 */

import * as PIXI from 'pixi.js';
import { PressureGauge, type GaugeConfig } from '../gauges/PressureGauge';

interface MasterGaugesCardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MasterGaugesCard {
  private container: PIXI.Container;
  private config: MasterGaugesCardConfig;
  private masterDischargeGauge: PressureGauge | null = null;
  private compoundIntakeGauge: PressureGauge | null = null;
  private rpmGauge: PressureGauge | null = null;
  private waterSourceText: PIXI.Text | null = null;

  constructor(config: MasterGaugesCardConfig) {
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
      text: 'MASTER GAUGES',
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

    // Create Master Discharge Gauge (225px diameter = 112.5px radius)
    this.createMasterDischargeGauge();

    // Create Compound Intake Gauge (180px diameter = 90px radius)
    this.createCompoundIntakeGauge();

    // Create RPM Gauge (180px diameter = 90px radius)
    this.createRPMGauge();

    // Create water source indicator
    this.createWaterSourceIndicator();
  }

  private createMasterDischargeGauge(): void {
    const gaugeConfig: GaugeConfig = {
      id: 'master_discharge',
      x: this.config.width / 2,
      y: 145,
      label: 'DISCHARGE',
      min: 0,
      max: 400,
      units: 'PSI',
      value: 0,
      radius: 112.5, // 225px diameter
      isMaster: true,
      dangerZone: {
        startValue: 350,
        endValue: 450,
        warningThreshold: 350,
      },
    };

    this.masterDischargeGauge = new PressureGauge(gaugeConfig);
    this.masterDischargeGauge.create();
    this.container.addChild(this.masterDischargeGauge.getContainer());
  }

  private createCompoundIntakeGauge(): void {
    const gaugeConfig: GaugeConfig = {
      id: 'compound_intake',
      x: 70,
      y: 50,
      label: 'INTAKE',
      min: -30, // -30 inHg vacuum
      max: 100, // 100 PSI pressure
      units: 'PSI',
      value: 0,
      radius: 90, // 180px diameter
      isMaster: false,
      compound: {
        centerValue: 0,
        negativeUnits: 'inHg',
        positiveUnits: 'PSI',
      },
    };

    this.compoundIntakeGauge = new PressureGauge(gaugeConfig);
    this.compoundIntakeGauge.create();
    this.container.addChild(this.compoundIntakeGauge.getContainer());
  }

  private createRPMGauge(): void {
    const gaugeConfig: GaugeConfig = {
      id: 'rpm_gauge',
      x: 210,
      y: 50,
      label: 'RPM',
      min: 0,
      max: 3000,
      units: 'RPM',
      value: 0,
      radius: 90, // 180px diameter
      isMaster: false,
    };

    this.rpmGauge = new PressureGauge(gaugeConfig);
    this.rpmGauge.create();
    this.container.addChild(this.rpmGauge.getContainer());
  }

  private createWaterSourceIndicator(): void {
    // Position below compound intake gauge
    const indicatorX = 70;
    const indicatorY = 140;

    // Source value text
    this.waterSourceText = new PIXI.Text({
      text: 'TANK',
      style: {
        fontSize: 12,
        fill: 0x00ff00,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.waterSourceText.anchor.set(0.5);
    this.waterSourceText.x = indicatorX;
    this.waterSourceText.y = indicatorY;
    this.container.addChild(this.waterSourceText);
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public setMasterDischargePressure(psi: number): void {
    if (this.masterDischargeGauge) {
      this.masterDischargeGauge.setValue(psi);
    }
  }

  public setCompoundIntakePressure(value: number): void {
    if (this.compoundIntakeGauge) {
      this.compoundIntakeGauge.setValue(value);
    }
  }

  public setRPM(rpm: number): void {
    if (this.rpmGauge) {
      this.rpmGauge.setValue(rpm);
    }
  }

  public setWaterSource(source: 'tank' | 'hydrant' | 'draft' | 'relay'): void {
    if (this.waterSourceText) {
      const sourceLabels: Record<typeof source, string> = {
        tank: 'TANK',
        hydrant: 'HYDRANT',
        draft: 'DRAFT',
        relay: 'RELAY',
      };
      this.waterSourceText.text = sourceLabels[source];
      
      // Color code by source type
      const sourceColors = {
        tank: 0x00ff00,    // Green
        hydrant: 0x00aaff, // Blue
        draft: 0xffaa00,   // Yellow
        relay: 0xff6600,   // Orange
      };
      this.waterSourceText.style.fill = sourceColors[source];
    }
  }

  public destroy(app?: PIXI.Application): void {
    if (this.masterDischargeGauge) {
      this.masterDischargeGauge.destroy(app);
    }
    if (this.compoundIntakeGauge) {
      this.compoundIntakeGauge.destroy(app);
    }
    if (this.rpmGauge) {
      this.rpmGauge.destroy(app);
    }
    this.container.destroy({ children: true });
  }
}