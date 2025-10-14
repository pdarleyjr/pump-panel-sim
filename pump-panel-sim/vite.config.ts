/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // PERFORMANCE: Optimized build configuration
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        safari10: true
      }
    },
    rollupOptions: {
      output: {
        // PERFORMANCE: Manual code splitting for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],
          // PixiJS (large library)
          'pixi': ['pixi.js'],
          // Tone.js (audio library)
          'tone': ['tone'],
          // Simulation engine
          'simulation': [
            './src/sim/solver',
            './src/sim/engine',
            './src/sim/state',
            './src/hydraulics/formulas'
          ]
        }
      }
    },
    // Enable source maps for production debugging (external to reduce bundle size)
    sourcemap: 'hidden',
    // Chunk size warnings
    chunkSizeWarningLimit: 600, // 600 KB warning threshold
    // Optimize CSS
    cssCodeSplit: true,
    // Disable module preload polyfill to maintain CSP compliance
    // (polyfill injects inline scripts which violate CSP)
    modulePreload: false
  },
  // PERFORMANCE: Optimized dev server
  server: {
    // Enable CORS for local development
    cors: true,
    // Pre-transform known dependencies for faster dev startup
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx', './src/ui/**/*.tsx']
    }
  },
  // PERFORMANCE: Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'pixi.js', 'tone'],
    exclude: []
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});