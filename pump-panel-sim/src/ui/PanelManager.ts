/**
 * Coordinates all UI elements for the pump panel
 * Manages controls, gauges, and their interaction with the simulation
 * UPDATED: 6-card grid-based layout system with overlap detection
 */

import * as PIXI from 'pixi.js';
import type { PumpState, DischargeId, IntakeId } from '../sim/model';
import type { SimulationDiagnostics } from '../sim/engine';
import { type ControlEvent } from './controls/types';
import { RotaryKnob } from './controls/RotaryKnob';
import { Lever } from './controls/Lever';
import { PressureGauge, type GaugeConfig } from './gauges/PressureGauge';
import { PanelLayout } from './PanelLayout';
import { LEDIndicator } from './indicators/LEDIndicator';
import { FlowIndicator } from './indicators/FlowIndicator';
import { StatusBadge } from './indicators/StatusBadge';
import type { LEDIndicatorConfig, FlowIndicatorConfig, StatusBadgeConfig, StatusLevel } from './indicators/types';
import { highlightOverlaps } from './debug/OverlapGuard';

// Import all 6 card components
import { MasterGaugesCard } from './cards/MasterGaugesCard';
import { CrosslayCard } from './cards/CrosslayCard';
import { IntakeCard } from './cards/IntakeCard';
import { LargeDiameterCard } from './cards/LargeDiameterCard';
import { EngineControlsCard } from './cards/EngineControlsCard';
import { TankFoamCard } from './cards/TankFoamCard';

/**
 * Manages all UI elements on the pump panel
 */
export class PanelManager {
  private app: PIXI.Application;
  private onChange: (event: ControlEvent) => void;
  private layout: PanelLayout;
  
  private controls: Map<string, RotaryKnob | Lever> = new Map();
  private gauges: Map<string, PressureGauge> = new Map();
  
  // All 6 card components
  private masterGaugesCard: MasterGaugesCard | null = null;
  private crosslayCard: CrosslayCard | null = null;
  private intakeCard: IntakeCard | null = null;
  private largeDiameterCard: LargeDiameterCard | null = null;
  private engineControlsCard: EngineControlsCard | null = null;
  private tankFoamCard: TankFoamCard | null = null;
  
  // Legacy references (removed as they're now in cards)
  private throttleLever: Lever | null = null;
  private tankToPumpLever: Lever | null = null;
  private primerButton: Lever | null = null;
  private foamPercentKnob: RotaryKnob | null = null;
  private foamSystemToggleLever: Lever | null = null;
  private drvToggleLever: Lever | null = null;
  private drvSetpointKnob: RotaryKnob | null = null;
  private governorToggleLever: Lever | null = null;
  private tankFillRecircKnob: RotaryKnob | null = null;
  
  private waterTankText: PIXI.Text | null = null;
  private foamTankText: PIXI.Text | null = null;
  
  // Master gauges (now in MasterGaugesCard)
  private masterDischargeGauge: PressureGauge | null = null;
  private compoundIntakeGauge: PressureGauge | null = null;
  
  // Water source indicator (now in MasterGaugesCard)
  private waterSourceIndicator: PIXI.Container | null = null;
  private waterSourceText: PIXI.Text | null = null;

  // Visual indicators
  private indicators: Map<string, LEDIndicator | StatusBadge> = new Map();
  private flowIndicators: Map<DischargeId, FlowIndicator> = new Map();
  private pumpEngagedLED: LEDIndicator | null = null;
  private governorModeIndicator: StatusBadge | null = null;

  constructor(app: PIXI.Application, onChange: (event: ControlEvent) => void) {
    this.app = app;
    this.onChange = onChange;
    this.layout = new PanelLayout(app.screen.width, app.screen.height);
  }

  /**
   * Initialize all controls and gauges
   */
  public initialize(): void {
    const layoutConfig = this.layout.getLayout();

    // Create all 6 card components (NEW 6-CARD GRID SYSTEM)
    this.createCardComponents(layoutConfig);

    // Create intake pressure gauges (bottom row, not in cards)
    this.createIntakeGauges(layoutConfig.intakeGauges);

    // Create visual indicators
    this.createIndicators(layoutConfig);
    
    // Verify no overlaps in development mode
    if (import.meta.env.DEV) {
      this.verifyNoOverlaps();
    }
  }

