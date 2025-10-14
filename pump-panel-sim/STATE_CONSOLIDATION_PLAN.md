# State Consolidation Implementation Plan
**Based on:** STATE_MANAGEMENT_AUDIT.md  
**Status:** Ready for Implementation  
**Estimated Effort:** 2-3 developer weeks

---

## Quick Summary

The simulator has **TWO complete state management systems running in parallel**:
1. **SimState** (state.ts + SimulationContext) - React Context pattern
2. **PumpState** (model.ts + engine.ts) - Direct state transformation

**Problem:** 70% property overlap, duplicate updates in SimulatorUI, double computation every frame.

**Solution:** Consolidate to single PumpState-based system with action dispatch pattern.

---

## Implementation Phases

### Phase 1: Unified State Definition ✅ (Proposed in audit)

Create new unified state structure that combines best of both systems.
See Section 10 of audit for complete type definition.

### Phase 2: Extend PumpState (Week 1)

**Step 2.1:** Add missing SimState properties to PumpState
- Add `elevationFt` to runtime section
- Restructure nested objects for clarity
- Keep all existing PumpState features

**Step 2.2:** Create migration adapter
```typescript
// Temporary adapter for gradual migration
function adaptSimStateToPumpState(simState: SimState): Partial<PumpState> {
  return {
    interlocks: {
      engaged: simState.pump.engaged,
      primed: simState.primed,
      // ...
    },
    // ... map all properties
  };
}
```

**Step 2.3:** Update createInitialPumpState
- Ensure all properties from createInitialState are included
- Use Pierce PUC configuration as baseline
- Add comprehensive comments

### Phase 3: Update SimulationContext (Week 2)

**Step 3.1:** Change context to manage PumpState
```typescript
interface SimulationContextValue {
  state: PumpState;  // Changed from SimState
  diagnostics: SimulationDiagnostics;
  dispatch: React.Dispatch<Action>;
}
```

**Step 3.2:** Update reducer to work with PumpState
- Modify each action handler in actions.ts
- Update property paths (e.g., `state.pump.engaged` → `state.interlocks.engaged`)
- Maintain interlock logic

**Step 3.3:** Update TICK action
- Call simulateStep instead of updateTimeBasedState
- Return full updated state

### Phase 4: Remove Duplicate Updates (Week 2)

**Step 4.1:** Simplify SimulatorUI.tsx
- Remove setPumpState local state
- Remove duplicate update logic (lines 191-241)
- Keep only dispatch calls (lines 151-187)
- Get pumpState from context instead of local state

**Step 4.2:** Update Panel component
- Change props to accept state from context
- No changes to PixiJS code needed

### Phase 5: Merge Simulation Logic (Week 3)

**Step 5.1:** Consolidate animation loops
- Keep single loop in SimulationContext
- Remove duplicate loop from SimulatorUI
- Use requestAnimationFrame with throttling

**Step 5.2:** Merge simulateStep and solveHydraulics
- Create single comprehensive update function
- Keep computed results separate (diagnostics)
- Maintain pure function pattern

**Step 5.3:** Remove global governor state
- Move governor state into PumpState
- Update governor.ts functions to accept/return state

### Phase 6: Testing & Cleanup (Week 3)

**Step 6.1:** Update tests
- Modify all tests to use unified state
- Add integration tests for migration
- Performance benchmarking

**Step 6.2:** Remove deprecated code
- Delete state.ts (SimState definition)
- Remove unused solver.ts functions
- Clean up imports

**Step 6.3:** Update documentation
- README updates
- Architecture diagrams
- Migration notes

---

## File Modification Checklist

### Files to Modify:
- [ ] `src/sim/model.ts` - Extend PumpState definition
- [ ] `src/sim/actions.ts` - Update reducer for PumpState
- [ ] `src/sim/SimulationContext.tsx` - Change to PumpState
- [ ] `src/ui/SimulatorUI.tsx` - Remove duplicate state
- [ ] `src/sim/engine.ts` - Remove global state, integrate solver
- [ ] `src/sim/governor.ts` - Update to use PumpState governor
- [ ] `src/ui/Panel.tsx` - Update props (minimal changes)
- [ ] `src/ui/StatusHUD.tsx` - Update state access

