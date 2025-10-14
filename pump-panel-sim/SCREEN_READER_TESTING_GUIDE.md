# Screen Reader Testing Guide

## Overview

This document provides comprehensive testing procedures for screen reader accessibility in the Fire Pump Panel Simulator. The application implements WCAG 2.1 Level AA compliance for assistive technology users.

## Supported Screen Readers

### Windows
- **NVDA (NonVisual Desktop Access)** - Recommended, free and open-source
  - Download: https://www.nvaccess.org/
  - Version tested: 2024.1+
- **JAWS (Job Access With Speech)** - Commercial, widely used
  - Website: https://www.freedomscientific.com/products/software/jaws/
  - Version tested: 2024+

### macOS
- **VoiceOver** - Built-in, no installation required
  - Activation: Cmd + F5
  - Version tested: macOS 13+

### Mobile
- **TalkBack (Android)** - Built-in screen reader
- **VoiceOver (iOS)** - Built-in screen reader

## Getting Started with Screen Reader Testing

### NVDA Quick Start (Windows)
1. Download and install NVDA
2. Launch NVDA (Ctrl + Alt + N)
3. Navigate to the simulator in a web browser
4. Use the following keys:
   - **Tab/Shift+Tab**: Navigate between interactive elements
   - **Arrow keys**: Read content line by line
   - **Insert+Down Arrow**: Read from current position
   - **Insert+Space**: Toggle focus/browse mode

### VoiceOver Quick Start (macOS)
1. Enable VoiceOver (Cmd + F5)
2. Navigate to the simulator in Safari (recommended browser)
3. Use the following keys:
   - **Tab**: Navigate between interactive elements
   - **VO+Right/Left Arrow**: Navigate all elements (VO = Ctrl+Option)
   - **VO+A**: Read from current position
   - **Ctrl**: Stop reading

## Testing Procedures

### Test 1: Page Structure and Navigation

**Objective**: Verify proper page structure and landmark regions.

**Steps**:
1. Load the simulator
2. Use screen reader's landmark navigation (NVDA: D key, VoiceOver: VO+U then choose landmarks)
3. Verify the following landmarks are announced:
   - Banner: "Fire Pump Panel Simulator"
   - Main: Primary simulator content
   - Complementary: System status display
   - Complementary: Training controls

**Expected Results**:
- Screen reader announces each landmark region
- User can jump between landmarks efficiently
- "Skip to simulator controls" link is available and functional

**Pass/Fail**: ___________

---

### Test 2: Pump Engage Toggle

**Objective**: Verify master pump control is accessible.

**Steps**:
1. Tab to the pump engage toggle
2. Listen to the announcement
3. Press Space or Enter to toggle
4. Verify status change announcement

**Expected Announcements**:
- Initial state: "Pump master engage toggle, switch, not checked"
- Toggle description: "Master pump engage control. When on, the pump system is active..."
- After toggle: "Pump system engaged and active" (or "disengaged and inactive")

**Pass/Fail**: ___________

---

### Test 3: Settings Panel

**Objective**: Verify all settings controls are properly labeled.

**Steps**:
1. Tab to Settings button
2. Activate to open panel
3. Navigate through all controls with Tab
4. Verify each control has:
   - Clear label
   - Current value announcement
   - Description (if applicable)

**Expected Controls**:
- Audio feedback checkbox
- Master volume slider (0-100%)
- Mute all sounds checkbox
- Haptics checkbox
- Show training overlays checkbox
- Touch debug overlay checkbox
- Instructor mode checkbox
- Room name input (if instructor mode enabled)
- WebSocket URL input (if instructor mode enabled)

**Pass/Fail**: ___________

---

### Test 4: Status HUD Live Updates

**Objective**: Verify dynamic status updates are announced.

**Steps**:
1. Engage the pump
2. Listen for status announcements
3. Adjust throttle
4. Monitor for pressure/RPM announcements
5. Trigger a warning condition

**Expected Announcements**:
- Pump engagement: "Pump engaged. System active."
- Gauge updates (throttled): "Discharge pressure: [value] pounds per square inch"
- Warning announcements: Immediate for critical warnings
- Temperature changes: Announced when significant

**Pass/Fail**: ___________

