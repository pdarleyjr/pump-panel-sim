# Mobile Testing Checklist for Fire Pump Panel Simulator

## Device Testing Matrix

### iOS Devices

| Device | OS | Browser | Screen Size | Resolution | Status | Tester | Date | Notes |
|--------|----|---------| ------------|------------|--------|--------|------|-------|
| iPad Mini (6th gen) | iOS 17 | Safari | 8.3" | 2266x1488 | [ ] | | | |
| iPad Air (4th gen) | iOS 17 | Safari | 10.9" | 2360x1640 | [ ] | | | |
| iPad Air (5th gen) | iOS 17 | Safari | 10.9" | 2360x1640 | [ ] | | | |
| iPad Pro 11" (M1) | iOS 17 | Safari | 11" | 2388x1668 | [ ] | | | |
| iPad Pro 11" (M2) | iOS 17 | Safari | 11" | 2388x1668 | [ ] | | | |
| iPad Pro 12.9" (M1) | iOS 17 | Safari | 12.9" | 2732x2048 | [ ] | | | |
| iPad Pro 12.9" (M2) | iOS 17 | Safari | 12.9" | 2732x2048 | [ ] | | | |
| iPad (9th gen) | iOS 16 | Safari | 10.2" | 2160x1620 | [ ] | | | |
| iPad (10th gen) | iOS 17 | Safari | 10.9" | 2360x1640 | [ ] | | | |

### Android Devices

| Device | OS | Browser | Screen Size | Resolution | Status | Tester | Date | Notes |
|--------|----|---------| ------------|------------|--------|--------|------|-------|
| Galaxy Tab S9 | Android 14 | Chrome | 11" | 2560x1600 | [ ] | | | |
| Galaxy Tab S9+ | Android 14 | Chrome | 12.4" | 2800x1752 | [ ] | | | |
| Galaxy Tab S9 Ultra | Android 14 | Chrome | 14.6" | 2960x1848 | [ ] | | | |
| Galaxy Tab S8 | Android 13 | Chrome | 11" | 2560x1600 | [ ] | | | |
| Galaxy Tab S8+ | Android 13 | Chrome | 12.4" | 2800x1752 | [ ] | | | |
| Galaxy Tab A8 | Android 13 | Chrome | 10.5" | 1920x1200 | [ ] | | | |
| Lenovo Tab P11 Pro | Android 12 | Chrome | 11.5" | 2560x1600 | [ ] | | | |
| Pixel Tablet | Android 14 | Chrome | 10.95" | 2560x1600 | [ ] | | | |
| OnePlus Pad | Android 13 | Chrome | 11.61" | 2800x2000 | [ ] | | | |

### Windows Devices

| Device | OS | Browser | Screen Size | Resolution | Status | Tester | Date | Notes |
|--------|----|---------| ------------|------------|--------|--------|------|-------|
| Surface Go 3 | Windows 11 | Edge | 10.5" | 1920x1280 | [ ] | | | |
| Surface Pro 9 | Windows 11 | Edge | 13" | 2880x1920 | [ ] | | | |
| Surface Pro 8 | Windows 11 | Edge | 13" | 2880x1920 | [ ] | | | |

---

## Functional Tests

### Core Controls (Single Touch)

- [ ] **Throttle Lever**
  - [ ] Smooth vertical dragging
  - [ ] Accurate position tracking
  - [ ] Value display updates in real-time
  - [ ] No lag or stuttering
  - [ ] Returns to exact position after release

- [ ] **Tank-to-Pump Valve**
  - [ ] Toggle between 0 and 1 positions
  - [ ] Clear visual state indication
  - [ ] Tactile feedback (if haptics enabled)
  - [ ] Instant response on touch

- [ ] **Discharge Valve Knobs** (Test all 10 valves)
  - [ ] XLay 1 rotary knob
  - [ ] XLay 2 rotary knob
  - [ ] XLay 3 rotary knob
  - [ ] Trash line knob
  - [ ] 2.5" A knob
  - [ ] 2.5" B knob
  - [ ] 2.5" C knob
  - [ ] 2.5" D knob
  - [ ] Deck Gun knob
  - [ ] Rear LDH knob

