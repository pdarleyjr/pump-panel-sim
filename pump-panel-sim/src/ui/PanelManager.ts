/**
 * Coordinates all UI elements for the pump panel
 * Manages controls, gauges, and their interaction with the simulation
 * UPDATED: Card-based redesign with 25% size reduction
 */

import * as PIXI from 'pixi.js';
import type { PumpState, DischargeId, IntakeId } from '../sim/model';
import type { SimulationDiagnostics } from '../sim/engine';
import { ControlType, type ControlEvent } from './controls/types';
import { RotaryKnob } from './controls/RotaryKnob';
import { Lever } from './controls/Lever';
import { PressureGauge, type GaugeConfig } from './gauges/PressureGauge';
import { PanelLayout } from './PanelLayout';
import { LEDIndicator } from './indicators/LEDIndicator';
import { FlowIndicator } from './indicators/FlowIndicator';
import { StatusBadge } from './indicators/StatusBadge';
import type { LEDIndicatorConfig, FlowIndicatorConfig, StatusBadgeConfig, StatusLevel } from './indicators/types';

// Import card components
import { CrosslayCard } from './cards/CrosslayCard';
import { IntakeCard } from './cards/IntakeCard';
import { LargeDiameterCard } from './cards/LargeDiameterCard';

/**
 * Manages all UI elements on the pump panel
 */
export class PanelManager {
  private app: PIXI.Application;
  private onChange: (event: ControlEvent) => void;
  private layout: PanelLayout;
  
  private controls: Map<string, RotaryKnob | Lever> = new Map();
  private gauges: Map<string, PressureGauge> = new Map();
  
  // Card components
  private crosslayCard: CrosslayCard | null = null;
  private intakeCard: IntakeCard | null = null;
  private largeDiameterCard: LargeDiameterCard | null = null;
  
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
  
  // Master gauges
  private masterDischargeGauge: PressureGauge | null = null;
  private compoundIntakeGauge: PressureGauge | null = null;
  
  // Water source indicator
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

    // Create master gauges first (most prominent)
    this.createMasterDischargeGauge(layoutConfig.masterDischarge);
    this.createCompoundIntakeGauge(layoutConfig.compoundIntake);
    
    // Create water source indicator
    this.createWaterSourceIndicator(layoutConfig.compoundIntake);

    // Create card components (NEW CARD-BASED DESIGN)
    this.createCardComponents(layoutConfig);

    // Create intake pressure gauges (not in cards)
    this.createIntakeGauges(layoutConfig.intakeGauges);

    // Create throttle control (independent, not in card)
    this.createThrottle(layoutConfig.throttle);

    // Create primer button control
    this.createPrimerButton(layoutConfig.primer);

    // Create foam controls
    this.createFoamControls(layoutConfig.foamPercent);

    // Create tank level displays
    this.createTankDisplays(layoutConfig.waterTank, layoutConfig.foamTank);

    // Create DRV controls (independent, not in card)
    this.createDRVControls(layoutConfig.drvToggle, layoutConfig.drvSetpoint);

    // Create governor mode toggle
    this.createGovernorToggle(layoutConfig.throttle);

    // Create tank fill/recirculation control
    this.createTankFillRecircControl(layoutConfig.tankFillRecirc);

