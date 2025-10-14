# State Management Audit Report
**Date:** 2025-10-14  
**Auditor:** Kilo Code  
**Phase:** 5.1 - State Management Unification

---

## Executive Summary

**🔴 CRITICAL FINDING: Dual State Management System Detected**

The Fire Pump Panel Simulator currently operates with **TWO SEPARATE STATE MANAGEMENT SYSTEMS** running in parallel, causing significant code duplication, maintenance burden, and potential for state inconsistency.

### Key Findings:
- 🔴 **System Duplication:** SimState and PumpState coexist with ~70% overlapping properties
- 🟡 **Dual Update Paths:** UI updates both state systems independently in SimulatorUI.tsx
- 🟢 **Good Type Safety:** Both systems have strong TypeScript typing
- 🔴 **Inconsistent Data Flow:** Two animation loops, two simulation engines
- 🟡 **Global Mutable State:** Governor state stored in global variable in engine.ts

### Recommendation:
**CONSOLIDATE to single state system** - This is a clear case where unification will significantly improve maintainability, reduce bugs, and simplify the codebase.

---

## 1. State Structure Analysis

### 1.1 Identified State Systems

#### System A: SimState (state.ts + SimulationContext.tsx)
**Location:** [`src/sim/state.ts`](src/sim/state.ts:60)  
**Management:** React Context + useReducer  
**Update Pattern:** Action dispatch + reducer  

```typescript
interface SimState {
  pump: Pump;                          // Engine & pump settings
  discharges: Record<string, Discharge>; // Discharge line states
  intakes: Record<string, Intake>;     // Intake line states
  elevationFt: number;
  tankToPumpOpen: boolean;
  tankFillRecircPct: number;
  primerActive: boolean;
  primed: boolean;
  isActivePriming: boolean;
  primingProgress: number;
}
```

#### System B: PumpState (model.ts + engine.ts)
**Location:** [`src/sim/model.ts`](src/sim/model.ts:136)  
**Management:** Local state + simulateStep function  
**Update Pattern:** Direct state transformation  

```typescript
interface PumpState {
  throttle: number;
  waterSource: WaterSource;
  intakePsi: Record<IntakeId, number>;
  dischargeValvePct: Record<DischargeId, number>;
  lineConfigs: Record<DischargeId, LineConfig>;
  foam: FoamSystem;
  tankGallons: number;
  engineRpm: number;
  interlocks: PumpInterlocks;
  runtime: PumpRuntime;
  drv: DRVState;
  dischargePsi: number;
  // ... 15+ more properties
}
```

### 1.2 Property Overlap Analysis

| Property Domain | SimState | PumpState | Overlap % |
|----------------|----------|-----------|-----------|
| Pump/Engine Control | ✓ (pump.engaged, pump.rpm, pump.setpoint) | ✓ (interlocks.engaged, runtime.rpm, throttle) | ~80% |
| Governor | ✓ (pump.governor) | ✓ (runtime.governor) | 100% |
| Discharge Lines | ✓ (discharges Record) | ✓ (dischargeValvePct + lineConfigs) | ~70% |
| Foam System | ✓ (pump.foamTankGallons, pump.foamSystemEnabled) | ✓ (foam: FoamSystem) | ~60% |
| DRV | ✓ (pump.drv) | ✓ (drv: DRVState) | 100% |
| Priming | ✓ (primerActive, primed, primingProgress) | ✓ (primerActive, primed, primerTimeRemaining) | ~90% |
| Water Source | ✓ (intakes with source) | ✓ (waterSource) | Conceptual overlap |
| Tank Controls | ✓ (tankToPumpOpen, tankFillRecircPct) | ✓ (tankToPumpOpen, tankFillRecircPct) | 100% |

**Overall Overlap: ~70%** of functionality is duplicated between the two systems.

### 1.3 Unique Properties

**SimState Only:**
- `elevationFt` - Used in hydraulic calculations
- `isActivePriming` - Priming status flag

**PumpState Only:**
- `lineConfigs` - Static discharge line configurations
- `foam.enabledLines: Set<DischargeId>` - Per-line foam tracking
- `warnings: Set<string>` - Active warnings collection
- `pumpTempF`, `engineTempF` - Temperature monitoring
- `isCavitating` - Cavitation state
- `overpressureDurationSec`, `burstLines` - Overpressure tracking

---

## 2. Dual System Usage Pattern

### 2.1 Data Flow Diagram

```
USER INTERACTION
     ↓
handleControlChange (SimulatorUI.tsx)
     ↓
     ├─→ dispatch(action) → SimState reducer → SimulationContext
     │                                              ↓
     │                                         solveHydraulics
     │                                              ↓
     │                                           result
     └─→ setPumpState → PumpState
                           ↓
                     simulateStep
                           ↓
                      diagnostics
```