- [ ] **Primer Button**
  - [ ] Activates on touch
  - [ ] Visual feedback provided
  - [ ] Audio feedback (if enabled)
  - [ ] Momentary action works correctly

- [ ] **Foam System Controls**
  - [ ] Foam percentage knob responds accurately
  - [ ] Foam system toggle switch
  - [ ] Percentage display updates correctly

- [ ] **DRV (Discharge Relief Valve)**
  - [ ] DRV toggle lever (ON/OFF)
  - [ ] DRV setpoint knob (75-300 PSI)
  - [ ] Visual indication of state
  - [ ] Setpoint value display

- [ ] **Governor Controls**
  - [ ] Governor mode toggle (RPM/PSI)
  - [ ] Mode indicator updates
  - [ ] Smooth transition between modes

- [ ] **Tank Fill/Recirculation**
  - [ ] Knob responds to rotation
  - [ ] Percentage display accurate
  - [ ] No interference with tank-to-pump valve

### Multi-Touch Functionality

- [ ] **Two Controls Simultaneously**
  - [ ] Throttle + discharge valve
  - [ ] Two discharge valves at once
  - [ ] Throttle + DRV setpoint
  - [ ] Any two rotary knobs
  - [ ] Lever + toggle switch

- [ ] **Three or More Touches**
  - [ ] Three discharge valves
  - [ ] Multiple valves + throttle
  - [ ] Four+ simultaneous touches
  - [ ] No touch ID confusion
  - [ ] All controls remain responsive

- [ ] **Touch Independence**
  - [ ] One control doesn't affect others
  - [ ] No cross-talk between controls
  - [ ] Touch IDs tracked correctly
  - [ ] Release order doesn't matter

### Gauge Displays

- [ ] **Master Discharge Gauge**
  - [ ] Reads pressure accurately
  - [ ] Smooth needle movement
  - [ ] Danger zone indication
  - [ ] Readable from arm's length

- [ ] **Compound Intake Gauge**
  - [ ] Shows PSI and vacuum correctly
  - [ ] Center zero properly indicated
  - [ ] Transitions smoothly
  - [ ] Dual-scale readable

- [ ] **Individual Intake Gauges**
  - [ ] Driver LDH gauge
  - [ ] Officer LDH gauge
  - [ ] Rear LDH gauge
  - [ ] All gauges update in real-time

- [ ] **Flow Indicators**
  - [ ] XLay line indicators
  - [ ] 2.5" line indicators
  - [ ] Deck gun indicator
  - [ ] Animation smooth at 60 FPS

### Visual Indicators

- [ ] **LED Indicators**
  - [ ] Pump Engaged LED
  - [ ] Color changes appropriately
  - [ ] Brightness visible in daylight
  - [ ] No flickering

- [ ] **Status Badges**
  - [ ] Governor mode indicator
  - [ ] Tank low warning
  - [ ] Cavitation alert
  - [ ] Overpressure warning
  - [ ] Temperature warning
  - [ ] Pressure status badge
  - [ ] Flash animation works correctly

- [ ] **Water Source Indicator**
  - [ ] Shows current source (Tank/Hydrant/Draft/Relay)
  - [ ] Color coding correct
  - [ ] Updates when source changes
  - [ ] Text clearly readable

- [ ] **Tank Level Displays**
  - [ ] Water tank level accurate
  - [ ] Foam tank level accurate
  - [ ] Updates in real-time
  - [ ] Low level warnings trigger

### Training Features

- [ ] **Training Overlays**
  - [ ] Overlays display correctly
  - [ ] Dismiss on touch/tap
  - [ ] Don't block controls
  - [ ] Re-enable after dismissal
  - [ ] Settings toggle works

- [ ] **Startup Checklist**
  - [ ] Checklist displays on tablet
  - [ ] Items can be checked off
  - [ ] Scrolling works smoothly
  - [ ] Close button responsive

- [ ] **Definitions Overlay**
  - [ ] Opens when requested
  - [ ] Touch to close works
  - [ ] Scrolling smooth
  - [ ] Text readable on tablet

### Settings Panel

