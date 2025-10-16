# 🎨 Visual Verification Checklist
**Fire Pump Panel Simulator - Post-Implementation Testing**

---

## 🚀 **Quick Start**

```powershell
cd pump-panel-sim
npm run dev
```

Open: http://localhost:5173/

---

## ✅ **Verification Steps**

### 1. **Initial Load**
- [ ] Page loads without console errors
- [ ] Metal background image visible
- [ ] Settings button in top-right corner
- [ ] Toggle card visible (3 buttons: Water Pump, OK to Pump & Roll, Foam System)
- [ ] Discharge Lines section visible (5 lines)
- [ ] Levels section visible (Tank/Hydrant indicators)

### 2. **Engagement System**
- [ ] Click "Water Pump" button
- [ ] Button flashes green (emerald-500 color)
- [ ] 500ms delay occurs
- [ ] Card swaps to "Pump Data" card
- [ ] Three master gauges appear (Intake, Discharge, Engine)
- [ ] Disengage button appears

### 3. **Source Selection (Tank Mode)**
- [ ] Tank indicator shows "Tank: ON" (green background)
- [ ] Hydrant indicator shows "Hydrant: OFF" (gray background)
- [ ] Master Intake gauge shows 0 PSI
- [ ] Intake slider is disabled (grayed out)
- [ ] Cannot adjust intake pressure

### 4. **Source Selection (Hydrant Mode)**
- [ ] Click "Hydrant" button in Pump Data card
- [ ] Hydrant indicator shows "Hydrant: ON" (green)
- [ ] Tank indicator shows "Tank: OFF" (gray)
- [ ] Master Intake gauge shows 50 PSI (default)
- [ ] Intake slider is enabled
- [ ] Can adjust intake pressure (0-200 range)
- [ ] Gauge needle moves as slider adjusts

### 5. **Master Discharge Gauge (No Lines Open)**
- [ ] Master Discharge gauge shows 0 PSI
- [ ] Needle points to minimum position
- [ ] Digital readout shows "0"

### 6. **Open Discharge Line**
- [ ] Click "Closed" button on Crosslay No. 1
- [ ] Button changes to "Open" (green background)
- [ ] Line gauge shows 0 PSI (setPsi is 0)
- [ ] Master Discharge still shows 0 PSI

### 7. **Set Discharge Pressure**
- [ ] Adjust "Set PSI" slider on Crosslay No. 1 to 150
- [ ] Line gauge needle rotates to ~150 PSI position
- [ ] Digital readout shows "150 PSI"
- [ ] Master Discharge gauge shows 150 PSI
- [ ] Master Discharge needle rotates to match

### 8. **Multiple Discharge Lines**
- [ ] Open Crosslay No. 2
- [ ] Set Crosslay No. 2 to 100 PSI
- [ ] Crosslay No. 2 gauge shows 100 PSI
- [ ] Master Discharge still shows 150 PSI (max of open lines)
- [ ] Set Crosslay No. 2 to 200 PSI
- [ ] Master Discharge now shows 200 PSI (new max)

### 9. **Engine RPM Behavior**
- [ ] Engine gauge shows 750 RPM (pump base idle)
- [ ] Set Crosslay No. 1 to 300 PSI
- [ ] Engine RPM rises (should be ~930 RPM: 750 + 0.6*300)
- [ ] RPM changes smoothly (slew rate)
- [ ] Switch to Hydrant mode with 50 PSI intake
- [ ] RPM drops slightly (~922 RPM: 930 - 0.15*50)

### 10. **Discharge Redline**
- [ ] Set any discharge line to 350 PSI
- [ ] Master Discharge gauge shows redline shading (red arc)
- [ ] Set to 400 PSI
- [ ] Master Discharge clamped at 400 PSI
- [ ] Needle at maximum position

### 11. **All 5 Discharge Lines**
- [ ] Crosslay No. 1 - gauge, toggle, slider work
- [ ] Crosslay No. 2 - gauge, toggle, slider work
- [ ] Crosslay No. 3 - gauge, toggle, slider work
- [ ] Front Trashline - gauge, toggle, slider work
- [ ] 2.5" Line - gauge, toggle, slider work

### 12. **Photoreal Gauges**
- [ ] Each discharge gauge shows photoreal face plate image
- [ ] Face plate is transparent in center (can see background)
- [ ] SVG needle renders on top of plate
- [ ] Needle rotates smoothly
- [ ] Digital PSI readout below gauge
- [ ] Label above gauge

### 13. **Audio System**
- [ ] Click Settings button
- [ ] Settings modal appears
- [ ] Sound toggle shows "OFF"
- [ ] Click Sound toggle to "ON"
- [ ] Close settings
- [ ] Click anywhere on page (gesture)
- [ ] No console errors about AudioContext
- [ ] Increase discharge pressure
- [ ] Audio volume increases with RPM
- [ ] Audio pitch changes with RPM

### 14. **Foam System**
- [ ] Disengage pump
- [ ] Card returns to Toggle card
- [ ] Click "Foam System" button
- [ ] Button flashes green
- [ ] 500ms delay
- [ ] Card swaps to Pump Data
- [ ] Foam level indicator appears (yellow bar)
- [ ] Shows "Foam: 30/30 gal"