    // Create visual indicators
    this.createIndicators(layoutConfig);
  }

  /**
   * Create card components (NEW)
   */
  private createCardComponents(layoutConfig: ReturnType<PanelLayout['getLayout']>): void {
    // Create Crosslay/Trashline Unified Card
    this.crosslayCard = new CrosslayCard({
      x: layoutConfig.cards.crosslay.x,
      y: layoutConfig.cards.crosslay.y,
      width: layoutConfig.cards.crosslay.width,
      height: layoutConfig.cards.crosslay.height,
      onChange: this.onChange,
    });
    this.crosslayCard.create();
    this.app.stage.addChild(this.crosslayCard.getContainer());

    // Create Intake Controls Card
    this.intakeCard = new IntakeCard({
      x: layoutConfig.cards.intake.x,
      y: layoutConfig.cards.intake.y,
      width: layoutConfig.cards.intake.width,
      height: layoutConfig.cards.intake.height,
      onChange: this.onChange,
    });
    this.intakeCard.create();
    this.app.stage.addChild(this.intakeCard.getContainer());

    // Create Large Diameter Discharge Card
    this.largeDiameterCard = new LargeDiameterCard({
      x: layoutConfig.cards.largeDiameter.x,
      y: layoutConfig.cards.largeDiameter.y,
      width: layoutConfig.cards.largeDiameter.width,
      height: layoutConfig.cards.largeDiameter.height,
      onChange: this.onChange,
    });
    this.largeDiameterCard.create();
    this.app.stage.addChild(this.largeDiameterCard.getContainer());
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
   * Create master discharge pressure gauge
   */
  private createMasterDischargeGauge(position: { x: number; y: number }): void {
    const config: GaugeConfig = {
      id: 'master_discharge',
      x: position.x,
      y: position.y,
      label: 'DISCHARGE PRESSURE',
      min: 0,
      max: 400,
      units: 'PSI',
      value: 0,
      radius: 150, // Larger than regular gauges
      isMaster: true,
      dangerZone: {
        startValue: 350,
        endValue: 450,
        warningThreshold: 350,
      },
    };

    this.masterDischargeGauge = new PressureGauge(config);
    this.masterDischargeGauge.create();
    this.app.stage.addChild(this.masterDischargeGauge.getContainer());
    this.gauges.set('master_discharge', this.masterDischargeGauge);
  }

  /**
   * Create compound intake gauge (shows both PSI and vacuum)
   */
  private createCompoundIntakeGauge(position: { x: number; y: number }): void {
    const config: GaugeConfig = {
      id: 'compound_intake',
      x: position.x,
      y: position.y,
      label: 'INTAKE PRESSURE/VACUUM',
      min: -30, // -30 inHg vacuum
      max: 100, // 100 PSI pressure
      units: 'PSI',
      value: 0,
      radius: 120,
      isMaster: true,
      compound: {
        centerValue: 0,
        negativeUnits: 'inHg',
        positiveUnits: 'PSI',
      },
    };

    this.compoundIntakeGauge = new PressureGauge(config);
    this.compoundIntakeGauge.create();
    this.app.stage.addChild(this.compoundIntakeGauge.getContainer());
    this.gauges.set('compound_intake', this.compoundIntakeGauge);
  }

  /**
   * Create water source status indicator
   */
  private createWaterSourceIndicator(intakePosition: { x: number; y: number }): void {
    this.waterSourceIndicator = new PIXI.Container();
    this.waterSourceIndicator.x = intakePosition.x;
    this.waterSourceIndicator.y = intakePosition.y + 180; // Below compound intake gauge

    // Background box
    const bg = new PIXI.Graphics();
    bg.roundRect(-80, -20, 160, 40, 5);
    bg.fill({ color: 0x2a2a2a, alpha: 0.8 });
    bg.stroke({ width: 2, color: 0x00ff00 });
    this.waterSourceIndicator.addChild(bg);

    // Label text
    const label = new PIXI.Text({
      text: 'WATER SOURCE:',
      style: {
        fontSize: 12,
        fill: 0xcccccc,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    label.anchor.set(0.5, 1);
    label.x = 0;
    label.y = -5;
    this.waterSourceIndicator.addChild(label);

    // Source value text
    this.waterSourceText = new PIXI.Text({
      text: 'TANK',
      style: {
        fontSize: 16,
        fill: 0x00ff00,
        align: 'center',
        fontWeight: 'bold',
      },
    });
    this.waterSourceText.anchor.set(0.5, 0);
    this.waterSourceText.x = 0;
    this.waterSourceText.y = 0;
    this.waterSourceIndicator.addChild(this.waterSourceText);

    this.app.stage.addChild(this.waterSourceIndicator);
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
   * Create throttle control (large lever)
   */
  private createThrottle(position: { x: number; y: number }): void {
    this.throttleLever = new Lever(
      {
        id: 'throttle',
        type: 'lever',
        x: position.x,
        y: position.y,
        label: 'Throttle',
        min: 0,
        max: 100,
        step: 1,
        value: 0,
      },
      this.onChange,
      true, // vertical
      120   // larger track height for throttle (reduced from 150)
    );

    this.throttleLever.create();
    this.app.stage.addChild(this.throttleLever.getContainer());
    this.controls.set('throttle', this.throttleLever);
  }

  /**
   * Create tank-to-pump valve control (lever)
   */
  private createTankToPumpValve(position: { x: number; y: number }): void {
    this.tankToPumpLever = new Lever(
      {
        id: 'tank_to_pump',
        type: ControlType.Lever,
        x: position.x,
        y: position.y,
        label: 'Tank-to-Pump',
        min: 0,
        max: 1,
        step: 1,
        value: 0,
      },
      this.onChange,
      true, // vertical
      80    // track height
    );

    this.tankToPumpLever.create();
    this.app.stage.addChild(this.tankToPumpLever.getContainer());
    this.controls.set('tank_to_pump', this.tankToPumpLever);
  }

  /**
   * Create primer button control (momentary push button)
   */
  private createPrimerButton(position: { x: number; y: number }): void {
    this.primerButton = new Lever(
      {
        id: 'primer',
        type: 'lever',
        x: position.x,
        y: position.y,
        label: 'PRIMER',
        min: 0,
        max: 1,
        step: 1,
        value: 0,
      },
      this.onChange,
      false, // horizontal
      45     // track width for button (reduced from 60)
    );

    this.primerButton.create();
    this.app.stage.addChild(this.primerButton.getContainer());
    this.controls.set('primer', this.primerButton);
  }

  /**
   * Create foam controls (percentage knob)
   */
  private createFoamControls(position: { x: number; y: number }): void {
    this.foamPercentKnob = new RotaryKnob(
      {
        id: 'foam_percent',
        type: ControlType.Rotary,
        x: position.x,
        y: position.y,
        label: 'Foam %',
        min: 0,
        max: 6,
        step: 0.1,
        value: 0.5,
      },
      this.onChange
    );

    this.foamPercentKnob.create();
    this.app.stage.addChild(this.foamPercentKnob.getContainer());
    this.controls.set('foam_percent', this.foamPercentKnob);
  }

  /**
   * Create DRV controls (toggle and setpoint knob)
   */
  private createDRVControls(
    togglePos: { x: number; y: number },
    setpointPos: { x: number; y: number }
  ): void {
    // DRV toggle control (ON/OFF)
    this.drvToggleLever = new Lever(
      {
        id: 'drv_toggle',
        type: 'lever',
        x: togglePos.x,
        y: togglePos.y,
        label: 'RELIEF VALVE',
        min: 0,
        max: 1,
        step: 1,
        value: 1, // Default ON for safety
      },
      this.onChange,
      true, // vertical
      60    // track height (reduced from 80)
    );

    this.drvToggleLever.create();
    this.app.stage.addChild(this.drvToggleLever.getContainer());
    this.controls.set('drv_toggle', this.drvToggleLever);

    // DRV setpoint knob (75-300 PSI)
    this.drvSetpointKnob = new RotaryKnob(
      {
        id: 'drv_setpoint',
        type: 'rotary',
        x: setpointPos.x,
        y: setpointPos.y,
        label: 'RELIEF PSI',
        min: 75,
        max: 300,
        step: 5,
        value: 200, // Default 200 PSI
      },
      this.onChange
    );

    this.drvSetpointKnob.create();
    this.app.stage.addChild(this.drvSetpointKnob.getContainer());
    this.controls.set('drv_setpoint', this.drvSetpointKnob);
  }

  /**
   * Create governor mode toggle control (RPM / PRESSURE)
   */
  private createGovernorToggle(throttlePosition: { x: number; y: number }): void {
    // Position governor toggle near throttle control
    this.governorToggleLever = new Lever(
      {
        id: 'governor_toggle',
        type: 'lever',
        x: throttlePosition.x + 80, // Position to the right of throttle (reduced offset)
        y: throttlePosition.y,
        label: 'GOV: RPM/PSI',
        min: 0,
        max: 1,
        step: 1,
        value: 1, // Default to PRESSURE mode (1)
      },
      this.onChange,
      true, // vertical
      60    // track height (reduced from 80)
    );

    this.governorToggleLever.create();
    this.app.stage.addChild(this.governorToggleLever.getContainer());
    this.controls.set('governor_toggle', this.governorToggleLever);
  }

  /**
   * Create tank fill/recirculation control (rotary knob)
   */
  private createTankFillRecircControl(tankPosition: { x: number; y: number }): void {
    // Position near tank-to-pump valve
    this.tankFillRecircKnob = new RotaryKnob(
      {
        id: 'tank_fill_recirc',
        type: 'rotary',
        x: tankPosition.x,
        y: tankPosition.y,
        label: 'TANK FILL/RECIRC',
        min: 0,
        max: 100,
        step: 5,
        value: 0,
      },
      this.onChange
    );

    this.tankFillRecircKnob.create();
    this.app.stage.addChild(this.tankFillRecircKnob.getContainer());
    this.controls.set('tank_fill_recirc', this.tankFillRecircKnob);
  }

  /**
   * Create tank level displays
   */
  private createTankDisplays(
    waterPos: { x: number; y: number },
    foamPos: { x: number; y: number }
  ): void {
    // Water tank display
    this.waterTankText = new PIXI.Text({
      text: 'Water: 500 gal',
      style: {
        fontSize: 16,
        fill: 0x00aaff,
        align: 'right',
        fontWeight: 'bold',
      },
    });
    this.waterTankText.anchor.set(1, 0.5);
    this.waterTankText.x = waterPos.x;
    this.waterTankText.y = waterPos.y;
    this.app.stage.addChild(this.waterTankText);

    // Foam tank display
    this.foamTankText = new PIXI.Text({
      text: 'Foam: 20 gal',
      style: {
        fontSize: 16,
        fill: 0xff6600,
        align: 'right',
        fontWeight: 'bold',
      },
    });
    this.foamTankText.anchor.set(1, 0.5);
    this.foamTankText.x = foamPos.x;
    this.foamTankText.y = foamPos.y;
    this.app.stage.addChild(this.foamTankText);
  }

  /**
   * Update all gauges based on simulation state
   */
  public updateGauges(state: PumpState, diagnostics?: SimulationDiagnostics): void {
    // Update master discharge gauge
    if (this.masterDischargeGauge) {
      this.masterDischargeGauge.setValue(state.dischargePsi);
    }

    // Update compound intake gauge (handles both positive PSI and negative vacuum)
    if (this.compoundIntakeGauge) {
      // If in draft mode with vacuum, use negative value
      if (state.waterSource === 'draft' && state.intakeVacuumInHg < 0) {
        this.compoundIntakeGauge.setValue(state.intakeVacuumInHg);
      } else {
        // Otherwise use positive pressure
        this.compoundIntakeGauge.setValue(state.intakePressurePsi);
      }
    }

    // Update water source indicator
    this.updateWaterSourceDisplay(state);

    // Update intake pressure gauges
    const intakeIds: IntakeId[] = ['ldh_driver', 'ldh_officer', 'rear_ldh'];
    for (const id of intakeIds) {
      const gauge = this.gauges.get(`intake_${id}`);
      if (gauge) {
        gauge.setValue(state.intakePsi[id] || 0);
      }
    }

    // Update tank displays
    if (this.waterTankText) {
      this.waterTankText.text = `Water: ${Math.round(state.tankGallons)} gal`;
    }
    if (this.foamTankText) {
      this.foamTankText.text = `Foam: ${Math.round(state.foam.tankGallons * 10) / 10} gal`;
    }

    // Update visual indicators
    this.updateIndicators(state, diagnostics);

    // Could add more gauge updates here (flow rates, etc.) if diagnostics is provided
    if (diagnostics) {
      // Example: Update discharge flow indicators based on line hydraulics
      // This would require additional gauge displays
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
        const lineData = diagnostics.lineHydraulics[lineId];
        if (lineData) {
          flowIndicator.setFlow(lineData.flowGpm || 0);
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
   * Update layout for window resize - repositions all controls
   */
  public resize(width: number, height: number): void {
    this.layout.updateDimensions(width, height);
    const layoutConfig = this.layout.getLayout();
    
    // Reposition all controls
    this.controls.forEach((control, id) => {
      if (id === 'throttle' && this.throttleLever) {
        this.throttleLever.setPosition(layoutConfig.throttle.x, layoutConfig.throttle.y);
      } else if (id === 'tank_to_pump' && this.tankToPumpLever) {
        this.tankToPumpLever.setPosition(layoutConfig.tankToPump.x, layoutConfig.tankToPump.y);
      } else if (id === 'primer' && this.primerButton) {
        this.primerButton.setPosition(layoutConfig.primer.x, layoutConfig.primer.y);
      } else if (id === 'foam_percent' && this.foamPercentKnob) {
        this.foamPercentKnob.setPosition(layoutConfig.foamPercent.x, layoutConfig.foamPercent.y);
      } else if (id === 'drv_toggle' && this.drvToggleLever) {
        this.drvToggleLever.setPosition(layoutConfig.drvToggle.x, layoutConfig.drvToggle.y);
      } else if (id === 'drv_setpoint' && this.drvSetpointKnob) {
        this.drvSetpointKnob.setPosition(layoutConfig.drvSetpoint.x, layoutConfig.drvSetpoint.y);
      } else if (id === 'governor_toggle' && this.governorToggleLever) {
        const throttleScaled = layoutConfig.throttle;
        this.governorToggleLever.setPosition(throttleScaled.x + 100, throttleScaled.y);
      } else if (id === 'tank_fill_recirc' && this.tankFillRecircKnob) {
        this.tankFillRecircKnob.setPosition(layoutConfig.tankFillRecirc.x, layoutConfig.tankFillRecirc.y);
      } else if (id.startsWith('discharge_')) {
        const dischargeId = id.replace('discharge_', '') as DischargeId;
        const pos = layoutConfig.dischargeValves[dischargeId];
        if (pos) {
          control.setPosition(pos.x, pos.y);
        }
      }
    });
    
    // Reposition all gauges
    if (this.masterDischargeGauge) {
      this.masterDischargeGauge.setPosition(layoutConfig.masterDischarge.x, layoutConfig.masterDischarge.y);
    }
    if (this.compoundIntakeGauge) {
      this.compoundIntakeGauge.setPosition(layoutConfig.compoundIntake.x, layoutConfig.compoundIntake.y);
    }
    
    // Reposition water source indicator
    if (this.waterSourceIndicator) {
      this.waterSourceIndicator.x = layoutConfig.compoundIntake.x;
      this.waterSourceIndicator.y = layoutConfig.compoundIntake.y + 180;
    }
    
    // Reposition tank displays
    if (this.waterTankText) {
      this.waterTankText.x = layoutConfig.waterTank.x;
      this.waterTankText.y = layoutConfig.waterTank.y;
    }
    if (this.foamTankText) {
      this.foamTankText.x = layoutConfig.foamTank.x;
      this.foamTankText.y = layoutConfig.foamTank.y;
    }
    
    // Reposition all indicators
    if (this.pumpEngagedLED) {
      this.pumpEngagedLED.setPosition(layoutConfig.indicators.pumpEngaged.x, layoutConfig.indicators.pumpEngaged.y);
    }
    if (this.governorModeIndicator) {
      this.governorModeIndicator.setPosition(layoutConfig.indicators.governorMode.x, layoutConfig.indicators.governorMode.y);
    }
    
    // Reposition flow indicators
    this.flowIndicators.forEach((indicator, lineId) => {
      const pos = layoutConfig.flowIndicators[lineId];
      if (pos) {
        indicator.setPosition(pos.x, pos.y);
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
    // Destroy card components
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

    // Destroy all controls
    this.controls.forEach((control) => control.destroy());
    this.controls.clear();

    // Destroy all gauges (passing app for ticker cleanup)
    this.gauges.forEach((gauge) => gauge.destroy(this.app));
    this.gauges.clear();

    // Destroy master gauges
    if (this.masterDischargeGauge) {
      this.masterDischargeGauge.destroy(this.app);
      this.masterDischargeGauge = null;
    }
    if (this.compoundIntakeGauge) {
      this.compoundIntakeGauge.destroy(this.app);
      this.compoundIntakeGauge = null;
    }

    // Destroy water source indicator
    if (this.waterSourceIndicator) {
      this.waterSourceIndicator.destroy({ children: true });
      this.waterSourceIndicator = null;
    }

    // Destroy visual indicators
    this.indicators.forEach((indicator) => indicator.destroy(this.app));
    this.indicators.clear();
    
    // Destroy flow indicators
    this.flowIndicators.forEach((indicator) => indicator.destroy(this.app));
    this.flowIndicators.clear();

    // Clear references
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
    this.pumpEngagedLED = null;
    this.governorModeIndicator = null;
  }
}