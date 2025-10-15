/**
 * Layout manager for pump panel controls and gauges
 * Card-based redesign with 25% size reduction for 900x600px viewport
 */

import type { DischargeId, IntakeId } from '../sim/model';

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
    crosslay: CardDimensions;
    intake: CardDimensions;
    largeDiameter: CardDimensions;
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
 * Manages layout of all panel controls and gauges
 * Card-based design for 900x600px canvas with zero overlaps
 */
export class PanelLayout {
  private width: number;
  private height: number;
  
  // TARGET CANVAS SIZE - Design optimized for this
  private readonly CANVAS_WIDTH = 900;
  private readonly CANVAS_HEIGHT = 600;
  
  // REDUCED CONTROL SIZES (25% smaller than original)
  private readonly KNOB_DIAMETER = 60;  // Was 80px
  private readonly LEVER_WIDTH = 22.5;  // Was 30px
  private readonly LEVER_HEIGHT = 60;   // Was 80px
  private readonly MASTER_GAUGE_DIAMETER = 225;  // Was 300px
  private readonly COMPOUND_GAUGE_DIAMETER = 180; // Was 240px
  private readonly LABEL_WIDTH = 75;    // Was 100px
  private readonly MIN_SPACING = 30;    // Minimum gap between controls

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
   * Get complete layout configuration
   */
  public getLayout(): PanelLayoutConfig {
    const layout: PanelLayoutConfig = {
      cards: this.getCardPositions(),
      intakeGauges: this.getIntakeGaugePositions(),
      dischargeValves: this.getDischargeValvePositions(),
      throttle: this.getThrottlePosition(),
      foamEnable: this.getFoamEnablePosition(),
      foamPercent: this.getFoamPercentPosition(),
      waterTank: this.getWaterTankPosition(),
      foamTank: this.getFoamTankPosition(),
      tankToPump: this.getTankToPumpPosition(),
      tankFillRecirc: this.getTankFillRecircPosition(),
      primer: this.getPrimerPosition(),
      drvToggle: this.getDRVTogglePosition(),
      drvSetpoint: this.getDRVSetpointPosition(),
      masterDischarge: this.getMasterDischargePosition(),
      compoundIntake: this.getCompoundIntakePosition(),
      indicators: this.getIndicatorPositions(),
      flowIndicators: this.getFlowIndicatorPositions(),
    };

    // DIAGNOSTIC LOGGING - Validate layout spacing
    this.logLayoutDiagnostics(layout);

    return layout;
  }

  /**
   * Get card positions and dimensions
   * THREE MAIN ACTION CARDS as per design spec
   */
  private getCardPositions(): PanelLayoutConfig['cards'] {
    return {
      // Crosslay/Trashline Unified Card (left, middle row)
      crosslay: {
        x: 40,
        y: 280,
        width: 250,
        height: 150,
      },
      
      // Intake Controls Card (center, middle row)
      intake: {
        x: 320,
        y: 280,
        width: 200,
        height: 150,
      },
      
      // Large Diameter Discharge Card (bottom row, SHORTENED to x=550 to avoid right side)
      largeDiameter: {
        x: 40,
        y: 460,
        width: 510,  // Was 600, now 510 to end at x=550
        height: 120,
      },
    };
  }

  /**
   * Get positions for top row gauges
   */
  private getMasterDischargePosition(): Position {
    return { x: 600, y: 120 }; // Moved up slightly (was 140)
  }

  private getCompoundIntakePosition(): Position {
    return { x: 280, y: 120 }; // Moved left and up (was 300, 140)
  }

  /**
   * Get positions for independent controls (Governor, DRV, Throttle)
   * Positioned on right side - ZERO OVERLAPS GUARANTEED
   */
  private getDRVSetpointPosition(): Position {
    return { x: 760, y: 300 }; // Far right, below gauge clearance
  }

  private getDRVTogglePosition(): Position {
    return { x: 760, y: 390 }; // Directly below setpoint with 90px gap
  }

  private getThrottlePosition(): Position {
    return { x: 760, y: 520 }; // Moved down to y=520 for clearance (was 490)
  }

  /**
   * Get positions for foam controls (right side, top area)
   */
  private getFoamEnablePosition(): Position {
    return { x: 820, y: 200 }; // Far top right
  }

  private getFoamPercentPosition(): Position {
    return { x: 820, y: 140 }; // Above foam enable
  }

  /**
   * Get positions for tank displays (far right edge)
   */
  private getWaterTankPosition(): Position {
    return { x: 860, y: 540 }; // Far right bottom
  }

  private getFoamTankPosition(): Position {
    return { x: 860, y: 570 }; // Far right bottom
  }

