/**
 * Layout manager for pump panel controls and gauges
 * Grid-based redesign with responsive scaling
 */

import type { DischargeId, IntakeId } from '../sim/model';
import { computeGrid } from './layout/Grid';

/**
 * Position for a control or gauge
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Card dimensions
 */
export interface CardDimensions extends Position {
  width: number;
  height: number;
}

/**
 * Layout configuration for panel elements
 */
export interface PanelLayoutConfig {
  /** Card positions and sizes */
  cards: {
    masterGauges: CardDimensions;
    crosslay: CardDimensions;
    intake: CardDimensions;
    largeDiameter: CardDimensions;
    engineControls: CardDimensions;
    tankFoam: CardDimensions;
  };
  
  /** Positions for intake pressure gauges */
  intakeGauges: Record<IntakeId, Position>;
  
  /** Positions for discharge valve controls (only non-card discharges) */
  dischargeValves: Record<DischargeId, Position>;
  
  /** Position for throttle control */
  throttle: Position;
  
  /** Position for tank-to-pump valve control */
  tankToPump: Position;
  
  /** Position for tank fill/recirc control */
  tankFillRecirc: Position;
  
  /** Position for primer control */
  primer: Position;
  
  /** Position for foam enable control */
  foamEnable: Position;
  
  /** Position for foam percentage control */
  foamPercent: Position;
  
  /** Position for water tank level display */
  waterTank: Position;
  
  /** Position for foam tank level display */
  foamTank: Position;
  
  /** Position for DRV toggle control */
  drvToggle: Position;
  
  /** Position for DRV setpoint knob */
  drvSetpoint: Position;
  
  /** Position for master discharge pressure gauge */
  masterDischarge: Position;
  
  /** Position for compound intake gauge (pressure/vacuum) */
  compoundIntake: Position;
  
  /** Indicator positions */
  indicators: {
    /** Pump engaged LED indicator */
    pumpEngaged: Position;
    /** Governor mode indicator */
    governorMode: Position;
    /** Tank low warning badge */
    tankLow: Position;
    /** Cavitation warning badge */
    cavitation: Position;
    /** Overpressure warning badge */
    overpressure: Position;
    /** Temperature status badge */
    temperature: Position;
    /** Pressure status badge */
    pressureStatus: Position;
  };
  
  /** Flow indicators for discharge lines */
  flowIndicators: Record<DischargeId, Position>;
}

/**
 * Grid configuration for 8×6 layout system
 */
interface GridConfig {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  margin: number;
  cardMargin: number;
}

/**
 * Manages layout of all panel controls and gauges
 * 8×6 Grid-based design with responsive support
 */
export class PanelLayout {
  private width: number;
  private height: number;
  
  // TARGET RESOLUTIONS
  private readonly TARGET_RESOLUTIONS = {
    MOBILE: { width: 900, height: 600 },
    TABLET: { width: 1024, height: 768 },
    DESKTOP: { width: 1920, height: 1080 },
  };
  
  // DESIGN CONSTANTS
  private readonly DESIGN_WIDTH = 1920;
  private readonly DESIGN_HEIGHT = 1080;
  private readonly GRID_COLUMNS = 8;
  private readonly GRID_ROWS = 6;
  private readonly GRID_GAP = 24;
  private readonly GRID_MARGIN = 24;
  
  // GRID SLOT MAPPINGS (based on Pierce PUC layout)
  // [col, row, colSpan, rowSpan]
  private readonly CARD_SLOTS = {
    masterGauges: [0, 0, 2, 2] as [number, number, number, number],
    engine: [4, 0, 2, 2] as [number, number, number, number],
    crosslay: [0, 2, 2, 2] as [number, number, number, number],
    intake: [2, 2, 2, 2] as [number, number, number, number],
    tankFoam: [4, 2, 2, 2] as [number, number, number, number],
    largeDiameter: [0, 4, 6, 2] as [number, number, number, number],
  };
  
  // BASE DIMENSIONS (900×600)
  private readonly BASE_MARGIN = 20;
  private readonly BASE_GAP = 30;
  private readonly BASE_CARD_MARGIN = 40;
  
