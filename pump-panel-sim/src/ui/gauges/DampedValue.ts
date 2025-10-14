/**
 * Spring-damped value system for smooth, realistic animations
 * Uses critically damped spring physics for natural motion
 */

export interface DampingConfig {
  /** Spring stiffness (k) - higher = faster response (default: 200) */
  stiffness?: number;
  /** Damping coefficient (c) - controls oscillation (default: 20) */
  damping?: number;
  /** Mass (m) - simulates inertia (default: 1) */
  mass?: number;
  /** Maximum velocity to prevent overshoot (optional) */
  maxVelocity?: number;
  /** Threshold below which motion stops (default: 0.001) */
  restThreshold?: number;
}

/**
 * Damped value that smoothly approaches a target using spring-damper physics
 * 
 * Uses the differential equation:
 * m * acceleration = -k * (position - target) - c * velocity
 * 
 * For critical damping: c = 2 * sqrt(k * m)
 */
export class DampedValue {
  private current: number;
  private target: number;
  private velocity: number = 0;
  
  private stiffness: number;
  private damping: number;
  private mass: number;
  private maxVelocity: number | undefined;
  private restThreshold: number;
  
  /**
   * Create a new damped value
   * @param initialValue - Starting value
   * @param config - Damping configuration parameters
   */
  constructor(initialValue: number = 0, config: DampingConfig = {}) {
    this.current = initialValue;
    this.target = initialValue;
    
    // Default to critically damped system
    this.mass = config.mass ?? 1;
    this.stiffness = config.stiffness ?? 200;
    
    // Critical damping: c = 2 * sqrt(k * m)
    const criticalDamping = 2 * Math.sqrt(this.stiffness * this.mass);
    this.damping = config.damping ?? criticalDamping;
    
    this.maxVelocity = config.maxVelocity;
    this.restThreshold = config.restThreshold ?? 0.001;
  }
  
  /**
   * Set a new target value for the damped value to approach
   * @param value - New target value
   */
  public setTarget(value: number): void {
    this.target = value;
  }
  
  /**
   * Get the current damped value
   */
  public getCurrent(): number {
    return this.current;
  }
  
  /**
   * Get the target value
   */
  public getTarget(): number {
    return this.target;
  }
  
  /**
   * Get the current velocity
   */
  public getVelocity(): number {
    return this.velocity;
  }
  
  /**
   * Check if the value is at rest (close enough to target with low velocity)
   */
  public isAtRest(): boolean {
    const distance = Math.abs(this.target - this.current);
    const speed = Math.abs(this.velocity);
    return distance < this.restThreshold && speed < this.restThreshold;
  }
  
  /**
   * Update the damped value using spring-damper physics
   * @param deltaTime - Time elapsed since last update (in seconds)
   */
  public update(deltaTime: number): void {
    // Skip if already at rest
    if (this.isAtRest()) {
      this.current = this.target;
      this.velocity = 0;
      return;
    }
    
    // Spring-damper forces
    const displacement = this.current - this.target;
    const springForce = -this.stiffness * displacement;
    const dampingForce = -this.damping * this.velocity;
    
    // F = ma, so a = F/m
    const acceleration = (springForce + dampingForce) / this.mass;
    
    // Update velocity
    this.velocity += acceleration * deltaTime;
    
    // Apply max velocity constraint if set
    if (this.maxVelocity !== undefined) {
      this.velocity = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.velocity));
    }
    
    // Update position
    this.current += this.velocity * deltaTime;
    
    // Snap to target if very close
    if (this.isAtRest()) {
      this.current = this.target;
      this.velocity = 0;
    }
  }
  
  /**
   * Instantly snap to a value without smooth transition
   * @param value - Value to snap to
   */
  public snap(value: number): void {
    this.current = value;
    this.target = value;
    this.velocity = 0;
  }
  
  /**
   * Reset to initial state
   * @param value - Optional value to reset to (default: 0)
   */
  public reset(value: number = 0): void {
    this.snap(value);
  }
  
  /**
   * Update damping configuration
   * @param config - New damping parameters
   */
  public updateConfig(config: Partial<DampingConfig>): void {
    if (config.mass !== undefined) this.mass = config.mass;
    if (config.stiffness !== undefined) this.stiffness = config.stiffness;
    if (config.damping !== undefined) this.damping = config.damping;
    if (config.maxVelocity !== undefined) this.maxVelocity = config.maxVelocity;
    if (config.restThreshold !== undefined) this.restThreshold = config.restThreshold;
  }
}

/**
 * Create a damped value with preset configurations for common use cases
 */
export class DampedValuePresets {
  /**
   * Fast, responsive damping (for digital displays)
   */
  static fast(initialValue: number = 0): DampedValue {
    return new DampedValue(initialValue, {
      stiffness: 300,
      damping: 30,
      mass: 1,
    });
  }
  
  /**
   * Medium speed damping (for gauges under normal conditions)
   */
  static medium(initialValue: number = 0): DampedValue {
    return new DampedValue(initialValue, {
      stiffness: 200,
      damping: 20,
      mass: 1,
    });
  }
  
  /**
   * Slow, heavy damping (for large pressure changes)
   */
  static slow(initialValue: number = 0): DampedValue {
    return new DampedValue(initialValue, {
      stiffness: 100,
      damping: 15,
      mass: 1.5,
    });
  }
  
  /**
   * Bouncy damping with slight overshoot (for emergency indicators)
   */
  static bouncy(initialValue: number = 0): DampedValue {
    return new DampedValue(initialValue, {
      stiffness: 250,
      damping: 15, // Under-damped for overshoot
      mass: 1,
    });
  }
  
  /**
   * Pressure gauge damping (realistic mechanical gauge behavior)
   */
  static pressureGauge(initialValue: number = 0): DampedValue {
    return new DampedValue(initialValue, {
      stiffness: 180,
      damping: 22,
      mass: 1.2,
      maxVelocity: 500, // Limit maximum swing speed
    });
  }
}