  /**
   * Verify that no UI elements overlap (development only)
   */
  private verifyNoOverlaps(): void {
    const containers: PIXI.Container[] = [];
    
    // Add all card containers
    if (this.masterGaugesCard) containers.push(this.masterGaugesCard.getContainer());
    if (this.crosslayCard) containers.push(this.crosslayCard.getContainer());
    if (this.intakeCard) containers.push(this.intakeCard.getContainer());
    if (this.largeDiameterCard) containers.push(this.largeDiameterCard.getContainer());
    if (this.engineControlsCard) containers.push(this.engineControlsCard.getContainer());
    if (this.tankFoamCard) containers.push(this.tankFoamCard.getContainer());
    
    // Set names on containers for better debugging
    if (this.masterGaugesCard) this.masterGaugesCard.getContainer().name = 'MasterGaugesCard';
    if (this.crosslayCard) this.crosslayCard.getContainer().name = 'CrosslayCard';
    if (this.intakeCard) this.intakeCard.getContainer().name = 'IntakeCard';
    if (this.largeDiameterCard) this.largeDiameterCard.getContainer().name = 'LargeDiameterCard';
    if (this.engineControlsCard) this.engineControlsCard.getContainer().name = 'EngineControlsCard';
    if (this.tankFoamCard) this.tankFoamCard.getContainer().name = 'TankFoamCard';
    
    // Check for overlaps
    const overlapCount = highlightOverlaps(containers);
    
    if (overlapCount === 0) {
      console.log('✅ [PanelManager] Layout verification complete: Zero overlaps detected');
    } else {
      console.error(`❌ [PanelManager] Layout verification failed: ${overlapCount} overlapping pairs detected`);
    }
  }

  /**
   * Create all 6 card components (UPDATED)
   */
  private createCardComponents(layoutConfig: ReturnType<PanelLayout['getLayout']>): void {
    // Card 1 - Master Gauges Card
    this.masterGaugesCard = new MasterGaugesCard({
      x: layoutConfig.cards.masterGauges.x,
      y: layoutConfig.cards.masterGauges.y,
      width: layoutConfig.cards.masterGauges.width,
      height: layoutConfig.cards.masterGauges.height,
    });
    this.masterGaugesCard.create();
    this.app.stage.addChild(this.masterGaugesCard.getContainer());

    // Card 2 - Crosslay/Trashline Card
    this.crosslayCard = new CrosslayCard({
      x: layoutConfig.cards.crosslay.x,
      y: layoutConfig.cards.crosslay.y,
      width: layoutConfig.cards.crosslay.width,
      height: layoutConfig.cards.crosslay.height,
      onChange: this.onChange,
    });
    this.crosslayCard.create();
    this.app.stage.addChild(this.crosslayCard.getContainer());

    // Card 3 - Intake Controls Card
    this.intakeCard = new IntakeCard({
      x: layoutConfig.cards.intake.x,
      y: layoutConfig.cards.intake.y,
      width: layoutConfig.cards.intake.width,
      height: layoutConfig.cards.intake.height,
      onChange: this.onChange,
    });
    this.intakeCard.create();
    this.app.stage.addChild(this.intakeCard.getContainer());

    // Card 4 - Large Diameter Discharge Card
    this.largeDiameterCard = new LargeDiameterCard({
      x: layoutConfig.cards.largeDiameter.x,
      y: layoutConfig.cards.largeDiameter.y,
      width: layoutConfig.cards.largeDiameter.width,
      height: layoutConfig.cards.largeDiameter.height,
      onChange: this.onChange,
    });
    this.largeDiameterCard.create();
    this.app.stage.addChild(this.largeDiameterCard.getContainer());

    // Card 5 - Engine Controls Card
    this.engineControlsCard = new EngineControlsCard({
      x: layoutConfig.cards.engineControls.x,
      y: layoutConfig.cards.engineControls.y,
      width: layoutConfig.cards.engineControls.width,
      height: layoutConfig.cards.engineControls.height,
      onChange: this.onChange,
    });
    this.engineControlsCard.create();
    this.app.stage.addChild(this.engineControlsCard.getContainer());

    // Card 6 - Tank & Foam Card
    this.tankFoamCard = new TankFoamCard({
      x: layoutConfig.cards.tankFoam.x,
      y: layoutConfig.cards.tankFoam.y,
      width: layoutConfig.cards.tankFoam.width,
      height: layoutConfig.cards.tankFoam.height,
      onChange: this.onChange,
    });
    this.tankFoamCard.create();
    this.app.stage.addChild(this.tankFoamCard.getContainer());
  }

