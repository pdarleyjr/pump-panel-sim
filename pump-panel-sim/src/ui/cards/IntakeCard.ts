/**
 * Intake Controls Card Component
 * Groups intake valves, tank controls, and source selection
 * Properly sized with 60px lever height
 */

import * as PIXI from 'pixi.js';
import { Lever } from '../controls/Lever';
import { type ControlEvent } from '../controls/types';

type WaterSource = 'tank' | 'hydrant' | 'draft';

interface IntakeCardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onChange: (event: ControlEvent) => void;
}

export class IntakeCard {
  private container: PIXI.Container;
  private config: IntakeCardConfig;
  private tankToPumpLever: Lever | null = null;
  private selectedSource: WaterSource = 'tank';
  private sourceButtons: Map<WaterSource, PIXI.Container> = new Map();

  constructor(config: IntakeCardConfig) {
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
      text: 'INTAKE CONTROLS',
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

    // Create tank-to-pump valve
    this.createTankToPumpValve();

    // Create source selector
    this.createSourceSelector();
  }

  private createTankToPumpValve(): void {
    this.tankToPumpLever = new Lever(
      {
        id: 'tank_to_pump',
        type: 'lever',
        x: this.config.width / 2,
        y: 60,
        label: 'Tank-to-Pump',
        min: 0,
        max: 1,
        step: 1,
        value: 0,
      },
      this.config.onChange,
      true, // vertical
      60    // track height (properly sized, was 80px)
    );

    this.tankToPumpLever.create();
    this.container.addChild(this.tankToPumpLever.getContainer());
  }

  private createSourceSelector(): void {
    const selectorY = 110;
    const labelText = new PIXI.Text({
      text: 'WATER SOURCE',
      style: {
        fontSize: 10,
        fill: 0xe0e0e0,
        align: 'center',
      },
    });
    labelText.anchor.set(0.5, 0);
    labelText.x = this.config.width / 2;
    labelText.y = selectorY;
    this.container.addChild(labelText);

    const sources: WaterSource[] = ['tank', 'hydrant', 'draft'];
    const buttonWidth = 50;
    const gap = 6;
    const startX = (this.config.width - (buttonWidth * 3 + gap * 2)) / 2;

    sources.forEach((source, index) => {
      const button = this.createSourceButton(
        source,
        startX + index * (buttonWidth + gap),
        selectorY + 20,
        buttonWidth,
        22
      );
      this.sourceButtons.set(source, button);
      this.container.addChild(button);
    });

    // Set initial selection
    this.updateSourceSelection('tank');
  }

  private createSourceButton(
    source: WaterSource,
    x: number,
    y: number,
    width: number,
    height: number
  ): PIXI.Container {
    const button = new PIXI.Container();
    button.x = x;
    button.y = y;

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, width, height, 3);
    bg.fill({ color: 0x8c8c8c });
    bg.stroke({ width: 1, color: 0xb8b8b8 });
    button.addChild(bg);

    const text = new PIXI.Text({
      text: source.toUpperCase(),
      style: {
        fontSize: 9,
        fill: 0xe0e0e0,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    text.anchor.set(0.5);
    text.x = width / 2;
    text.y = height / 2;
    button.addChild(text);

    // Store references
    (button as any).bg = bg;
    (button as any).text = text;

    // Make interactive
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointerdown', () => this.selectSource(source));

    return button;
  }

  private selectSource(source: WaterSource): void {
    if (this.selectedSource === source) return;
    
    this.selectedSource = source;
    this.updateSourceSelection(source);

    // Notify parent of selection change
    const sourceValues = { tank: 1, hydrant: 2, draft: 3 };
    this.config.onChange({
      controlId: 'water_source',
      value: sourceValues[source],
    });
  }

  private updateSourceSelection(source: WaterSource): void {
    for (const [sourceId, button] of this.sourceButtons.entries()) {
      const bg = (button as any).bg as PIXI.Graphics;
      const text = (button as any).text as PIXI.Text;

      if (sourceId === source) {
        // Active state
        bg.clear();
        bg.roundRect(0, 0, 50, 22, 3);
        bg.fill({ color: 0x00aaff });
        bg.stroke({ width: 1, color: 0x00aaff });
        text.style.fill = 0x000000;
      } else {
        // Inactive state
        bg.clear();
        bg.roundRect(0, 0, 50, 22, 3);
        bg.fill({ color: 0x8c8c8c });
        bg.stroke({ width: 1, color: 0xb8b8b8 });
        text.style.fill = 0xe0e0e0;
      }
    }
  }

  public getContainer(): PIXI.Container {
    return this.container;
  }

  public setSource(source: WaterSource): void {
    this.selectSource(source);
  }

  public setTankToPumpValue(value: number): void {
    if (this.tankToPumpLever) {
      this.tankToPumpLever.setValue(value);
    }
  }

  public destroy(): void {
    if (this.tankToPumpLever) {
      this.tankToPumpLever.destroy();
    }
    this.container.destroy({ children: true });
  }
}