  // CONTROL SIZES (already properly sized)
  private readonly KNOB_RADIUS = 30;  // 60px diameter
  private readonly LEVER_WIDTH = 22.5;
  private readonly LEVER_HEIGHT = 60;
  private readonly MASTER_GAUGE_RADIUS = 112.5;  // 225px diameter
  private readonly COMPOUND_GAUGE_RADIUS = 90; // 180px diameter
  private readonly SMALL_GAUGE_RADIUS = 30; // 60px diameter
  private readonly RPM_GAUGE_RADIUS = 90; // 180px diameter
  private readonly LABEL_HEIGHT = 20;
  private readonly VALUE_TEXT_HEIGHT = 20;
  private readonly MIN_SPACING = 30;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Update dimensions for responsive layout
   */
  public updateDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Calculate scale factor based on current resolution
   */
  private getScaleFactor(): number {
    // Scale controls based on viewport size
    if (this.width >= this.TARGET_RESOLUTIONS.DESKTOP.width) {
      return 1.5; // 150% for 1920×1080
    } else if (this.width >= this.TARGET_RESOLUTIONS.TABLET.width) {
      return 1.2; // 120% for 1024×768
    }
    return 1.0; // 100% for 900×600
  }

  /**
   * Get grid configuration for current scale
   */
  private getGridConfig(): GridConfig {
    const scale = this.getScaleFactor();
    
    // Calculate cell dimensions based on canvas size and grid
    // At 900×600: cellWidth = 107.5px, cellHeight = 93.3px
    const cellWidth = (this.width - this.BASE_MARGIN * 2 * scale) / this.GRID_COLUMNS;
    const cellHeight = (this.height - this.BASE_MARGIN * 2 * scale) / this.GRID_ROWS;
    
    return {
      columns: this.GRID_COLUMNS,
      rows: this.GRID_ROWS,
      cellWidth,
      cellHeight,
      gap: this.BASE_GAP * scale,
      margin: this.BASE_MARGIN * scale,
      cardMargin: this.BASE_CARD_MARGIN * scale,
    };
  }

  /**
   * Get position in grid system
   */
  private getGridPosition(col: number, row: number, config: GridConfig): Position {
    return {
      x: config.margin + col * config.cellWidth,
      y: config.margin + row * config.cellHeight,
    };
  }

  /**
   * Get complete layout configuration
   */
  public getLayout(): PanelLayoutConfig {
    const scale = this.getScaleFactor();
    
    const layout: PanelLayoutConfig = {
      cards: this.getCardPositions(),
      intakeGauges: this.getIntakeGaugePositions(scale),
      dischargeValves: this.getDischargeValvePositions(),
      throttle: this.getThrottlePosition(scale),
      foamEnable: this.getFoamEnablePosition(scale),
      foamPercent: this.getFoamPercentPosition(scale),
      waterTank: this.getWaterTankPosition(scale),
      foamTank: this.getFoamTankPosition(scale),
      tankToPump: this.getTankToPumpPosition(),
      tankFillRecirc: this.getTankFillRecircPosition(scale),
      primer: this.getPrimerPosition(scale),
      drvToggle: this.getDRVTogglePosition(scale),
      drvSetpoint: this.getDRVSetpointPosition(scale),
      masterDischarge: this.getMasterDischargePosition(scale),
      compoundIntake: this.getCompoundIntakePosition(scale),
      indicators: this.getIndicatorPositions(scale),
      flowIndicators: this.getFlowIndicatorPositions(scale),
    };

    // DIAGNOSTIC LOGGING - Validate layout spacing
    this.logLayoutDiagnostics(layout, scale);

    return layout;
  }

  /**
   * Get card positions and dimensions with 8×6 grid-based layout
   * Uses grid computation to ensure no overlaps
   */
  private getCardPositions(): PanelLayoutConfig['cards'] {
    // Compute grid placements using the grid layout engine
    const { placements } = computeGrid({
      designWidth: this.DESIGN_WIDTH,
      designHeight: this.DESIGN_HEIGHT,
      viewportWidth: this.width,
      viewportHeight: this.height,
      cols: this.GRID_COLUMNS,
      rows: this.GRID_ROWS,
      gap: this.GRID_GAP,
      margin: this.GRID_MARGIN,
      slots: this.CARD_SLOTS,
    });

    // Map placements to card dimensions
    return {
      masterGauges: {
        x: placements.masterGauges.x,
        y: placements.masterGauges.y,
        width: placements.masterGauges.w,
        height: placements.masterGauges.h,
      },
      engineControls: {
        x: placements.engine.x,
        y: placements.engine.y,
        width: placements.engine.w,
        height: placements.engine.h,
      },
      crosslay: {
        x: placements.crosslay.x,
        y: placements.crosslay.y,
        width: placements.crosslay.w,
        height: placements.crosslay.h,
      },
      intake: {
        x: placements.intake.x,
        y: placements.intake.y,
        width: placements.intake.w,
        height: placements.intake.h,
      },
      tankFoam: {
        x: placements.tankFoam.x,
        y: placements.tankFoam.y,
        width: placements.tankFoam.w,
        height: placements.tankFoam.h,
      },
      largeDiameter: {
        x: placements.largeDiameter.x,
        y: placements.largeDiameter.y,
        width: placements.largeDiameter.w,
        height: placements.largeDiameter.h,
      },
    };
  }