  /**
   * Create all visual indicators
   */
  private createIndicators(layoutConfig: ReturnType<PanelLayout['getLayout']>): void {
    // Create pump engaged LED indicator
    const pumpEngagedConfig: LEDIndicatorConfig = {
      id: 'pump_engaged',
      x: layoutConfig.indicators.pumpEngaged.x,
      y: layoutConfig.indicators.pumpEngaged.y,
      label: 'PUMP ENGAGED',
      radius: 15,
      initialState: { on: false, color: 0x00ff00 },
    };
    this.pumpEngagedLED = new LEDIndicator(pumpEngagedConfig);
    this.pumpEngagedLED.create();
    this.app.stage.addChild(this.pumpEngagedLED.getContainer());
    this.indicators.set('pump_engaged', this.pumpEngagedLED);

    // Create governor mode indicator
    const governorModeConfig: StatusBadgeConfig = {
      id: 'governor_mode',
      x: layoutConfig.indicators.governorMode.x,
      y: layoutConfig.indicators.governorMode.y,
      label: 'GOVERNOR MODE',
      status: 'info',
      value: 'PSI',
    };
    this.governorModeIndicator = new StatusBadge(governorModeConfig);
    this.governorModeIndicator.create();
    this.app.stage.addChild(this.governorModeIndicator.getContainer());
    this.indicators.set('governor_mode', this.governorModeIndicator);

    // Create warning badges
    const warningBadges: Array<{ id: string; pos: keyof typeof layoutConfig.indicators; label: string }> = [
      { id: 'tank_low', pos: 'tankLow', label: 'TANK LOW' },
      { id: 'cavitation', pos: 'cavitation', label: 'CAVITATION' },
      { id: 'overpressure', pos: 'overpressure', label: 'OVERPRESSURE' },
      { id: 'temperature', pos: 'temperature', label: 'TEMPERATURE' },
      { id: 'pressure_status', pos: 'pressureStatus', label: 'PRESSURE' },
    ];

    for (const badge of warningBadges) {
      const config: StatusBadgeConfig = {
        id: badge.id,
        x: layoutConfig.indicators[badge.pos].x,
        y: layoutConfig.indicators[badge.pos].y,
        label: badge.label,
        status: 'normal',
        value: 'OK',
      };
      const statusBadge = new StatusBadge(config);
      statusBadge.create();
      statusBadge.setVisible(false); // Hidden by default, shown when relevant
      this.app.stage.addChild(statusBadge.getContainer());
      this.indicators.set(badge.id, statusBadge);
    }

    // Create flow indicators for key discharge lines
    const flowLines: DischargeId[] = ['xlay1', 'xlay2', 'xlay3', 'd2_5_a', 'd2_5_b', 'deck'];
    for (const lineId of flowLines) {
      const pos = layoutConfig.flowIndicators[lineId];
      if (pos) {
        const flowConfig: FlowIndicatorConfig = {
          id: `flow_${lineId}`,
          x: pos.x,
          y: pos.y,
          flowGpm: 0,
          maxFlowGpm: lineId === 'deck' ? 1000 : 250,
        };
        const flowIndicator = new FlowIndicator(flowConfig);
        flowIndicator.create();
        flowIndicator.startAnimation(this.app);
        this.app.stage.addChild(flowIndicator.getContainer());
        this.flowIndicators.set(lineId, flowIndicator);
      }
    }
  }

