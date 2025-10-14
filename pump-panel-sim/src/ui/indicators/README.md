# Visual Indicators System

This directory contains visual indicator components that provide immediate feedback about pump and system status during training sessions.

## Components

### LEDIndicator
Realistic LED-style indicator lights with glow effects and optional pulsing animation.

**Features:**
- On/off states with configurable colors
- Realistic glow effect using PixiJS graphics
- Optional pulsing animation for alerts
- Customizable radius and label

**Usage:**
```typescript
const led = new LEDIndicator({
  id: 'pump_engaged',
  x: 100,
  y: 100,
  label: 'PUMP ENGAGED',
  radius: 15,
  initialState: { on: false, color: 0x00ff00 }
});
led.create();
led.turnOn(0x00ff00, false); // Turn on green, no pulsing
```

### FlowIndicator
Animated bar graph showing water flow rate with color coding.

**Features:**
- 5-bar vertical display
- Color-coded by flow intensity (blue → cyan → white)
- Smooth animation effect
- GPM value display

**Usage:**
```typescript
const flowIndicator = new FlowIndicator({
  id: 'flow_xlay1',
  x: 200,
  y: 300,
  flowGpm: 0,
  maxFlowGpm: 250
});
flowIndicator.create();
flowIndicator.startAnimation(app);
flowIndicator.setFlow(150); // Update flow rate
```

### StatusBadge
Color-coded status badge with optional flashing for critical alerts.

**Features:**
- Four status levels: normal (green), warning (yellow), critical (red), info (blue)
- Optional flashing animation
- Configurable label and value display
- Show/hide capability

**Usage:**
```typescript
const badge = new StatusBadge({
  id: 'pressure_status',
  x: 400,
  y: 200,
  label: 'PRESSURE',
  status: 'normal',
  value: 'OK'
});
badge.create();
badge.setStatus('critical', 'DANGER');
badge.startFlashing(app);
```

## Integration

Visual indicators are managed by [`PanelManager`](../PanelManager.ts) and automatically update based on simulation state:

1. **Pump Engaged LED** - Shows when pump is actively engaged
2. **Governor Mode Indicator** - Displays current governor mode (RPM/PSI)
3. **Pressure Status Badge** - Warns of dangerous pressure levels
4. **Temperature Status Badge** - Monitors pump and engine temperature
5. **Cavitation Warning** - Alerts when pump is starving for water
6. **Overpressure Warning** - Critical alert for dangerous pressures (>400 PSI)
7. **Tank Low Warning** - Shows when water tank is below 20%
8. **Flow Indicators** - Visual representation of flow for each discharge line

## Color Coding Standards

- **Green (0x00ff00)**: Normal, safe, engaged
- **Yellow/Amber (0xffaa00)**: Warning, caution
- **Red (0xff0000)**: Danger, critical, emergency
- **Blue (0x00aaff)**: Information, RPM mode
- **Cyan (0x00ccff)**: Flow, water-related
- **Gray (0x333333)**: Inactive, disengaged

## Performance

All indicators are optimized for 60 FPS performance:
- Efficient PixiJS graphics rendering
- Minimal draw calls
- Update only when state changes
- Proper cleanup on destroy
- Ticker-based animations use deltaTime for smooth motion

## State Updates

Indicators automatically update based on changes in [`PumpState`](../../sim/model.ts):
- Pressure thresholds trigger status changes
- Temperature monitoring activates warnings
- Flow rates update in real-time
- Cavitation detection shows immediate alerts
- Overpressure tracking with flashing alerts