  /**
   * Get positions for master gauges (now in MasterGaugesCard)
   */
  private getMasterDischargePosition(scale: number = 1.0): Position {
    // These will be inside the MasterGaugesCard, but keep for compatibility
    return { 
      x: 20 * scale, 
      y: 20 * scale 
    };
  }

  private getCompoundIntakePosition(scale: number = 1.0): Position {
    // These will be inside the MasterGaugesCard, but keep for compatibility
    return { 
      x: 20 * scale, 
      y: 20 * scale 
    };
  }

  /**
   * Get positions for engine controls (now in EngineControlsCard)
   */
  private getDRVSetpointPosition(scale: number = 1.0): Position {
    // Will be inside EngineControlsCard
    return { 
      x: 520 * scale, 
      y: 280 * scale 
    };
  }

  private getDRVTogglePosition(scale: number = 1.0): Position {
    // Will be inside EngineControlsCard
    return { 
      x: 520 * scale, 
      y: 280 * scale 
    };
  }

  private getThrottlePosition(scale: number = 1.0): Position {
    // Will be inside EngineControlsCard
    return { 
      x: 520 * scale, 
      y: 280 * scale 
    };
  }

  /**
   * Get positions for tank & foam controls (now in TankFoamCard)
   */
  private getFoamEnablePosition(scale: number = 1.0): Position {
    // Will be inside TankFoamCard
    return { 
      x: 720 * scale, 
      y: 280 * scale 
    };
  }

  private getFoamPercentPosition(scale: number = 1.0): Position {
    // Will be inside TankFoamCard
    return { 
      x: 720 * scale, 
      y: 280 * scale 
    };
  }

  /**
   * Get positions for tank displays (now in TankFoamCard)
   */
  private getWaterTankPosition(scale: number = 1.0): Position {
    // Will be inside TankFoamCard
    return { 
      x: 720 * scale, 
      y: 280 * scale 
    };
  }

  private getFoamTankPosition(scale: number = 1.0): Position {
    // Will be inside TankFoamCard
    return { 
      x: 720 * scale, 
      y: 280 * scale 
    };
  }

  /**
   * Get positions for intake pressure gauges
   */
  public getIntakeGaugePositions(scale: number = 1.0): Record<IntakeId, Position> {
    const baseY = this.height - 40 * scale;
    const spacing = 150 * scale;
    
    return {
      ldh_driver: { x: 100 * scale, y: baseY },
      ldh_officer: { x: 100 * scale + spacing, y: baseY },
      rear_ldh: { x: 100 * scale + spacing * 2, y: baseY },
    };
  }

  /**
   * Get positions for discharge valves NOT in cards
   */
  public getDischargeValvePositions(): Record<DischargeId, Position> {
    // Most discharges are now in cards, legacy positions set to 0,0
    return {
      xlay1: { x: 0, y: 0 }, // In crosslay card
      xlay2: { x: 0, y: 0 }, // In crosslay card
      xlay3: { x: 0, y: 0 }, // In crosslay card
      trash: { x: 0, y: 0 }, // In crosslay card
      d2_5_a: { x: 0, y: 0 }, // In large diameter card
      d2_5_b: { x: 0, y: 0 }, // In large diameter card
      d2_5_c: { x: 0, y: 0 }, // In large diameter card
      d2_5_d: { x: 0, y: 0 }, // In large diameter card
      deck: { x: 0, y: 0 },   // In large diameter card
      rear_ldh: { x: 0, y: 0 }, // In large diameter card
    };
  }

  /**
   * Legacy positions for controls now in cards
   */
  public getTankToPumpPosition(): Position {
    return { x: 0, y: 0 }; // Now in intake card
  }

  public getTankFillRecircPosition(scale: number = 1.0): Position {
    return { x: 100 * scale, y: 220 * scale };
  }