### 2.2 Problem: Duplicate Updates

In [`SimulatorUI.tsx:113-242`](src/ui/SimulatorUI.tsx:113), every control change triggers:
1. **Dispatch to SimState** (lines 151-187)
2. **Direct update to PumpState** (lines 191-241)

This creates two sources of truth for the same data, leading to:
- Code duplication (~80 lines of duplicate update logic)
- Risk of state drift if one update path is forgotten
- Difficult to maintain consistency
- Testing complexity (must test both paths)

### 2.3 Animation Loop Duplication

**Loop 1:** SimulationContext.tsx lines 34-57
- Dispatches TICK action every 100ms
- Updates SimState via reducer
- Runs solveHydraulics

**Loop 2:** SimulatorUI.tsx lines 79-110
- Updates every frame via requestAnimationFrame
- Calls simulateStep with PumpState
- Independent of Loop 1

---

## 3. Type Safety Review

### 3.1 Strengths ✅

1. **Explicit Typing:** All properties have explicit types
2. **Union Types:** Proper discriminated unions (`Governor`, `WaterSource`, `NozzleType`)
3. **No `any` Types:** Zero usage of `any` in state definitions
4. **Interface Documentation:** Good JSDoc comments on most interfaces

### 3.2 Opportunities 🟡

1. **Branded Types for Units:** Consider branded types for physical units:
   ```typescript
   type PSI = number & { __brand: 'PSI' };
   type GPM = number & { __brand: 'GPM' };
   type RPM = number & { __brand: 'RPM' };
   ```

2. **Enum vs String Literals:** Currently using string literal unions (good), but could add const enums for better autocomplete:
   ```typescript
   export const GovernorMode = {
     RPM: 'RPM',
     PRESSURE: 'PRESSURE',
   } as const;
   ```

3. **Optional vs Required:** Some ambiguity in initialization:
   - `Discharge.foamPct` should probably be required (currently is)
   - `PumpState.warnings` initialized as Set vs Array inconsistency

---

## 4. State Update Patterns

### 4.1 SimState Updates

**Pattern:** Action dispatch → Reducer → Immutable updates  
**Location:** [`actions.ts:34-191`](src/sim/actions.ts:34)

**Strengths:**
- ✅ Pure reducer function
- ✅ Immutable updates using spread operators
- ✅ Type-safe action creators
- ✅ Interlock validation before updates

**Weaknesses:**
- ⚠️ TICK action (line 138) calls `updateTimeBasedState` which returns partial state
  - This bypasses the reducer pattern partially
  - Creates implicit side effects

### 4.2 PumpState Updates

**Pattern:** Function transformation → Direct mutation allowed  
**Location:** [`engine.ts:275-744`](src/sim/engine.ts:275)

**Strengths:**
- ✅ Single comprehensive update function
- ✅ Clear step-by-step logic
- ✅ Diagnostic output alongside state

**Weaknesses:**
- ⚠️ Global mutable state for governor (line 257)
- ⚠️ Direct mutation of `currentState` in some places (line 486-492)
- ⚠️ Complex function (460+ lines) - hard to test

---

## 5. Computed vs Stored State

### 5.1 Incorrectly Stored (Should be Computed)

#### In SimState:
1. **`pump.pdp`** (line 49) - Should be computed from flow and RPM
   - Currently stored but also computed in solver
   - Creates redundancy

2. **`pump.intakePsi`** (line 50) - Should be computed from water source
   - Computed in solver.ts but also stored

#### In PumpState:
1. **`dischargePsi`** (line 171) - Computed value, correctly updated each frame
   - Actually OK - represents "current reading" on gauge

2. **`totalFlowGpm`** (line 180) - Sum of discharge flows
   - Could be computed on-demand, but OK for performance

### 5.2 Correctly Computed

✅ **`SolverResult`** - Not stored in state, computed each render  
✅ **Friction losses** - Computed in hydraulics functions  
✅ **Required PDP** - Computed from nozzle requirements  

### 5.3 Recommendation

**Remove from SimState:**
- `pump.pdp` - Redundant with solver output
- `pump.intakePsi` - Redundant with solver output

These should only exist in `SolverResult` and not be stored in persistent state.

---

## 6. State Initialization

### 6.1 SimState Initialization

**Function:** [`createInitialState()`](src/sim/state.ts:76)  
**Quality:** ⭐⭐⭐⭐ (4/5 stars)

**Strengths:**
- ✅ Complete initialization of all properties
- ✅ Sensible defaults (pump off, valves closed)
- ✅ Proper nested object structure