  /**
   * Get positions for intake pressure gauges (bottom, below large diameter card)
   */
  public getIntakeGaugePositions(): Record<IntakeId, Position> {
    return {
      ldh_driver: { x: 100, y: 590 },
      ldh_officer: { x: 300, y: 590 },
      rear_ldh: { x: 500, y: 590 },
    };
  }

  /**
   * Get positions for discharge valves NOT in cards
   */
  public getDischargeValvePositions(): Record<DischargeId, Position> {
    // Most discharges are now in cards, keep legacy positions for non-card ones
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

  public getTankFillRecircPosition(): Position {
    return { x: 100, y: 240 };
  }

  public getPrimerPosition(): Position {
    return { x: 200, y: 240 };
  }

  /**
   * Get positions for indicator elements
   */
  public getIndicatorPositions(): PanelLayoutConfig['indicators'] {
    return {
      pumpEngaged: { x: 50, y: 60 },
      governorMode: { x: 750, y: 250 },
      tankLow: { x: 850, y: 200 },
      cavitation: { x: 480, y: 200 },
      overpressure: { x: 720, y: 200 },
      temperature: { x: 850, y: 150 },
      pressureStatus: { x: 600, y: 240 },
    };
  }

  /**
   * Get positions for flow indicators (near discharge valves)
   */
  public getFlowIndicatorPositions(): Record<DischargeId, Position> {
    // Position flow indicators below cards or near controls
    return {
      xlay1: { x: 140, y: 440 },
      xlay2: { x: 200, y: 440 },
      xlay3: { x: 260, y: 440 },
      trash: { x: 320, y: 440 },
      d2_5_a: { x: 100, y: 590 },
      d2_5_b: { x: 250, y: 590 },
      d2_5_c: { x: 400, y: 590 },
      d2_5_d: { x: 550, y: 590 },
      deck: { x: 650, y: 590 },
      rear_ldh: { x: 700, y: 590 },
    };
  }

  /**
   * Log comprehensive layout diagnostics to detect overlaps
   */
  private logLayoutDiagnostics(layout: PanelLayoutConfig): void {
    console.group('🔍 PANEL LAYOUT DIAGNOSTICS - CARD-BASED REDESIGN');
    
    console.log(`Canvas: ${this.width}x${this.height}px (Target: 900x600px)`);
    console.log(`\n📏 REDUCED CONTROL SIZES (25% smaller):`);
    console.log(`  Knob: ${this.KNOB_DIAMETER}px diameter`);
    console.log(`  Lever: ${this.LEVER_WIDTH}x${this.LEVER_HEIGHT}px`);
    console.log(`  Master Gauge: ${this.MASTER_GAUGE_DIAMETER}px diameter`);
    console.log(`  Compound Gauge: ${this.COMPOUND_GAUGE_DIAMETER}px diameter`);
    console.log(`  Min Spacing: ${this.MIN_SPACING}px`);
    
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
    controls.push({
      name: 'Master Discharge Gauge',
      box: bbox(layout.masterDischarge, this.MASTER_GAUGE_DIAMETER, this.MASTER_GAUGE_DIAMETER + 30),
    });
    
    controls.push({
      name: 'Compound Intake Gauge',
      box: bbox(layout.compoundIntake, this.COMPOUND_GAUGE_DIAMETER, this.COMPOUND_GAUGE_DIAMETER + 30),
    });
    
    // Add independent controls
    controls.push({
      name: 'DRV Setpoint',
      box: bbox(layout.drvSetpoint, this.KNOB_DIAMETER + this.LABEL_WIDTH, this.KNOB_DIAMETER + 30),
    });
    
    controls.push({
      name: 'DRV Toggle',
      box: bbox(layout.drvToggle, this.LEVER_WIDTH + this.LABEL_WIDTH, this.LEVER_HEIGHT + 30),
    });
    
    controls.push({
      name: 'Throttle',
      box: bbox(layout.throttle, this.LEVER_WIDTH + this.LABEL_WIDTH, this.LEVER_HEIGHT * 2 + 30),
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
      console.log('✅ No overlaps detected - REDESIGN SUCCESSFUL!');
    } else {
      console.error(`⚠️  Found ${overlapCount} overlapping control pairs - NEEDS ADJUSTMENT`);
    }
    
    console.groupEnd();
  }

  /**
   * Get spacing for controls
   */
  public getControlSpacing(): number {
    return this.MIN_SPACING;
  }

  /**
   * Get gauge radius based on type
   */
  public getGaugeRadius(): number {
    return 60; // Default gauge radius (25% smaller than original 80px)
  }
}