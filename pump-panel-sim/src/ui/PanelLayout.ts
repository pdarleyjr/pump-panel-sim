/**
 * Layout manager for pump panel controls and gauges
 * Defines positions based on screen dimensions and Pierce PUC panel design
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
 * Layout configuration for panel elements
 */
export interface PanelLayoutConfig {
  /** Positions for intake pressure gauges */
  intakeGauges: Record<IntakeId, Position>;
  
  /** Positions for discharge valve controls */
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
 * Creates a responsive layout based on screen size
 */
export class PanelLayout {
  private width: number;
  private height: number;
  private padding: number = 40;
  private gaugeRadius: number = 80;

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
   * Get positions for all intake pressure gauges (top row)
   */
  public getIntakeGaugePositions(): Record<IntakeId, Position> {
    const topY = this.padding + this.gaugeRadius;
    const spacing = this.width / 4;

    return {
      ldh_driver: { x: spacing, y: topY },
      ldh_officer: { x: spacing * 2, y: topY },
      rear_ldh: { x: spacing * 3, y: topY },
    };
  }

  /**
   * Get positions for all discharge valve controls
   * Arranged in a grid pattern similar to Pierce PUC layout
   */
  public getDischargeValvePositions(): Record<DischargeId, Position> {
    const startY = this.padding + this.gaugeRadius * 2 + 100;
    const rowHeight = 200;
    const colWidth = this.width / 6;

    return {
      // Top row: Cross-lays and trash line (4 controls)
      xlay1: { x: colWidth * 0.5 + this.padding, y: startY },
      xlay2: { x: colWidth * 1.5 + this.padding, y: startY },
      xlay3: { x: colWidth * 2.5 + this.padding, y: startY },
      trash: { x: colWidth * 3.5 + this.padding, y: startY },

      // Middle row: 2.5" lines (4 controls)
      d2_5_a: { x: colWidth * 0.5 + this.padding, y: startY + rowHeight },
      d2_5_b: { x: colWidth * 1.5 + this.padding, y: startY + rowHeight },
      d2_5_c: { x: colWidth * 2.5 + this.padding, y: startY + rowHeight },
      d2_5_d: { x: colWidth * 3.5 + this.padding, y: startY + rowHeight },

      // Bottom row: Special controls (2 controls)
      deck: { x: colWidth * 1 + this.padding, y: startY + rowHeight * 2 },
      rear_ldh: { x: colWidth * 2.5 + this.padding, y: startY + rowHeight * 2 },
    };
  }

  /**
   * Get position for throttle control (center right)
   */
  public getThrottlePosition(): Position {
    return {
      x: this.width - 150,
      y: this.height / 2,
    };
  }

  /**
   * Get position for foam enable control
   */
  public getFoamEnablePosition(): Position {
    return {
      x: this.width - 150,
      y: this.height / 2 - 150,
    };
  }

  /**
   * Get position for foam percentage control
   */
  public getFoamPercentPosition(): Position {
    return {
      x: this.width - 150,
      y: this.height / 2 - 80,
    };
  }

  /**
   * Get position for water tank level display
   */
  public getWaterTankPosition(): Position {
    return {
      x: this.width - 150,
      y: this.height - 150,
    };
  }

  /**
   * Get position for foam tank level display
   */
  public getFoamTankPosition(): Position {
    return {
      x: this.width - 150,
      y: this.height - 80,
    };
  }

  /**
   * Get position for tank-to-pump valve control (near intake gauges)
   */
  public getTankToPumpPosition(): Position {
    return {
      x: 150,
      y: 320, // Moved down to avoid compound intake gauge overlap
    };
  }

  /**
   * Get position for tank fill/recirc control (near foam controls)
   */
  public getTankFillRecircPosition(): Position {
    return {
      x: this.width - 150,
      y: this.height / 2 + 100,
    };
  }

  /**
   * Get position for primer button (near intake gauges)
   */
  public getPrimerPosition(): Position {
    return {
      x: 180,
      y: 380, // Moved down to avoid overlaps
    };
  }

  /**
   * Get position for DRV toggle control (below master gauges)
   */
  public getDRVTogglePosition(): Position {
    return {
      x: this.width / 2 - 80,
      y: 350, // Moved down significantly to avoid master discharge gauge
    };
  }

  /**
   * Get position for DRV setpoint knob (next to DRV toggle)
   */
  public getDRVSetpointPosition(): Position {
    return {
      x: this.width / 2 + 80,
      y: 350, // Same level as toggle, spread apart horizontally
    };
  }

  /**
   * Get position for master discharge pressure gauge (prominent at top center)
   */
  public getMasterDischargePosition(): Position {
    return {
      x: this.width / 2,
      y: this.padding + 100, // Top center, prominent position
    };
  }

  /**
   * Get position for compound intake gauge (near intake controls, left-center)
   */
  public getCompoundIntakePosition(): Position {
    return {
      x: 250,
      y: this.padding + 100, // Same height as master discharge but on left
    };
  }

  /**
   * Get positions for indicator elements
   */
  public getIndicatorPositions(): PanelLayoutConfig['indicators'] {
    const throttlePos = this.getThrottlePosition();
    const masterPos = this.getMasterDischargePosition();
    
    return {
      pumpEngaged: { x: throttlePos.x - 80, y: throttlePos.y - 100 },
      governorMode: { x: throttlePos.x + 80, y: throttlePos.y - 100 },
      tankLow: { x: this.width - 150, y: this.height - 220 },
      cavitation: { x: masterPos.x - 150, y: masterPos.y + 80 },
      overpressure: { x: masterPos.x + 150, y: masterPos.y + 80 },
      temperature: { x: this.width - 150, y: this.height / 2 + 200 },
      pressureStatus: { x: masterPos.x, y: masterPos.y + 150 },
    };
  }

  /**
   * Get positions for flow indicators (near discharge valves)
   */
  public getFlowIndicatorPositions(): Record<DischargeId, Position> {
    const valvePos = this.getDischargeValvePositions();
    const flowPos: Record<DischargeId, Position> = {} as Record<DischargeId, Position>;
    
    // Position flow indicators below each valve
    for (const id in valvePos) {
      const pos = valvePos[id as DischargeId];
      flowPos[id as DischargeId] = { x: pos.x, y: pos.y + 80 };
    }
    
    return flowPos;
  }

  /**
   * Get complete layout configuration
   */
  public getLayout(): PanelLayoutConfig {
    return {
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
  }

  /**
   * Get spacing for controls
   */
  public getControlSpacing(): number {
    return Math.min(this.width, this.height) / 10;
  }

  /**
   * Get gauge radius based on screen size
   */
  public getGaugeRadius(): number {
    return Math.min(80, Math.min(this.width, this.height) / 12);
  }
}