---

### Test 5: Warning Announcements

**Objective**: Verify critical warnings are announced with appropriate urgency.

**Steps**:
1. Trigger overpressure warning (increase throttle high)
2. Trigger cavitation warning (low intake pressure)
3. Monitor announcement timing and priority

**Expected Behavior**:
- Critical warnings use assertive live region (interrupt current reading)
- Warning text is clear and actionable
- Multiple warnings announced in order of severity
- Visual icons are hidden from screen reader (aria-hidden)

**Critical Warning Examples**:
- "Warning: Overpressure detected. Discharge pressure 380 PSI. Approaching limit."
- "Warning: Cavitation detected. Reduce flow or increase intake pressure immediately."

**Pass/Fail**: ___________

---

### Test 6: Governor Mode Controls

**Objective**: Verify governor controls are accessible and state changes announced.

**Steps**:
1. Navigate to governor controls in the panel
2. Toggle between RPM and PSI modes
3. Adjust setpoint values
4. Verify announcements

**Expected Announcements**:
- Mode switch: "Governor switched to PRESSURE mode. Target 150 PSI."
- Current mode: "Governor mode: RPM" or "Governor mode: PRESSURE"
- Setpoint changes: Announced with appropriate units

**Pass/Fail**: ___________

---

### Test 7: Form Controls

**Objective**: Verify all form inputs have proper labels and descriptions.

**Steps**:
1. Navigate to training mode selector
2. Navigate to instructor controls (if enabled)
3. Tab through all inputs
4. Verify each has:
   - Associated label
   - Current value
   - Help text (aria-describedby)

**Expected Elements**:
- Training mode select: "Select training mode: Off, Tutorial, Explore, Quiz"
- Checkboxes: Clear labels with current state
- Range inputs: Min, max, current value announced
- Text inputs: Label and current value

**Pass/Fail**: ___________

---

### Test 8: Keyboard Navigation

**Objective**: Verify all interactive elements are keyboard accessible.

**Steps**:
1. Navigate entire interface using only keyboard
2. Verify Tab order is logical
3. Test all controls with keyboard:
   - Buttons: Space/Enter
   - Toggles: Space/Enter
   - Sliders: Arrow keys
   - Selects: Arrow keys, Enter to select

**Expected Behavior**:
- All interactive elements reachable via Tab
- Focus indicator visible on all elements
- Controls respond to appropriate keys
- No keyboard traps
- Escape key closes overlays

**Pass/Fail**: ___________

---

### Test 9: PixiJS Canvas Accessibility

**Objective**: Verify canvas-based controls have accessible alternatives.

**Steps**:
1. Navigate to PixiJS controls (throttle lever, governor knob)
2. Verify keyboard controls work
3. Listen for value announcements
4. Check for descriptive labels

**Expected Behavior**:
- Canvas marked as aria-hidden="true"
- Hidden text alternatives provide current values
- Keyboard controls function (arrow keys)
- Value changes announced (debounced)
- Clear descriptions of control purpose

**Known Limitation**: Canvas visual representation not accessible; rely on keyboard controls and announcements.

**Pass/Fail**: ___________

---

### Test 10: Training Overlays

**Objective**: Verify training overlays are announced when displayed.

**Steps**:
1. Enable training overlays in settings
2. Trigger various conditions (cavitation, overpressure, etc.)
3. Verify overlay announcements
4. Test overlay dismissal

**Expected Announcements**:
- Overlay appears: Content announced via live region
- Overlay title and instructions read
- Action buttons properly labeled
- Dismiss action announced

**Pass/Fail**: ___________

---

## Known Limitations

### PixiJS Canvas Elements
**Issue**: Interactive graphics rendered on HTML5 canvas are not natively accessible.

**Workarounds Implemented**:
- Canvas elements marked with `aria-hidden="true"`
- Keyboard controls provided for all canvas interactions
- Hidden text elements provide current values
- Live regions announce value changes
- Detailed ARIA labels describe control function

**Impact**: Screen reader users cannot directly interact with visual controls but have full functionality via keyboard and announcements.

### Gauge Visual Feedback
**Issue**: Gauge needle positions not accessible.