- [ ] **Settings Access**
  - [ ] Settings button accessible
  - [ ] Panel opens smoothly
  - [ ] No blocking of critical controls
  - [ ] Close on tap outside

- [ ] **Audio Settings**
  - [ ] Audio toggle works
  - [ ] Volume slider responsive
  - [ ] Mute toggle functions
  - [ ] Settings persist

- [ ] **Haptics**
  - [ ] Haptic checkbox toggles
  - [ ] Vibration works if supported
  - [ ] No errors on unsupported devices

- [ ] **Touch Debug Overlay**
  - [ ] Checkbox toggles overlay
  - [ ] Keyboard shortcut (Ctrl+Shift+T) works
  - [ ] Touch points visible
  - [ ] Event log updates
  - [ ] FPS counter accurate
  - [ ] Touch IDs displayed correctly

- [ ] **Instructor Mode**
  - [ ] Toggle enables mode
  - [ ] Room name field editable
  - [ ] WebSocket URL configurable
  - [ ] Connection status displayed

---

## Performance Tests

### Load Time

- [ ] **Initial Load**
  - [ ] Complete load in <3 seconds on WiFi
  - [ ] Complete load in <5 seconds on LTE
  - [ ] Splash screen displays if loading
  - [ ] No white screen flash

- [ ] **Resource Loading**
  - [ ] All assets load correctly
  - [ ] No 404 errors in console
  - [ ] Progressive enhancement works
  - [ ] Offline mode (if supported)

### Frame Rate (FPS)

- [ ] **Idle State**
  - [ ] 60 FPS maintained
  - [ ] No unnecessary rendering
  - [ ] Low CPU usage

- [ ] **Single Control Interaction**
  - [ ] 60 FPS during throttle drag
  - [ ] 60 FPS during knob rotation
  - [ ] No dropped frames
  - [ ] Smooth visual updates

- [ ] **Multi-Touch Interaction**
  - [ ] 60 FPS with 2 simultaneous touches
  - [ ] 55+ FPS with 3-4 touches
  - [ ] 50+ FPS with 5+ touches
  - [ ] Graceful degradation if FPS drops

- [ ] **Complex Scenarios**
  - [ ] 60 FPS with all valves open
  - [ ] 60 FPS with animations active
  - [ ] 60 FPS with audio playing
  - [ ] 60 FPS with training overlays

### Input Latency

- [ ] **Touch Response Time**
  - [ ] <50ms optimal response
  - [ ] <100ms acceptable response
  - [ ] No perceivable lag
  - [ ] Consistent across all controls

- [ ] **Visual Feedback**
  - [ ] Immediate visual response to touch
  - [ ] Highlight appears instantly
  - [ ] Drag follows finger precisely
  - [ ] Release response immediate

### Memory Management

- [ ] **Memory Usage**
  - [ ] Stable over 30-minute session
  - [ ] No continuous memory growth
  - [ ] Garbage collection not blocking
  - [ ] No memory leaks detected

- [ ] **Memory Footprint**
  - [ ] Initial load <100MB
  - [ ] Steady state <150MB
  - [ ] Peak usage <200MB
  - [ ] Returns to baseline after intensive use

### Battery Consumption

- [ ] **Battery Drain**
  - [ ] <20% drain per hour (typical use)
  - [ ] <30% drain per hour (intensive use)
  - [ ] No excessive heating
  - [ ] Screen brightness at 50%

- [ ] **Power Saving Mode**
  - [ ] Still functional in power saving
  - [ ] Acceptable performance degradation
  - [ ] No crashes in power saving
  - [ ] Features still usable

---

## Gesture & Touch Tests

### Accidental Touch Prevention

- [ ] **Palm Rejection**
  - [ ] Palm resting doesn't trigger controls
  - [ ] Only finger touches register
  - [ ] Can rest hand on screen
  - [ ] No false positives

- [ ] **Edge Touches**
  - [ ] Screen edges don't trigger controls
  - [ ] Bezel touches ignored
  - [ ] No accidental swipes
  - [ ] Intentional touches near edge work

### Browser Gesture Prevention