**Issues:**
- ⚠️ Hard-coded discharge line IDs (xlay1, xlay2, etc.)
- ⚠️ Magic numbers (20 gal foam, 200 ft hose)
- ⚠️ No validation of initial values

### 6.2 PumpState Initialization

**Function:** [`createInitialPumpState()`](src/sim/pierce-puc.ts:160)  
**Quality:** ⭐⭐⭐⭐⭐ (5/5 stars)

**Strengths:**
- ✅ Comprehensive with all properties
- ✅ Uses constants from pierce-puc configuration
- ✅ Detailed comments explaining each default
- ✅ Type-safe construction

**Issues:**
- None significant - this is well done

### 6.3 Discrepancy

The two initialization functions create different starting states:
- **SimState:** 6 discharge lines
- **PumpState:** 10 discharge lines
- **SimState:** 2 intakes
- **PumpState:** 3 intakes

This inconsistency is a red flag for the dual-system approach.

---

## 7. Integration Points & Data Flows

### 7.1 Component Integration Map

```
App.tsx
  ├─ SimulationProvider (SimulationContext)
  │    ├─ state: SimState
  │    ├─ result: SolverResult
  │    └─ dispatch: Action dispatcher
  │
  └─ SimulatorUI
       ├─ Uses: useSimulation() hook → SimState
       ├─ Local: pumpState: PumpState
       │
       ├─ Panel (PixiJS)
       │    └─ Props: pumpState (PumpState only!)
       │
       ├─ StatusHUD
       │    └─ Props: Mixed (state.pump.governor, result.warnings)
       │
       └─ TrainingControls
            └─ Props: pumpState (PumpState only!)
```

### 7.2 Critical Finding: PixiJS Only Uses PumpState

The [`Panel`](src/ui/Panel.tsx:27) component and all PixiJS rendering **only** receives `PumpState`.  
This means **SimState is never directly used for rendering the main pump panel**.

**Current Flow:**
1. User interacts with PixiJS controls
2. onChange callback to SimulatorUI
3. SimulatorUI updates **both** SimState and PumpState
4. Panel re-renders with PumpState
5. SimState + SolverResult used only for StatusHUD warnings

### 7.3 Performance Analysis

**Re-render triggers:**
- SimState change → solveHydraulics (expensive) → re-render
- PumpState change → simulateStep (expensive) → re-render

Both run independently, causing **double computation**!

**Unnecessary Re-renders:**
- StatusHUD depends on both state and result → re-renders on every change
- Panel depends only on pumpState → correct optimization

---

## 8. Documentation & Comments

### 8.1 Quality Assessment

**SimState/Actions:**
- ⭐⭐⭐ (3/5) - Basic documentation, missing detailed state relationships

**PumpState/Model:**
- ⭐⭐⭐⭐ (4/5) - Excellent JSDoc comments on interfaces

**Engine.ts:**
- ⭐⭐⭐⭐⭐ (5/5) - Comprehensive function-level documentation

### 8.2 Missing Documentation

1. State transition diagrams
2. Relationship between SimState and PumpState
3. Migration guide (if one system is to be deprecated)
4. Decision rationale for dual systems

---

## 9. Consolidation Recommendation

### 9.1 Why Consolidation is Warranted

✅ **Significant Duplication:** 70% property overlap  
✅ **Dual Update Paths:** Every control change updates both systems  
✅ **No Clear Separation:** Both track operational state, not UI vs domain  
✅ **Maintenance Burden:** Changes require updating 2 places  
✅ **Performance Impact:** Double computation on every frame  
✅ **Risk of Desync:** One system could diverge from the other  

### 9.2 Consolidation Strategy

**Phase 1: Extend PumpState (Recommended)**
- Keep PumpState as the single source of truth
- Add missing SimState properties to PumpState
- Update Panel/PixiJS to continue using PumpState
- Remove SimState entirely

**Phase 2: Update SimulationContext**
- Change SimulationContext to manage PumpState instead of SimState
- Keep action-based dispatch pattern (good architecture)
- Update reducer to work with PumpState
- Remove parallel state updates in SimulatorUI

**Phase 3: Unify Simulation Logic**
- Merge simulateStep and solveHydraulics into single update function
- Keep computed values (SolverResult) separate
- Remove duplicate animation loops

### 9.3 Migration Benefits

📈 **Lines of Code Reduction:** ~200-300 lines  
⚡ **Performance Improvement:** 50% reduction in computation  
🐛 **Bug Risk Reduction:** Single source of truth  
🧪 **Test Simplification:** Half the test surface area  
📚 **Maintainability:** Clear, single state structure  

---

## 10. Proposed Unified State Structure