  /**
   * Create intake pressure gauges
   */
  private createIntakeGauges(positions: Record<IntakeId, { x: number; y: number }>): void {
    const intakeIds: IntakeId[] = ['ldh_driver', 'ldh_officer', 'rear_ldh'];
    const labels = {
      ldh_driver: 'Driver LDH',
      ldh_officer: 'Officer LDH',
      rear_ldh: 'Rear LDH',
    };

    for (const id of intakeIds) {
      const pos = positions[id];
      const config: GaugeConfig = {
        id: `intake_${id}`,
        x: pos.x,
        y: pos.y,
        label: labels[id],
        min: 0,
        max: 200,
        units: 'PSI',
        value: 0,
        radius: this.layout.getGaugeRadius(),
      };

      const gauge = new PressureGauge(config);
      gauge.create();
      this.app.stage.addChild(gauge.getContainer());
      this.gauges.set(`intake_${id}`, gauge);
    }
  }

  /**
   * Update all gauges based on simulation state
   */
  public updateGauges(state: PumpState, diagnostics?: SimulationDiagnostics): void {
    // Update Master Gauges Card
    if (this.masterGaugesCard) {
      this.masterGaugesCard.setMasterDischargePressure(state.dischargePsi);
      
      // Handle compound intake gauge (vacuum vs pressure)
      if (state.waterSource === 'draft' && state.intakeVacuumInHg < 0) {
        this.masterGaugesCard.setCompoundIntakePressure(state.intakeVacuumInHg);
      } else {
        this.masterGaugesCard.setCompoundIntakePressure(state.intakePressurePsi);
      }
      
      this.masterGaugesCard.setRPM(state.engineRpm);
      this.masterGaugesCard.setWaterSource(state.waterSource);
    }

    // Update Tank & Foam Card
    if (this.tankFoamCard) {
      this.tankFoamCard.setWaterTankLevel(state.tankGallons);
      this.tankFoamCard.setFoamTankLevel(state.foam.tankGallons);
    }

    // Update intake pressure gauges
    const intakeIds: IntakeId[] = ['ldh_driver', 'ldh_officer', 'rear_ldh'];
    for (const id of intakeIds) {
      const gauge = this.gauges.get(`intake_${id}`);
      if (gauge) {
        gauge.setValue(state.intakePsi[id] || 0);
      }
    }

    // Update visual indicators
    this.updateIndicators(state, diagnostics);

    // Update flow indicators based on diagnostics
    if (diagnostics?.lineHydraulics) {
      for (const [lineId, flowIndicator] of this.flowIndicators.entries()) {
        const lineData = diagnostics.lineHydraulics.get(lineId);
        if (lineData) {
          flowIndicator.setFlow(lineData.flow || 0);
        }
      }
    }
  }