  public getPrimerPosition(scale: number = 1.0): Position {
    return { x: 200 * scale, y: 220 * scale };
  }

  /**
   * Get positions for indicator elements
   */
  public getIndicatorPositions(scale: number = 1.0): PanelLayoutConfig['indicators'] {
    return {
      pumpEngaged: { x: 50 * scale, y: 50 * scale },
      governorMode: { x: this.width - 150 * scale, y: 240 * scale },
      tankLow: { x: this.width - 50 * scale, y: 180 * scale },
      cavitation: { x: this.width / 2, y: 200 * scale },
      overpressure: { x: this.width - 200 * scale, y: 200 * scale },
      temperature: { x: this.width - 50 * scale, y: 120 * scale },
      pressureStatus: { x: this.width - 250 * scale, y: 220 * scale },
    };
  }

  /**
   * Get positions for flow indicators
   */
  public getFlowIndicatorPositions(scale: number = 1.0): Record<DischargeId, Position> {
    const baseY = 400 * scale;
    const spacing = 60 * scale;
    
    return {
      xlay1: { x: 80 * scale, y: baseY },
      xlay2: { x: 140 * scale, y: baseY },
      xlay3: { x: 200 * scale, y: baseY },
      trash: { x: 260 * scale, y: baseY },
      d2_5_a: { x: 80 * scale, y: this.height - 50 * scale },
      d2_5_b: { x: 80 * scale + spacing, y: this.height - 50 * scale },
      d2_5_c: { x: 80 * scale + spacing * 2, y: this.height - 50 * scale },
      d2_5_d: { x: 80 * scale + spacing * 3, y: this.height - 50 * scale },
      deck: { x: 80 * scale + spacing * 4, y: this.height - 50 * scale },
      rear_ldh: { x: 80 * scale + spacing * 5, y: this.height - 50 * scale },
    };
  }