```typescript
/**
 * Unified simulation state for fire pump panel
 * Combines operational state, configuration, and runtime data
 */
export interface UnifiedSimState {
  // ===== Engine & Pump Control =====
  engine: {
    engaged: boolean;           // Master pump ON/OFF
    rpm: number;                // Current engine RPM (700-2200)
    throttle: number;           // Throttle position (0-100)
    temperatureF: number;       // Engine temperature
  };
  
  // ===== Governor =====
  governor: {
    mode: 'RPM' | 'PRESSURE';
    setpoint: number;           // RPM or PSI depending on mode
    targetRPM: number;          // Internal PID target
    targetPDP: number;          // Internal PID target
  };
  
  // ===== Pump Hydraulics =====
  pump: {
    dischargePsi: number;       // Pump discharge pressure (gauge reading)
    intakePsi: number;          // Intake pressure (+ for hydrant, - for draft)
    intakeVacuumInHg: number;   // Intake vacuum (draft operations)
    temperatureF: number;       // Pump casing temperature
    primed: boolean;            // Pump is primed
    cavitating: boolean;        // Pump is cavitating
  };
  
  // ===== Water System =====
  water: {
    source: 'tank' | 'hydrant' | 'draft' | 'relay';
    tankGallons: number;
    tankCapacity: number;
    tankToPumpOpen: boolean;
    tankFillRecircPct: number;  // 0-100 (cooling/filling)
  };
  
  // ===== Discharge Lines =====
  discharges: Record<DischargeId, {
    config: LineConfig;         // Static configuration
    valvePosition: number;      // 0-100% open
    flowGpm: number;            // Computed flow rate
    pressurePsi: number;        // Pressure at nozzle
  }>;
  
  // ===== Intake Lines =====
  intakes: Record<IntakeId, {
    pressurePsi: number;        // Intake pressure
    ldh: boolean;               // Is LDH intake
  }>;
  
  // ===== Foam System =====
  foam: {
    enabled: boolean;           // Master foam system ON/OFF
    percent: number;            // Foam concentration (0.1-1.0%)
    tankGallons: number;
    tankCapacity: number;
    enabledLines: Set<DischargeId>;
  };
  
  // ===== DRV (Discharge Relief Valve) =====
  drv: {
    enabled: boolean;
    setpointPsi: number;
    bypassGpm: number;
  };
  
  // ===== Priming System =====
  primer: {
    active: boolean;
    timeRemaining: number;      // Seconds left in 15s cycle
  };
  
  // ===== Operational Tracking =====
  runtime: {
    totalFlowGpm: number;
    warnings: Set<string>;
    overpressureDurationSec: number;
    burstLines: Set<DischargeId>;
    elevationFt: number;        // For hydraulic calculations
  };
}
```

---

## 11. Action Items

### Priority 1: Critical (Do Now)
1. ✅ Document dual system (this audit)
2. 🔴 Decide on consolidation approach
3. 🔴 Create migration plan
4. 🔴 Update architecture documentation

### Priority 2: High (Next Sprint)
1. 🟡 Implement unified state structure
2. 🟡 Update SimulationContext to use unified state
3. 🟡 Remove duplicate update logic in SimulatorUI
4. 🟡 Update Panel to use unified state

### Priority 3: Medium (Following Sprint)
1. 🟢 Merge animation loops
2. 🟢 Consolidate simulation functions
3. 🟢 Update tests
4. 🟢 Performance benchmarking

### Priority 4: Low (Cleanup)
1. ⚪ Remove deprecated code
2. ⚪ Update all documentation
3. ⚪ Add migration notes to README

---

## 12. Risks & Mitigation

### Risk 1: Breaking Changes
**Impact:** High  
**Mitigation:**
- Feature flag for new system
- Parallel operation during transition
- Comprehensive integration tests
- Gradual migration, one component at a time

### Risk 2: Performance Regression
**Impact:** Medium  
**Mitigation:**
- Benchmark before and after
- Profile critical paths
- Maintain separate computation results (SolverResult pattern)

### Risk 3: Lost Functionality
**Impact:** High  
**Mitigation:**
- Complete property mapping document
- Test all features before deprecation
- Keep old code commented for reference

---

## Conclusion

The current dual state system represents **significant technical debt** that should be addressed as a high priority. While both systems work independently, their coexistence creates:
- Maintenance overhead
- Performance penalties
- Risk of state inconsistency
- Developer confusion

**Recommendation: Proceed with consolidation using the strategy outlined in Section 9.**

The unified state structure proposed in Section 10 combines the best aspects of both systems:
- PumpState's comprehensive property set
- SimState's action-based update pattern
- Clear separation of concerns
- Strong typing throughout

Estimated effort: 2-3 developer weeks with thorough testing.

---

**Report End**