  /**
   * Update all visual indicators based on simulation state
   */
  private updateIndicators(state: PumpState, diagnostics?: SimulationDiagnostics): void {
    // Update pump engaged LED
    if (this.pumpEngagedLED) {
      if (state.interlocks.engaged) {
        this.pumpEngagedLED.turnOn(0x00ff00, false);
      } else {
        this.pumpEngagedLED.turnOff();
      }
    }

    // Update governor mode indicator
    if (this.governorModeIndicator) {
      const mode = state.runtime.governor;
      this.governorModeIndicator.setValue(mode);
      this.governorModeIndicator.setStatus(mode === 'RPM' ? 'info' : 'normal');
    }

    // Update pressure status badge
    const pressureBadge = this.indicators.get('pressure_status') as StatusBadge;
    if (pressureBadge) {
      const psi = state.dischargePsi;
      let status: StatusLevel = 'normal';
      let value = 'NORMAL';

      if (psi > 350) {
        status = 'critical';
        value = 'CRITICAL';
        pressureBadge.setVisible(true);
        pressureBadge.startFlashing(this.app);
      } else if (psi > 250 || (psi < 50 && psi > 0)) {
        status = 'warning';
        value = 'WARNING';
        pressureBadge.setVisible(true);
        pressureBadge.stopFlashing(this.app);
      } else if (psi > 0) {
        pressureBadge.setVisible(false);
      }

      pressureBadge.setStatus(status, value);
    }

    // Update temperature status badge
    const tempBadge = this.indicators.get('temperature') as StatusBadge;
    if (tempBadge) {
      const pumpTemp = state.pumpTempF;
      const engineTemp = state.engineTempF;
      let status: StatusLevel = 'normal';
      let value = 'NORMAL';

      if (pumpTemp > 250 || engineTemp > 230) {
        status = 'critical';
        value = 'DANGER';
        tempBadge.setVisible(true);
        tempBadge.startFlashing(this.app);
      } else if (pumpTemp > 220 || engineTemp > 210) {
        status = 'warning';
        value = 'ELEVATED';
        tempBadge.setVisible(true);
        tempBadge.stopFlashing(this.app);
      } else {
        tempBadge.setVisible(false);
      }

      tempBadge.setStatus(status, value);
    }

    // Update cavitation warning
    const cavitationBadge = this.indicators.get('cavitation') as StatusBadge;
    if (cavitationBadge) {
      if (state.isCavitating) {
        cavitationBadge.setVisible(true);
        cavitationBadge.setStatus('critical', 'ALERT');
        cavitationBadge.startFlashing(this.app);
      } else {
        cavitationBadge.setVisible(false);
        cavitationBadge.stopFlashing(this.app);
      }
    }

    // Update overpressure warning
    const overpressureBadge = this.indicators.get('overpressure') as StatusBadge;
    if (overpressureBadge) {
      if (state.dischargePsi > 400) {
        overpressureBadge.setVisible(true);
        overpressureBadge.setStatus('critical', 'DANGER');
        overpressureBadge.startFlashing(this.app);
      } else {
        overpressureBadge.setVisible(false);
        overpressureBadge.stopFlashing(this.app);
      }
    }

    // Update tank low warning
    const tankLowBadge = this.indicators.get('tank_low') as StatusBadge;
    if (tankLowBadge) {
      const tankPercent = (state.tankGallons / 500) * 100; // Assuming 500 gal capacity
      if (tankPercent < 20 && state.waterSource === 'tank') {
        tankLowBadge.setVisible(true);
        tankLowBadge.setStatus('warning', `${Math.round(tankPercent)}%`);
      } else {
        tankLowBadge.setVisible(false);
      }
    }

    // Update flow indicators based on discharge pressures
    if (diagnostics?.lineHydraulics) {
      for (const [lineId, flowIndicator] of this.flowIndicators.entries()) {
        const lineData = diagnostics.lineHydraulics.get(lineId);
        if (lineData) {
          flowIndicator.setFlow(lineData.flow || 0);
        }
      }
    }
  }

  /**
   * Handle control change events
   * This can trigger audio/haptic feedback before calling the onChange callback
   */
  public handleControlChange(event: ControlEvent): void {
    // Pass the event to the parent callback
    this.onChange(event);
  }

