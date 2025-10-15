/**
 * Texture Cache System for PixiJS
 * Caches generated textures to avoid recreating them on every gauge/control instantiation
 */

import * as PIXI from 'pixi.js';
import { createGaugeGraphic, createAdvancedGaugeGraphic, type GaugeGraphicOptions } from './createGaugeGraphic';
import { createLeverGraphic } from './createLeverGraphic';
import { createKnobGraphic } from './createKnobGraphic';

/**
 * Texture preloader for loading all assets at startup
 */
class TexturePreloader {
  private loadedTextures: Map<string, PIXI.Texture> = new Map();
  private isPreloaded = false;

  /**
   * Preload all textures used in the application
   */
  async preloadAllTextures(renderer: PIXI.Renderer): Promise<void> {
    if (this.isPreloaded) return;

    console.log('Preloading textures...');

    // Preload image-based textures
    await this.preloadImageTextures();

    // Preload generated textures
    this.preloadGeneratedTextures(renderer);

    this.isPreloaded = true;
    console.log('Texture preloading complete');
  }

  /**
   * Preload image-based textures from public directory
   */
  private async preloadImageTextures(): Promise<void> {
    const imagePaths = [
      '/panel-background.png',
      '/gauges/discharge-gauge.png',
      '/gauges/intake-gauge.png',
      '/gauges/rpm-gauge.png',
      '/controls/discharge-valve-closed.png',
      '/controls/discharge-valve-half.png',
      '/controls/knob.png',
      '/controls/lever-off.png',
      '/controls/lever-on.png',
    ];

    for (const path of imagePaths) {
      try {
        const texture = await PIXI.Assets.load(path);
        this.loadedTextures.set(path, texture);
      } catch (error) {
        console.warn(`Failed to preload texture: ${path}`, error);
      }
    }
  }

  /**
   * Preload generated textures (gauges, controls)
   */
  private preloadGeneratedTextures(renderer: PIXI.Renderer): void {
    // Preload common gauge configurations
    const gaugeConfigs = [
      { radius: 80, startAngle: -Math.PI * 3 / 4, endAngle: Math.PI * 3 / 4, numTicks: 12, color: 0xf0f0f0 },
      { radius: 112.5, startAngle: -Math.PI * 3 / 4, endAngle: Math.PI * 3 / 4, numTicks: 12, color: 0xf0f0f0 },
      { radius: 90, startAngle: -Math.PI * 3 / 4, endAngle: Math.PI * 3 / 4, numTicks: 12, color: 0xf0f0f0 },
    ];

    for (const config of gaugeConfigs) {
      const container = createGaugeGraphic(config.radius, config.startAngle, config.endAngle, config.numTicks, config.color);
      const texture = renderer.generateTexture(container);
      const key = `gauge_${config.radius}_${config.color}`;
      this.loadedTextures.set(key, texture);
      container.destroy({ children: true });
    }

    // Preload common lever configurations
    const leverConfigs = [
      { width: 30, height: 120, handleLength: 40, color: 0x6b7280, vertical: true },
      { width: 22.5, height: 90, handleLength: 30, color: 0x4a5568, vertical: true },
    ];

    for (const config of leverConfigs) {
      const container = createLeverGraphic(config.width, config.height, config.handleLength, config.color, config.vertical);
      const texture = renderer.generateTexture(container);
      const key = `lever_${config.width}_${config.height}_${config.color}_${config.vertical}`;
      this.loadedTextures.set(key, texture);
      container.destroy({ children: true });
    }

    // Preload common knob configurations
    const knobConfigs = [
      { radius: 40, color: 0x4a5568 },
      { radius: 30, color: 0x4a5568 },
    ];

    for (const config of knobConfigs) {
      const container = createKnobGraphic(config.radius, config.color);
      const texture = renderer.generateTexture(container);
      const key = `knob_${config.radius}_${config.color}`;
      this.loadedTextures.set(key, texture);
      container.destroy({ children: true });
    }
  }

  /**
   * Get a preloaded texture by path or key
   */
  getTexture(key: string): PIXI.Texture | null {
    return this.loadedTextures.get(key) || null;
  }

  /**
   * Check if preloading is complete
   */
  isReady(): boolean {
    return this.isPreloaded;
  }

  /**
   * Clear all preloaded textures
   */
  clear(): void {
    this.loadedTextures.forEach(texture => texture.destroy(true));
    this.loadedTextures.clear();
    this.isPreloaded = false;
  }
}

// Global preloader instance
const texturePreloader = new TexturePreloader();

/**
 * Global texture cache to reuse generated textures
 */
class TextureCacheManager {
  private cache: Map<string, PIXI.Texture> = new Map();
  private renderer: PIXI.Renderer | null = null;

  /**
   * Initialize the cache with a renderer and preload textures
   */
  async initialize(renderer: PIXI.Renderer): Promise<void> {
    this.renderer = renderer;
    await texturePreloader.preloadAllTextures(renderer);
  }

  /**
   * Generate a cache key for a graphic configuration
   */
  private generateKey(type: string, params: Record<string, unknown>): string {
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

    // First check preloaded textures
    const preloadKey = `gauge_${radius}_${color}`;
    const preloaded = texturePreloader.getTexture(preloadKey);
    if (preloaded) return preloaded;

    // Fall back to dynamic generation with caching
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
      const needle = (container as PIXI.Container & { needle?: PIXI.Graphics }).needle;
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

    // First check preloaded textures
    const preloadKey = `lever_${width}_${height}_${color}_${vertical}`;
    const preloaded = texturePreloader.getTexture(preloadKey);
    if (preloaded) return preloaded;

    // Fall back to dynamic generation with caching
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

    // First check preloaded textures
    const preloadKey = `knob_${radius}_${color}`;
    const preloaded = texturePreloader.getTexture(preloadKey);
    if (preloaded) return preloaded;

    // Fall back to dynamic generation with caching
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
   * Get a preloaded image texture
   */
  getImageTexture(path: string): PIXI.Texture | null {
    return texturePreloader.getTexture(path);
  }

  /**
   * Clear all cached textures
   */
  clear(): void {
    this.cache.forEach(texture => texture.destroy(true));
    this.cache.clear();
    texturePreloader.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[]; preloadedReady: boolean } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      preloadedReady: texturePreloader.isReady(),
    };
  }
}

// Export singleton instance
export const TextureCache = new TextureCacheManager();