- [ ] **Zoom Prevention**
  - [ ] Pinch-to-zoom disabled on controls
  - [ ] Double-tap zoom disabled
  - [ ] Viewport locked at 1.0 scale
  - [ ] Can still zoom with browser controls

- [ ] **Scroll Prevention**
  - [ ] No vertical scrolling on panel
  - [ ] No horizontal scrolling
  - [ ] Touch-action CSS correct
  - [ ] Settings panel scrolls if needed

- [ ] **Navigation Gestures**
  - [ ] No back swipe interference
  - [ ] No forward swipe interference
  - [ ] No gesture conflicts
  - [ ] Browser controls still accessible

### Touch Target Sizes

- [ ] **WCAG Compliance**
  - [ ] All targets minimum 44x44 pixels
  - [ ] Sufficient spacing between targets
  - [ ] Hit areas extend beyond visual
  - [ ] No overlapping touch areas

- [ ] **Usability**
  - [ ] Can hit targets with finger
  - [ ] No need for stylus
  - [ ] Comfortable to use
  - [ ] No strain or frustration

---

## Orientation & Viewport Tests

### Orientation Support

- [ ] **Landscape Primary**
  - [ ] Optimal layout in landscape
  - [ ] All controls accessible
  - [ ] Proper scaling
  - [ ] No content cutoff

- [ ] **Landscape Secondary**
  - [ ] Works in flipped landscape
  - [ ] No rendering issues
  - [ ] Controls still functional

- [ ] **Portrait** (if supported)
  - [ ] Layout adapts or warns
  - [ ] Controls still usable
  - [ ] No critical loss of function
  - [ ] Message if portrait not recommended

- [ ] **Orientation Changes**
  - [ ] Smooth transition
  - [ ] No state loss
  - [ ] Touch still works after rotation
  - [ ] No need to reload

### Viewport & Scaling

- [ ] **Responsive Layout**
  - [ ] Works on 10" tablets
  - [ ] Works on 11" tablets
  - [ ] Works on 12"+ tablets
  - [ ] Proper scaling for screen size

- [ ] **High DPI Displays**
  - [ ] Sharp text rendering
  - [ ] Crisp graphics
  - [ ] No blurry elements
  - [ ] Proper pixel ratio

- [ ] **Viewport Meta Tag**
  - [ ] Width=device-width
  - [ ] Initial-scale=1.0
  - [ ] User-scalable=no (for controls)
  - [ ] Maximum-scale=1.0

---

## Audio Tests

### Audio Initialization

- [ ] **First Interaction**
  - [ ] Audio context starts on first touch
  - [ ] Clear prompt if audio blocked
  - [ ] No console errors
  - [ ] Works after interaction

### Audio Playback

- [ ] **Control Sounds**
  - [ ] Lever movement sound
  - [ ] Knob rotation sound
  - [ ] Button click sound
  - [ ] Toggle switch sound

- [ ] **Engine Sounds**
  - [ ] Engine idle sound
  - [ ] RPM changes audible
  - [ ] Throttle response audio
  - [ ] Smooth transitions

- [ ] **Alarms & Alerts**
  - [ ] Cavitation alarm
  - [ ] Overpressure alarm
  - [ ] Low tank warning
  - [ ] Temperature warning

- [ ] **Audio Controls**
  - [ ] Volume slider works
  - [ ] Mute toggle works
  - [ ] Settings persist
  - [ ] No crackling or distortion

---

## Network & Connectivity Tests

### WiFi Connection

- [ ] **Strong Signal**
  - [ ] Fast initial load
  - [ ] Real-time updates smooth
  - [ ] No lag in controls
  - [ ] Audio loads quickly

- [ ] **Weak Signal**
  - [ ] Still functional
  - [ ] Acceptable degradation
  - [ ] No crashes
  - [ ] Offline fallback if available

### Cellular Data (if applicable)

- [ ] **LTE/5G**
  - [ ] Loads in reasonable time
  - [ ] Functional over cellular
  - [ ] Data usage reasonable
  - [ ] No excessive data consumption

### Offline Mode (if supported)

- [ ] **Offline Functionality**
  - [ ] Cached version loads
  - [ ] Core features work
  - [ ] Clear offline indicator
  - [ ] Sync when back online