### Files to Delete:
- [ ] `src/sim/state.ts` - Replaced by unified PumpState
- [ ] `src/sim/solver.ts` - Logic merged into engine.ts

### Files to Create:
- [ ] `src/sim/migration.ts` - Temporary adapter utilities
- [ ] `tests/integration/state-migration.test.ts` - Migration tests

---

## Breaking Changes & Migration

### API Changes:

**Before:**
```typescript
const { state, result, dispatch } = useSimulation();
// state is SimState
// result is SolverResult
```

**After:**
```typescript
const { state, diagnostics, dispatch } = useSimulation();
// state is UnifiedSimState (PumpState)
// diagnostics is SimulationDiagnostics
```

### Property Path Changes:

| Old (SimState) | New (UnifiedSimState) |
|----------------|----------------------|
| `state.pump.engaged` | `state.interlocks.engaged` |
| `state.pump.governor` | `state.runtime.governor` |
| `state.pump.setpoint` | `state.throttle` or `state.governor.setpoint` |
| `state.pump.rpm` | `state.runtime.rpm` |
| `state.discharges[id].open` | `state.dischargeValvePct[id]` |
| `result.warnings` | `state.warnings` |
| `result.totalGPM` | `state.totalFlowGpm` |

---

## Testing Strategy

### Unit Tests:
- [ ] Test unified state initialization
- [ ] Test each action with new state structure
- [ ] Test governor state management (no globals)

### Integration Tests:
- [ ] Test full simulation loop
- [ ] Test UI → state → render pipeline
- [ ] Test state persistence (if applicable)

### Performance Tests:
- [ ] Benchmark state update time
- [ ] Benchmark render time
- [ ] Compare to baseline (current dual system)
- [ ] Target: 50% reduction in update time

### Regression Tests:
- [ ] All existing features work
- [ ] No loss of functionality
- [ ] Audio/haptic feedback still works
- [ ] Training mode still works

---

## Rollback Plan

### Feature Flag:
```typescript
const USE_UNIFIED_STATE = import.meta.env.VITE_UNIFIED_STATE === 'true';
```

### Gradual Migration:
1. Deploy with feature flag OFF (default)
2. Test in development with flag ON
3. Beta test with select users
4. Enable for all users
5. Remove old code after 1 sprint

### Rollback Procedure:
1. Set feature flag to OFF
2. Revert to previous deployment
3. Investigate issues
4. Fix and redeploy

---

## Success Criteria

✅ **Functional:**
- All existing features work identically
- No regressions in user experience
- All tests pass

✅ **Performance:**
- 50% reduction in state update time
- No increase in memory usage
- Smooth 60fps rendering maintained

✅ **Code Quality:**
- Single source of truth for state
- Reduced code duplication (200+ lines removed)
- Improved type safety
- Better maintainability

✅ **Documentation:**
- Complete migration guide
- Updated architecture docs
- Inline code comments

---

## Risk Mitigation

### High Risk: Breaking Existing Features
**Mitigation:**
- Comprehensive test suite before changes
- Feature flag for gradual rollout
- Parallel operation during transition
- Thorough manual testing

### Medium Risk: Performance Regression
**Mitigation:**
- Benchmark before changes
- Profile during development
- Performance budget monitoring
- Optimization if needed

### Low Risk: Team Confusion
**Mitigation:**
- Clear documentation
- Team training session
- Migration guide
- Code review process

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Get approval** for consolidation approach
3. **Set up feature flag** in environment
4. **Create feature branch** `feature/state-consolidation`
5. **Begin Phase 1** - Unified state definition
6. **Daily standups** to track progress
7. **Code review** at each phase completion
8. **Deploy to staging** with feature flag
9. **User acceptance testing**
10. **Production deployment**

---

**Ready to proceed?** See STATE_MANAGEMENT_AUDIT.md for complete analysis.