**Workarounds Implemented**:
- Current gauge values in StatusHUD with live regions
- Debounced announcements for significant changes
- Visual values hidden from screen reader
- Screen-reader-only text with expanded units

**Impact**: Minimal - all information available via announcements.

### Real-time Audio Feedback
**Issue**: Audio cues (engine sounds, alarms) may not be perceivable to deaf-blind users.

**Workarounds Implemented**:
- All critical information also provided as text
- Visual warnings complement audio alarms
- Haptic feedback available (if supported)
- Status HUD provides text equivalents

**Impact**: Screen reader users receive equivalent information via text announcements.

## Common Testing Scenarios

### Scenario 1: Startup Procedure
1. Tab to pump engage toggle
2. Activate pump
3. Listen for "Pump engaged. System active."
4. Navigate to throttle control
5. Adjust throttle with arrow keys
6. Listen for RPM announcements
7. Monitor status HUD for gauge values

### Scenario 2: Emergency Response
1. Trigger overpressure (high throttle)
2. Listen for urgent warning: "Warning: Overpressure..."
3. Verify warning uses assertive live region
4. Reduce throttle
5. Confirm warning clears

### Scenario 3: Training Mode
1. Open training controls
2. Change mode to "Tutorial"
3. Navigate through definitions overlay
4. Listen to control descriptions
5. Complete a training exercise

## WCAG 2.1 Level AA Compliance Checklist

- [x] **1.1.1 Non-text Content**: All images/canvas have text alternatives
- [x] **1.3.1 Info and Relationships**: Semantic structure maintained via landmarks and ARIA
- [x] **2.1.1 Keyboard**: All functionality available via keyboard
- [x] **2.1.2 No Keyboard Trap**: Users can navigate away from all elements
- [x] **2.4.3 Focus Order**: Logical tab order maintained
- [x] **2.4.6 Headings and Labels**: Descriptive labels provided for all controls
- [x] **2.4.7 Focus Visible**: Focus indicators present on all interactive elements
- [x] **3.3.2 Labels or Instructions**: Clear form labels and help text
- [x] **4.1.2 Name, Role, Value**: All UI components properly identified via ARIA
- [x] **4.1.3 Status Messages**: Status updates via appropriate live regions

## Troubleshooting

### Screen Reader Not Announcing Changes
**Possible Causes**:
- Live region not properly configured
- Announcement debouncing preventing frequent updates
- Screen reader in forms mode instead of browse mode

**Solutions**:
- Verify live region attributes (aria-live, role)
- Check browser console for errors
- Toggle screen reader mode (NVDA: Insert+Space)

### Focus Not Visible
**Possible Causes**:
- CSS focus styles overridden
- Element not actually receiving focus

**Solutions**:
- Check browser's accessibility inspector
- Verify tabindex is not negative
- Test with different browsers

### Announcements Too Frequent
**Possible Causes**:
- Debouncing not working
- Too many live regions active

**Solutions**:
- Adjust debounce timing in useAnnouncer hook
- Consolidate related announcements

## Recommended Testing Browsers

- **Chrome/Edge**: Best NVDA compatibility
- **Firefox**: Good NVDA compatibility
- **Safari**: Required for VoiceOver on macOS

## Resources

- NVDA User Guide: https://www.nvaccess.org/files/nvda/documentation/userGuide.html
- VoiceOver Guide: https://support.apple.com/guide/voiceover/welcome/mac
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- WebAIM Screen Reader Testing: https://webaim.org/articles/screenreader_testing/

## Reporting Issues

When reporting screen reader accessibility issues, please include:
1. Screen reader and version
2. Browser and version
3. Operating system
4. Steps to reproduce
5. Expected vs. actual announcement
6. Console errors (if any)

## Testing Checklist Summary

- [ ] Page structure and landmarks
- [ ] Pump engage toggle
- [ ] Settings panel controls
- [ ] Status HUD live updates
- [ ] Warning announcements
- [ ] Governor mode controls
- [ ] Form controls
- [ ] Keyboard navigation
- [ ] PixiJS canvas alternatives
- [ ] Training overlays
- [ ] WCAG 2.1 compliance verified

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-14  
**Tested With**: NVDA 2024.1, VoiceOver macOS 13+, JAWS 2024