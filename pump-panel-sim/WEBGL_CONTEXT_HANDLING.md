# WebGL Context Loss Handling

## Overview

The Fire Pump Panel Simulator implements comprehensive WebGL context loss and restoration handlers to ensure graphics stability and automatic recovery from GPU-related issues.

## Implementation Details

### Core Components

1. **Context Loss Event Handler** ([`src/ui/pixi/context.ts:41-50`](pump-panel-sim/src/ui/pixi/context.ts:41))
   - Listens for `webglcontextlost` events on the canvas
   - **CRITICAL**: Calls `event.preventDefault()` to enable automatic recovery
   - Logs warning messages in development mode
   - Tracks context loss state

2. **Context Restoration Handler** ([`src/ui/pixi/context.ts:52-62`](pump-panel-sim/src/ui/pixi/context.ts:52))
   - Listens for `webglcontextrestored` events
   - PixiJS v8 handles most restoration automatically
   - Forces a re-render to update the display
   - Logs restoration success in development mode

3. **Application Initialization** ([`src/ui/Panel.tsx:40-48`](pump-panel-sim/src/ui/Panel.tsx:40))
   - Device pixel ratio capped at 2x to prevent excessive VRAM usage
   - `preserveDrawingBuffer: false` for better performance
   - Antialias enabled for visual quality

### Memory Optimization Strategies

The application implements several strategies to prevent context loss:

1. **Device Pixel Ratio Capping** ([`Panel.tsx:44`](pump-panel-sim/src/ui/Panel.tsx:44))
   ```typescript
   resolution: Math.min(window.devicePixelRatio || 1, 2)
   ```
   - Prevents excessive memory usage on high-DPI displays (4K+)
   - Caps at 2x for balance between quality and performance

2. **Preserved Drawing Buffer** ([`Panel.tsx:47`](pump-panel-sim/src/ui/Panel.tsx:47))
   ```typescript
   preserveDrawingBuffer: false
   ```
   - Default setting for better GPU performance
   - Reduces memory footprint

3. **Texture Management**
   - TextureCache.ts manages texture lifecycle
   - Proper cleanup with destroy() calls on all components
   - Automatic texture reloading via PixiJS asset management

4. **Proper Resource Cleanup** ([`Panel.tsx:103-110`](pump-panel-sim/src/ui/Panel.tsx:103))
   - Comprehensive cleanup in React useEffect cleanup function
   - Destroys PanelManager and all its components
   - Properly destroys PixiJS application with removeView option

## Testing Context Loss

### Development Mode Debug Helpers

In development mode, two global functions are exposed for testing:

```javascript
// Simulate context loss
__debugLoseWebGLContext()

// Simulate context restoration
__debugRestoreWebGLContext()
```

These functions are available in the browser console when running in development mode.

### Manual Testing Steps

1. **Open Browser Console**
   - Press F12 or right-click → Inspect

2. **Trigger Context Loss**
   ```javascript
   __debugLoseWebGLContext()
   ```
   - Console should show: "WebGL context lost - awaiting restoration"
   - Canvas may briefly freeze or go black

3. **Trigger Context Restoration**
   ```javascript
   __debugRestoreWebGLContext()
   ```
   - Console should show: "WebGL context restored - rebuilding renderer"
   - Canvas should return to normal operation
   - All graphics should be restored automatically

4. **Verify Functionality**
   - Interact with controls (levers, knobs)
   - Check that gauges update properly
   - Confirm no permanent visual corruption

## Real-World Context Loss Scenarios

Context loss can occur in the following situations:

1. **GPU Driver Reset**
   - GPU overheating or instability
   - Driver crashes or updates
   - Hardware issues

2. **Memory Pressure**
   - Too many tabs with GPU-accelerated content
   - Multiple WebGL applications running
   - System running low on VRAM

3. **Browser Tab Backgrounding**
   - Some browsers may release GPU resources for background tabs
   - Context is restored when tab becomes active again

4. **Power Management**
   - Laptop switching between integrated/discrete GPU
   - Power-saving modes on mobile devices

## Benefits

- ✅ **Automatic Recovery**: No page reload required
- ✅ **User Experience**: Seamless recovery without data loss
- ✅ **Stability**: Prevents permanent canvas freezing
- ✅ **Memory Efficiency**: Optimized to reduce context loss frequency
- ✅ **Testing Support**: Built-in debug helpers for development

## Technical Notes

### PixiJS Version Compatibility

This implementation is designed for **PixiJS v8+**:
- Modern API with `app.init()` async initialization
- Automatic texture reloading when using proper asset management
- Simplified restoration process (less manual state management needed)

### Firefox Warnings

Firefox may emit deprecation warnings about `alpha-premult` and `y-flip`. These are upstream WebGL implementation details and are safe to ignore. See: https://github.com/pixijs/pixijs/issues/9428

### Event.preventDefault() Importance

The `event.preventDefault()` call in the `webglcontextlost` handler is **CRITICAL**. Without it:
- The context cannot be recovered
- The canvas becomes permanently frozen
- Page reload is required to restore functionality

This is specified in the WebGL specification and is a requirement for automatic context recovery.

## Related Files

- [`src/ui/pixi/context.ts`](pump-panel-sim/src/ui/pixi/context.ts) - Context loss/restoration handlers
- [`src/ui/Panel.tsx`](pump-panel-sim/src/ui/Panel.tsx) - PixiJS application initialization
- [`src/ui/PanelManager.ts`](pump-panel-sim/src/ui/PanelManager.ts) - Component management and cleanup
- [`src/ui/graphics/TextureCache.ts`](pump-panel-sim/src/ui/graphics/TextureCache.ts) - Texture lifecycle management

## Maintenance

When updating PixiJS or adding new graphics components:

1. Ensure all components implement proper `destroy()` methods
2. Use PixiJS asset management for texture loading
3. Avoid creating excessive textures or high-resolution canvases
4. Test context loss recovery with debug helpers
5. Monitor memory usage in production