---

## Error Handling & Edge Cases

### Error Scenarios

- [ ] **JavaScript Errors**
  - [ ] Graceful error handling
  - [ ] User-friendly error messages
  - [ ] No blank screens
  - [ ] Recovery possible

- [ ] **Resource Load Failures**
  - [ ] Handles missing assets
  - [ ] Fallback resources used
  - [ ] Clear error indication
  - [ ] Retry mechanism available

- [ ] **Touch Event Errors**
  - [ ] Handles touch cancellation
  - [ ] Recovers from touch errors
  - [ ] No stuck controls
  - [ ] Reset available if needed

### Background/Foreground Transitions

- [ ] **App Backgrounding**
  - [ ] State preserved when backgrounded
  - [ ] Audio stops appropriately
  - [ ] Resumes correctly when foregrounded
  - [ ] No memory issues

- [ ] **Tab Switching**
  - [ ] Pause/resume works
  - [ ] No state corruption
  - [ ] Animation stops/restarts cleanly

### Long-Running Sessions

- [ ] **30-Minute Session**
  - [ ] No performance degradation
  - [ ] Memory remains stable
  - [ ] All features still work
  - [ ] No slowdown

- [ ] **Extended Use**
  - [ ] 1+ hour session stable
  - [ ] No crashes
  - [ ] Battery drain acceptable
  - [ ] Tablet doesn't overheat

---

## Accessibility Tests

### Touch Accessibility

- [ ] **Larger Touch Targets**
  - [ ] Works with accessibility settings
  - [ ] Larger text mode compatible
  - [ ] Increased contrast mode works

### Screen Reader (Optional)

- [ ] **VoiceOver / TalkBack**
  - [ ] Controls properly labeled
  - [ ] State changes announced
  - [ ] Navigation logical
  - [ ] Alternative text present

---

## Security & Privacy Tests

### HTTPS

- [ ] **Secure Connection**
  - [ ] Loads over HTTPS
  - [ ] No mixed content warnings
  - [ ] Valid SSL certificate
  - [ ] No security errors

### Permissions

- [ ] **Permission Requests**
  - [ ] Clear permission prompts
  - [ ] Works if permissions denied
  - [ ] Fallback options available
  - [ ] No unnecessary permissions

---

## Cross-Browser Tests (Same Device)

### iOS Browsers

- [ ] **Safari** (Primary)
  - [ ] Full functionality
  - [ ] Optimal performance
  - [ ] All features work

- [ ] **Chrome on iOS**
  - [ ] Same as Safari (uses WebKit)
  - [ ] No regressions
  - [ ] UI may differ slightly

### Android Browsers

- [ ] **Chrome** (Primary)
  - [ ] Full functionality
  - [ ] Optimal performance
  - [ ] All features work

- [ ] **Samsung Internet**
  - [ ] Compatibility verified
  - [ ] Performance acceptable
  - [ ] No major differences

- [ ] **Firefox**
  - [ ] Basic functionality works
  - [ ] Performance acceptable
  - [ ] Known issues documented

---

## Sign-Off Section

### Test Completion

**Tester Name:** _____________________________  
**Device(s) Tested:** _____________________________  
**Date:** _____________________________  
**Overall Result:** [ ] Pass  [ ] Pass with Issues  [ ] Fail

### Critical Issues Found

```
Issue #1:
Device:
Severity: [ ] Critical  [ ] High  [ ] Medium  [ ] Low
Description:
Steps to Reproduce:
Status:

Issue #2:
Device:
Severity: [ ] Critical  [ ] High  [ ] Medium  [ ] Low
Description:
Steps to Reproduce:
Status:
```

### Recommendations

```
Performance optimizations needed:
-

Feature enhancements suggested:
-

Browser-specific notes:
-

Device-specific notes:
-
```

---

## Notes

- Use Touch Debug Overlay for detailed touch analysis
- Take screenshots of any issues encountered
- Document FPS drops with specific scenarios
- Note any browser console errors
- Record battery drain percentages
- Test in various lighting conditions for screen visibility

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-14  
**Next Review Date:** [To be scheduled after first round of testing]