  /**
   * Log comprehensive layout diagnostics to detect overlaps
   */
  private logLayoutDiagnostics(layout: PanelLayoutConfig, scale: number): void {
    console.group('🔍 PANEL LAYOUT DIAGNOSTICS - RESPONSIVE REDESIGN');
    
    console.log(`Canvas: ${this.width}x${this.height}px (Scale: ${scale.toFixed(2)}x)`);
    console.log(`\n📏 SCALED CONTROL SIZES:`);
    console.log(`  Knob: ${(this.KNOB_RADIUS * 2 * scale).toFixed(0)}px diameter`);
    console.log(`  Lever: ${(this.LEVER_WIDTH * scale).toFixed(0)}x${(this.LEVER_HEIGHT * scale).toFixed(0)}px`);
    console.log(`  Master Gauge: ${(this.MASTER_GAUGE_RADIUS * 2 * scale).toFixed(0)}px diameter`);
    console.log(`  Compound Gauge: ${(this.COMPOUND_GAUGE_RADIUS * 2 * scale).toFixed(0)}px diameter`);
    console.log(`  Min Spacing: ${(this.MIN_SPACING * scale).toFixed(0)}px`);
    
    // Helper to calculate bounding box
    const bbox = (pos: Position, width: number, height: number) => ({
      left: pos.x - width / 2,
      right: pos.x + width / 2,
      top: pos.y - height / 2,
      bottom: pos.y + height / 2,
      width,
      height,
    });
    
    // Check overlaps function
    const checkOverlap = (name1: string, box1: ReturnType<typeof bbox>, name2: string, box2: ReturnType<typeof bbox>) => {
      const overlapsX = box1.left < box2.right && box1.right > box2.left;
      const overlapsY = box1.top < box2.bottom && box1.bottom > box2.top;
      if (overlapsX && overlapsY) {
        console.error(`❌ OVERLAP: "${name1}" and "${name2}"`);
        console.error(`  ${name1}: (${Math.round(box1.left)}, ${Math.round(box1.top)}) to (${Math.round(box1.right)}, ${Math.round(box1.bottom)})`);
        console.error(`  ${name2}: (${Math.round(box2.left)}, ${Math.round(box2.top)}) to (${Math.round(box2.right)}, ${Math.round(box2.bottom)})`);
        return true;
      }
      return false;
    };
    
    // Create bounding boxes for all controls
    const controls: Array<{ name: string; box: ReturnType<typeof bbox> }> = [];
    
    // Add cards
    controls.push({
      name: 'Crosslay Card',
      box: {
        left: layout.cards.crosslay.x,
        right: layout.cards.crosslay.x + layout.cards.crosslay.width,
        top: layout.cards.crosslay.y,
        bottom: layout.cards.crosslay.y + layout.cards.crosslay.height,
        width: layout.cards.crosslay.width,
        height: layout.cards.crosslay.height,
      },
    });
    
    controls.push({
      name: 'Intake Card',
      box: {
        left: layout.cards.intake.x,
        right: layout.cards.intake.x + layout.cards.intake.width,
        top: layout.cards.intake.y,
        bottom: layout.cards.intake.y + layout.cards.intake.height,
        width: layout.cards.intake.width,
        height: layout.cards.intake.height,
      },
    });
    
    controls.push({
      name: 'Large Diameter Card',
      box: {
        left: layout.cards.largeDiameter.x,
        right: layout.cards.largeDiameter.x + layout.cards.largeDiameter.width,
        top: layout.cards.largeDiameter.y,
        bottom: layout.cards.largeDiameter.y + layout.cards.largeDiameter.height,
        width: layout.cards.largeDiameter.width,
        height: layout.cards.largeDiameter.height,
      },
    });
    
    // Add master gauges
    const masterGaugeSize = this.MASTER_GAUGE_RADIUS * 2 * scale + this.LABEL_HEIGHT * scale;
    controls.push({
      name: 'Master Discharge Gauge',
      box: bbox(layout.masterDischarge, masterGaugeSize, masterGaugeSize + 30 * scale),
    });
    
    const compoundGaugeSize = this.COMPOUND_GAUGE_RADIUS * 2 * scale + this.LABEL_HEIGHT * scale;
    controls.push({
      name: 'Compound Intake Gauge',
      box: bbox(layout.compoundIntake, compoundGaugeSize, compoundGaugeSize + 30 * scale),
    });
    
    // Add independent controls
    const knobSize = this.KNOB_RADIUS * 2 * scale + this.LABEL_HEIGHT * scale + this.VALUE_TEXT_HEIGHT * scale;
    controls.push({
      name: 'DRV Setpoint',
      box: bbox(layout.drvSetpoint, knobSize, knobSize + 20 * scale),
    });
    
    const leverSize = this.LEVER_HEIGHT * scale + this.LABEL_HEIGHT * scale + this.VALUE_TEXT_HEIGHT * scale;
    controls.push({
      name: 'DRV Toggle',
      box: bbox(layout.drvToggle, this.LEVER_WIDTH * scale + 40 * scale, leverSize),
    });
    
    controls.push({
      name: 'Throttle',
      box: bbox(layout.throttle, this.LEVER_WIDTH * scale + 40 * scale, leverSize * 1.5),
    });
    
    console.log('\n📍 CONTROL POSITIONS:');
    controls.forEach(({ name, box }) => {
      console.log(`  ${name}: (${Math.round(box.left + box.width/2)}, ${Math.round(box.top + box.height/2)}) - ${Math.round(box.width)}x${Math.round(box.height)}px`);
    });
    
    // Check for overlaps
    console.log('\n🔍 OVERLAP DETECTION:');
    let overlapCount = 0;
    for (let i = 0; i < controls.length; i++) {
      for (let j = i + 1; j < controls.length; j++) {
        if (checkOverlap(controls[i].name, controls[i].box, controls[j].name, controls[j].box)) {
          overlapCount++;
        }
      }
    }
    
    if (overlapCount === 0) {
      console.log('✅ No overlaps detected - LAYOUT VALIDATED!');
    } else {
      console.error(`⚠️  Found ${overlapCount} overlapping control pairs - REQUIRES ADJUSTMENT`);
    }
    
    console.groupEnd();
  }

  /**
   * Get spacing for controls
   */
  public getControlSpacing(): number {
    return this.MIN_SPACING * this.getScaleFactor();
  }

  /**
   * Get gauge radius based on type and scale
   */
  public getGaugeRadius(type: 'master' | 'compound' | 'small' = 'small'): number {
    const scale = this.getScaleFactor();
    switch (type) {
      case 'master':
        return this.MASTER_GAUGE_RADIUS * scale;
      case 'compound':
        return this.COMPOUND_GAUGE_RADIUS * scale;
      default:
        return this.SMALL_GAUGE_RADIUS * scale;
    }
  }
  
  /**
   * Get knob radius with scale
   */
  public getKnobRadius(): number {
    return this.KNOB_RADIUS * this.getScaleFactor();
  }
}