/**
 * Texture Cache System for PixiJS
 * Caches generated textures to avoid recreating them on every gauge/control instantiation
 */

import * as PIXI from 'pixi.js';
import { createGaugeGraphic, createAdvancedGaugeGraphic, type GaugeGraphicOptions } from './createGaugeGraphic';
import { createLeverGraphic } from './createLeverGraphic';
import { createKnobGraphic } from './createKnobGraphic';

/**
 * Global texture cache to reuse generated textures
 */
class TextureCacheManager {
  private cache: Map<string, PIXI.Texture> = new Map();
  private renderer: PIXI.Renderer | null = null;

  /**
   * Initialize the cache with a renderer
   */
  initialize(renderer: PIXI.Renderer): void {
    this.renderer = renderer;
  }

  /**
   * Generate a cache key for a graphic configuration
   */
  private generateKey(type: string, params: any): string {
    return `${type}:${JSON.stringify(params)}`;
  }

  /**
   * Get or create a gauge texture
   */
  getGaugeTexture(
    radius: number = 80,
    startAngle: number = -Math.PI * 3 / 4,
    endAngle: number = Math.PI * 3 / 4,
    numTicks: number = 12,
    color: number = 0xf0f0f0
  ): PIXI.Texture | null {
    if (!this.renderer) return null;

    const key = this.generateKey('gauge', { radius, startAngle, endAngle, numTicks, color });
    
    if (!this.cache.has(key)) {
      const container = createGaugeGraphic(radius, startAngle, endAngle, numTicks, color);
      const texture = this.renderer.generateTexture(container);
      this.cache.set(key, texture);
      
      // Clean up temporary container
      container.destroy({ children: true });
    }

    return this.cache.get(key)!;
  }

  /**
   * Get or create an advanced gauge texture (without needle - needle must be separate)
   */
  getAdvancedGaugeTexture(options: GaugeGraphicOptions): PIXI.Texture | null {
    if (!this.renderer) return null;

    // Remove needle from options for caching
    const cacheOptions = { ...options };
    const key = this.generateKey('advanced-gauge', cacheOptions);
    
    if (!this.cache.has(key)) {
      const container = createAdvancedGaugeGraphic(options);
      
      // Remove needle before caching (needle is animated)
      const needle = (container as any).needle;
      if (needle) {
        container.removeChild(needle);
      }
      
      const texture = this.renderer.generateTexture(container);
      this.cache.set(key, texture);
      
      container.destroy({ children: true });
    }

    return this.cache.get(key)!;
  }

  /**
   * Get or create a lever texture
   */
  getLeverTexture(
    width: number = 30,
    height: number = 120,
    handleLength: number = 40,
    color: number = 0x6b7280,
    vertical: boolean = true
  ): PIXI.Texture | null {
    if (!this.renderer) return null;

    const key = this.generateKey('lever', { width, height, handleLength, color, vertical });
    
    if (!this.cache.has(key)) {
      const container = createLeverGraphic(width, height, handleLength, color, vertical);
      const texture = this.renderer.generateTexture(container);
      this.cache.set(key, texture);
      
      container.destroy({ children: true });
    }

    return this.cache.get(key)!;
  }

  /**
   * Get or create a knob texture
   */
  getKnobTexture(radius: number = 40, color: number = 0x4a5568): PIXI.Texture | null {
    if (!this.renderer) return null;

    const key = this.generateKey('knob', { radius, color });
    
    if (!this.cache.has(key)) {
      const container = createKnobGraphic(radius, color);
      const texture = this.renderer.generateTexture(container);
      this.cache.set(key, texture);
      
      container.destroy({ children: true });
    }

    return this.cache.get(key)!;
  }

  /**
   * Clear all cached textures
   */
  clear(): void {
    this.cache.forEach(texture => texture.destroy(true));
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const TextureCache = new TextureCacheManager();