  /**
   * Update layout for window resize - repositions all cards and controls
   */
  public resize(width: number, height: number): void {
    this.layout.updateDimensions(width, height);
    const layoutConfig = this.layout.getLayout();
    
    // Reposition all 6 cards
    if (this.masterGaugesCard) {
      this.masterGaugesCard.getContainer().x = layoutConfig.cards.masterGauges.x;
      this.masterGaugesCard.getContainer().y = layoutConfig.cards.masterGauges.y;
    }
    
    if (this.crosslayCard) {
      this.crosslayCard.getContainer().x = layoutConfig.cards.crosslay.x;
      this.crosslayCard.getContainer().y = layoutConfig.cards.crosslay.y;
    }
    
    if (this.intakeCard) {
      this.intakeCard.getContainer().x = layoutConfig.cards.intake.x;
      this.intakeCard.getContainer().y = layoutConfig.cards.intake.y;
    }
    
    if (this.largeDiameterCard) {
      this.largeDiameterCard.getContainer().x = layoutConfig.cards.largeDiameter.x;
      this.largeDiameterCard.getContainer().y = layoutConfig.cards.largeDiameter.y;
    }
    
    if (this.engineControlsCard) {
      this.engineControlsCard.getContainer().x = layoutConfig.cards.engineControls.x;
      this.engineControlsCard.getContainer().y = layoutConfig.cards.engineControls.y;
    }
    
    if (this.tankFoamCard) {
      this.tankFoamCard.getContainer().x = layoutConfig.cards.tankFoam.x;
      this.tankFoamCard.getContainer().y = layoutConfig.cards.tankFoam.y;
    }
    
    // Reposition indicators by accessing their containers
    if (this.pumpEngagedLED) {
      const container = this.pumpEngagedLED.getContainer();
      container.x = layoutConfig.indicators.pumpEngaged.x;
      container.y = layoutConfig.indicators.pumpEngaged.y;
    }
    if (this.governorModeIndicator) {
      const container = this.governorModeIndicator.getContainer();
      container.x = layoutConfig.indicators.governorMode.x;
      container.y = layoutConfig.indicators.governorMode.y;
    }
    
    // Reposition flow indicators
    this.flowIndicators.forEach((indicator, lineId) => {
      const pos = layoutConfig.flowIndicators[lineId];
      if (pos) {
        const container = indicator.getContainer();
        container.x = pos.x;
        container.y = pos.y;
      }
    });
  }

  /**
   * Update water source display indicator
   */
  private updateWaterSourceDisplay(state: PumpState): void {
    if (this.waterSourceText) {
      const sourceLabels: Record<typeof state.waterSource, string> = {
        tank: 'TANK',
        hydrant: 'HYDRANT',
        draft: 'DRAFT',
        relay: 'RELAY',
      };
      this.waterSourceText.text = sourceLabels[state.waterSource];
      
      // Color code by source type
      const sourceColors = {
        tank: 0x00ff00,    // Green
        hydrant: 0x00aaff, // Blue
        draft: 0xffaa00,   // Yellow
        relay: 0xff6600,   // Orange
      };
      this.waterSourceText.style.fill = sourceColors[state.waterSource];
    }
  }

  /**
   * Clean up all controls and gauges
   */
  public destroy(): void {
    // Destroy all 6 card components
    if (this.masterGaugesCard) {
      this.masterGaugesCard.destroy(this.app);
      this.masterGaugesCard = null;
    }
    if (this.crosslayCard) {
      this.crosslayCard.destroy();
      this.crosslayCard = null;
    }
    if (this.intakeCard) {
      this.intakeCard.destroy();
      this.intakeCard = null;
    }
    if (this.largeDiameterCard) {
      this.largeDiameterCard.destroy();
      this.largeDiameterCard = null;
    }
    if (this.engineControlsCard) {
      this.engineControlsCard.destroy();
      this.engineControlsCard = null;
    }
    if (this.tankFoamCard) {
      this.tankFoamCard.destroy();
      this.tankFoamCard = null;
    }

    // Destroy all controls
    this.controls.forEach((control) => control.destroy());
    this.controls.clear();

    // Destroy all gauges (passing app for ticker cleanup)
    this.gauges.forEach((gauge) => gauge.destroy(this.app));
    this.gauges.clear();

    // Destroy visual indicators
    this.indicators.forEach((indicator) => indicator.destroy(this.app));
    this.indicators.clear();
    
    // Destroy flow indicators
    this.flowIndicators.forEach((indicator) => indicator.destroy(this.app));
    this.flowIndicators.clear();

    // Clear all legacy references
    this.throttleLever = null;
    this.foamPercentKnob = null;
    this.tankToPumpLever = null;
    this.primerButton = null;
    this.drvToggleLever = null;
    this.drvSetpointKnob = null;
    this.governorToggleLever = null;
    this.tankFillRecircKnob = null;
    this.waterTankText = null;
    this.foamTankText = null;
    this.waterSourceText = null;
    this.masterDischargeGauge = null;
    this.compoundIntakeGauge = null;
    this.waterSourceIndicator = null;
    this.pumpEngagedLED = null;
    this.governorModeIndicator = null;
  }
}