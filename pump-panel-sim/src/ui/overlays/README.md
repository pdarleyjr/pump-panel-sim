# Training Overlay System

## Overview

The Training Overlay System provides educational content and guidance when failure scenarios occur during pump operations. These overlays help trainees understand what went wrong and how to correct issues.

## Architecture

### Components

- **`overlayContent.ts`** - Content definitions for all training overlays
- **`TrainingOverlay.tsx`** - React component that monitors simulation and displays overlays
- **`TrainingOverlay.css`** - Styling for overlay UI

### Integration Points

- **`SimulatorUI.tsx`** - Renders TrainingOverlay component
- **`Settings.tsx`** - Toggle for enabling/disabling overlays
- **`App.tsx`** - Manages overlay state across components
- **`InstructorControls.tsx`** - Test buttons for manual trigger

## Overlay Types

### Critical Overlays (Red Border)

#### 1. Cavitation
**Trigger Conditions:**
- Pump engaged
- Intake pressure < 10 PSI
- Flow rate > 100 GPM

**Content:**
- Explanation of cavitation
- Symptoms (pressure loss, noise, vibration)
- Common causes (low intake, closed valves)
- Solutions (check valves, reduce flow, increase supply)

#### 2. Overpressure
**Trigger Conditions:**
- Discharge pressure > 400 PSI

**Content:**
- Danger of overpressure
- Causes (high RPM, closed valves, no DRV)
- Emergency actions (reduce RPM, open valves, engage DRV)

#### 3. Hose Burst
**Trigger Conditions:**
- Triggered via instructor controls or scenario events

**Content:**
- Emergency situation explanation
- Immediate actions (close valve, reduce pressure)
- Prevention tips

### Warning Overlays (Yellow Border)

#### 4. Overheating
**Trigger Conditions:**
- Pump running at high RPM (>2500)
- Low recirculation (<20%)

**Content:**
- Temperature alert
- Symptoms and causes
- Corrective actions (increase recirc, reduce RPM)

#### 5. Tank Empty
**Trigger Conditions:**
- Tank water < 50 gallons
- Tank-to-pump valve open

**Content:**
- Supply exhausted
- Impact on operations
- Required actions (switch to hydrant, begin refill)

### Training Tips (Green Border)

**Types:**
- Intake pressure monitoring
- DRV engagement reminder
- Optimal pressure range
- Pump cooling best practices

## User Interaction

### Overlay Behavior

- **Appearance:** Automatically displayed when failure condition detected
- **Dismissal:** Click "Understood" button or press ESC key
- **Persistence:** Remains until user dismisses
- **Auto-hide:** Once dismissed, won't show again for same condition until pump is disengaged
- **Focus Trap:** Keyboard navigation trapped within overlay
- **Backdrop Click:** Clicking outside overlay dismisses it

### Accessibility Features

- **ARIA Labels:** Screen reader support
- **Keyboard Navigation:** Full keyboard access (ESC to close, Tab navigation)
- **High Contrast:** Enhanced borders in high-contrast mode
- **Focus Management:** Auto-focus on primary button
- **Reduced Motion:** Respects prefers-reduced-motion setting

## Settings

### Toggle Location
Settings → "Show Training Overlays" checkbox

### Storage
User preference saved to `localStorage` as `trainingOverlaysEnabled`

### Default
Enabled for new users (default: `true`)

## Testing

### Manual Testing via Instructor Controls

1. Enable Instructor Mode in Settings
2. Use "Training Overlay Tests" section
3. Test buttons:
   - **Test Overpressure:** Sets throttle to 90% to trigger overpressure
   - **Test Cavitation:** Drops intake pressure to 5 PSI
   - **Test Tank Empty:** (Requires tank level tracking implementation)

### Programmatic Testing

```typescript
import { useTrainingOverlay } from '@/ui/overlays/TrainingOverlay';

// In component
const { showOverlay, hideOverlay } = useTrainingOverlay();

// Show specific overlay
showOverlay('cavitation');
showOverlay('overpressure');

// Hide current overlay
hideOverlay();
```

## Adding New Overlays

### 1. Define Content

Add to `overlayContent.ts`:

```typescript
export const NEW_FAILURE_OVERLAY: OverlayContent = {
  id: 'new_failure',
  type: 'critical', // or 'warning', 'info', 'tip'
  title: 'FAILURE TITLE',
  icon: '⚠️',
  sections: [
    {
      label: 'Section Label',
      items: [
        'Item 1',
        'Item 2'
      ]
    }
  ],
  dismissable: true,
  pauseSimulation: false // optional
};
```

### 2. Add Trigger Logic

In `TrainingOverlay.tsx`, `checkFailureConditions()`:

```typescript
if (/* your condition */) {
  if (!dismissedOverlays.has(NEW_FAILURE_OVERLAY.id)) {
    setActiveOverlay(NEW_FAILURE_OVERLAY);
    return;
  }
}
```

### 3. Update getOverlayContent()

Add to array in `getOverlayContent()`:

```typescript
const allOverlays = [
  // ...existing overlays
  NEW_FAILURE_OVERLAY
];
```

## Content Guidelines

When writing overlay content:

1. **Use Simple Language:** Avoid jargon or explain technical terms
2. **Be Actionable:** Provide clear, numbered steps
3. **Prioritize Safety:** Safety information first
4. **Be Concise:** Keep overlays scannable with bullet points
5. **Use Emojis Sparingly:** Only for status indicators (✓, 🚨, ⚠️)

## Performance Considerations

- **Condition Checking:** Runs on every simulation update (~10 Hz)
- **Render Optimization:** Only renders when overlay is active
- **State Management:** Uses local state with Set for dismissed overlays
- **Memory:** Dismissed overlay IDs stored in Set (minimal memory)

## Future Enhancements

Potential improvements:

1. **Analytics:** Track which overlays appear most frequently
2. **Difficulty Levels:** Show/hide overlays based on user skill level
3. **Localization:** Support multiple languages
4. **Audio Narration:** Optional text-to-speech for overlays
5. **Video Tutorials:** Embedded video demonstrations
6. **Progress Tracking:** Mark overlays as "learned"
7. **Customization:** Allow instructors to edit content
8. **Overlay Queue:** Show multiple overlays in sequence

## Related Documentation

- [Simulation Context](../../sim/README.md) - State management
- [Instructor Controls](../InstructorControls.tsx) - Manual scenario triggers
- [Training Definitions](../../training/definitions.ts) - Control explanations