### 15. **Disengage**
- [ ] Click "Disengage Pump" button
- [ ] Card swaps back to Toggle card
- [ ] Engine RPM drops to 650 (idle)
- [ ] Audio stops (if enabled)
- [ ] All discharge lines remain in their states

### 16. **Responsive Layout**
- [ ] Desktop (>1024px): 3-column layout (5/4/3 grid)
- [ ] Tablet (768-1024px): Stacks vertically
- [ ] Mobile (<768px): Stacks vertically
- [ ] All controls remain accessible at all sizes

---

## 🐛 **Console Check**

### ✅ **Should NOT See:**
- ❌ "AudioContext was prevented from starting"
- ❌ "Cannot find module '@/...'"
- ❌ "pixi.js not found"
- ❌ Any TypeScript compile errors
- ❌ Any React errors

### ✅ **OK to See:**
- ✅ "Console Ninja not supported" (VS Code extension warning - harmless)
- ✅ Vite HMR messages (development only)
- ✅ React DevTools messages (if installed)

---

## 📊 **Expected Behavior Summary**

### Master Intake Gauge
| Source | Value | Slider | Behavior |
|--------|-------|--------|----------|
| Tank | 0 PSI | Disabled | Always 0, cannot adjust |
| Hydrant | 50 PSI (default) | Enabled | Adjustable 0-200 PSI |

### Master Discharge Gauge
| Condition | Value | Behavior |
|-----------|-------|----------|
| No lines open | 0 PSI | Needle at minimum |
| One line open (150 PSI) | 150 PSI | Matches line setpoint |
| Two lines open (100, 200 PSI) | 200 PSI | Shows maximum |
| Pressure ≥350 PSI | Redline | Red arc visible |
| Pressure >400 PSI | 400 PSI | Clamped at max |

### Engine RPM Gauge
| Condition | RPM | Formula |
|-----------|-----|---------|
| Pump disengaged | 650 | ENGINE_IDLE |
| Pump engaged, no load | 750 | PUMP_BASE_IDLE |
| With discharge pressure | 750 + 0.6*PSI | A = 0.6 |
| With hydrant intake | -0.15*intakePSI | B = 0.15 |
| Example: 300 PSI discharge | 930 | 750 + 0.6*300 |
| Example: 300 PSI + 50 PSI hydrant | 922 | 930 - 0.15*50 |

### Discharge Line Gauges
| State | Gauge Reading | Behavior |
|-------|---------------|----------|
| Closed | 0 PSI | Needle at minimum |
| Open, setPsi=0 | 0 PSI | Needle at minimum |
| Open, setPsi=150 | 150 PSI | Needle at ~60% position |
| Open, setPsi=400 | 400 PSI | Needle at maximum |

---

## 🎯 **Pass/Fail Criteria**

### ✅ **PASS if:**
- All 16 verification steps complete without errors
- Console shows no AudioContext warnings
- Master Intake: 0 for tank, 50 for hydrant
- Master Discharge: max of open lines, 0 when none
- Engine RPM: 650 idle, 750 base, rises with pressure
- All 5 discharge gauges work independently
- Audio starts only after gesture
- Build succeeds

### ❌ **FAIL if:**
- Console shows AudioContext autoplay errors
- Master Intake doesn't default to 50 for hydrant
- Master Discharge doesn't match highest open line
- Engine RPM doesn't rise with discharge pressure
- Discharge gauges don't show photoreal plates
- Audio starts automatically
- Build fails

---

## 🔧 **Troubleshooting**

### Issue: "Cannot find module '@/...'"
**Solution:** Run `npm install` to ensure dependencies are installed

### Issue: "pixi.js not found"
**Solution:** Check `package.json` has `"pixi.js": "^8.2.0"`, run `npm install`

### Issue: AudioContext warnings
**Solution:** Ensure audio only starts after click/keypress (already implemented)

### Issue: Gauges not showing
**Solution:** Check `/assets/crosslay_analog_gauge.png` and `/assets/ChatGPT_Image_Oct_14_2025_05_32_49_PM.png` exist in `public/` folder

### Issue: Master Discharge not updating
**Solution:** Verify at least one discharge line is open AND has setPsi > 0

---

## 📸 **Screenshot Checklist**

For documentation/verification, capture:

1. **Toggle Card** - Initial state with 3 buttons
2. **Engagement Animation** - Green flash on Water Pump button
3. **Pump Data Card** - Three master gauges visible
4. **Tank Mode** - Intake=0, slider disabled
5. **Hydrant Mode** - Intake=50, slider enabled
6. **Discharge Lines** - All 5 lines with gauges
7. **Open Line** - Gauge showing pressure, toggle=Open
8. **Multiple Lines** - Master Discharge showing max
9. **Redline** - Master Discharge at 350+ PSI with red arc
10. **Settings Modal** - Sound toggle visible

---

## ✅ **Verification Complete**

Once all 16 steps pass, the implementation is **verified and ready for deployment**.

**Next:** Deploy to Cloudflare Pages and share with users!

