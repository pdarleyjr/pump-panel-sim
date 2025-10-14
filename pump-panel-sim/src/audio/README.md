# Audio System Documentation

## Overview

The Fire Pump Panel Simulator uses **Tone.js** for comprehensive audio synthesis. All sounds are generated programmatically in real-time—no external audio files required. The system integrates seamlessly with simulation state to provide realistic audio feedback.

## Architecture

### Core Components

1. **`boot.ts`** - Audio context initialization and autoplay handling
2. **`engine.ts`** - Engine RPM synthesis with smooth transitions
3. **`controls.ts`** - Valve, switch, and control feedback sounds
4. **`alarms.ts`** - Warning and alert sound synthesis
5. **`ambient.ts`** - Water flow and environmental sounds
6. **`AudioProvider.tsx`** - Central orchestration and state integration
7. **`haptics.ts`** - Vibration feedback (complementary to audio)

### Sound Categories

#### Engine Sounds
- **Idle (600 RPM)**: Low rumble using sawtooth oscillator + brown noise
- **Operating (800-2200 RPM)**: Pitch scales with RPM, smooth transitions
- **Characteristics**: Dynamic filtering, volume adjustment based on RPM

#### Valve/Control Sounds
- **Tank-to-pump valve**: Metallic clunk (MetalSynth at 180Hz/150Hz)
- **Discharge valves**: Similar but lighter (200Hz/170Hz)
- **DRV toggle**: Sharp mechanical click
- **Governor switch**: Soft beep (C5 sine wave)
- **Primer**: 15-second mechanical whirr with variations
- **Pump engage/disengage**: Two-tone metallic engagement

#### Warning Alarms
- **Overpressure (>400 PSI)**: Urgent square wave beeping at 2Hz (G5)
- **Cavitation**: Brown noise with bandpass filtering and grinding modulation
- **Overheating**: Progressive sine tones (440Hz → 554Hz → 659Hz) with tremolo
- **Tank empty**: Pleasant descending chime (E5 → C5 → G4)

#### Ambient Sounds
- **Water flow**: White noise with bandpass filter, scales with GPM (0-2000)
- **Foam system**: Pink noise with high-pass filtering (hissing quality)
- **Hose burst**: Explosive whoosh + metallic impact + three-tone alarm
- **Pressure relief**: White noise burst with bandpass filtering

## Integration with Simulation

### State Monitoring

The [`AudioProvider`](AudioProvider.tsx:1) monitors these simulation properties:

```typescript
// Engine state
simState.pump.engaged      // Start/stop engine sound
simState.pump.rpm          // Update engine pitch

// Controls
simState.tankToPumpOpen    // Tank valve sounds
simState.discharges[].open // Discharge valve sounds
simState.pump.governor     // Governor mode beeps
simState.isActivePriming   // Primer whirr

// Alarms
simState.pump.pdp > 400    // Overpressure alarm
simResult.warnings         // Cavitation, overheating
simState.pump.foamTankGallons === 0  // Tank empty chime

// Ambient
simResult.totalGPM         // Water flow volume
simState.discharges[].foamPct > 0  // Foam system hiss
```

### Change Detection

Uses `useRef` to track previous state and detect changes:
- Valve position changes trigger open/close sounds
- Governor mode switches trigger beep
- Warning appearance/disappearance starts/stops alarms
- Flow rate changes update water flow volume

### Performance Considerations

- Audio updates at 100ms intervals (via TICK events)
- Smooth ramping prevents audio clicks
- Automatic cleanup of one-shot sounds
- Minimal CPU overhead (~1-2% on modern hardware)

## Usage

### Enabling Audio

Audio requires a user gesture (autoplay policy compliance):

```tsx
const { enabled, start, audioReady } = useAudio();

// In a click handler:
await start();
```

### Volume Controls

```tsx
const { masterVolume, muted, setMasterVolume, setMuted } = useAudio();

setMasterVolume(0.5);  // 0.0 to 1.0
setMuted(true);        // Instant mute
```

### Manual Sound Triggering

```tsx
import { playButtonClick, playTankValveOpen } from './controls';
import { playOverpressureAlarm, stopOverpressureAlarm } from './alarms';

// One-shot sounds
await playButtonClick();
await playTankValveOpen();

// Continuous sounds (must manually stop)
await playOverpressureAlarm();
// ... later ...
stopOverpressureAlarm();
```

## Technical Details

### Audio Synthesis Techniques

1. **Engine Sound**: 
   - Sawtooth oscillator for fundamental frequency
   - Brown noise for mechanical rumble
   - Low-pass filtering for realistic character
   - Frequency = (RPM / 120) × 2 (engine harmonics)

2. **Metallic Sounds**:
   - Tone.MetalSynth with high harmonicity (4.8-6.0)
   - High modulation index (28-50) for metallic timbre
   - Short decay envelopes for percussive quality

3. **Alarms**:
   - Square waves for urgency (overpressure)
   - Filtered noise for grinding/rumbling (cavitation)
   - Sine waves with tremolo for progressive warnings

4. **Water Flow**:
   - White noise base
   - Bandpass filter (1000-1800 Hz based on flow)
   - Logarithmic volume scaling for natural perception

### CSP Compliance

All audio generation is contained in separate modules—no inline scripts or `eval()`. Synthesis occurs entirely through Tone.js API calls, maintaining Content Security Policy compliance.

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (requires user gesture for audio start)
- **Mobile**: Supported (iOS requires user interaction)

## Future Enhancements

### Potential Additions

1. **Spatial Audio**: Use Tone.Panner3D for directional sound
2. **Realistic Samples**: Hybrid approach with recorded samples + synthesis
3. **Environmental Effects**: Reverb for indoor/outdoor scenarios
4. **Communication Radio**: Simulated radio chatter/instructions
5. **Weather Sounds**: Rain, wind, etc. for scenario realism

### Performance Optimization

- Consider Web Worker for audio processing (if needed)
- Implement sound pooling for frequently-used effects
- Add quality presets (low/medium/high) for different devices

## Troubleshooting

### Audio Not Playing

1. **Check autoplay policy**: User must interact with page first
2. **Verify audio enabled**: Check Settings panel
3. **Check browser console**: Look for Tone.js errors
4. **Test audio context**: `Tone.getContext().state` should be "running"

### Audio Stuttering

1. **Reduce master volume**: Lower CPU load
2. **Check browser performance**: Close other tabs
3. **Disable other audio effects**: Temporarily mute to isolate issue

### Volume Too Loud/Quiet

1. **Adjust master volume**: Settings panel slider
2. **Check system volume**: OS-level settings
3. **Modify source volumes**: Edit individual synth volume values in code

## API Reference

See individual module files for detailed function documentation:
- [`engine.ts`](engine.ts:1) - Engine sound functions
- [`controls.ts`](controls.ts:1) - Control feedback functions
- [`alarms.ts`](alarms.ts:1) - Warning/alarm functions
- [`ambient.ts`](ambient.ts:1) - Environmental sound functions
- [`AudioProvider.tsx`](AudioProvider.tsx:1) - Provider hooks and context