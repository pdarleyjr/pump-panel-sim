/**
 * Property-based tests for hydraulics formulas
 * Verifies mathematical invariants hold across input ranges
 */
import { describe, it } from 'vitest';
import fc from 'fast-check';
import { hazenWilliamsFLpsiPer100ft, smoothBoreFlow } from './formulas';

describe('Hazen-Williams invariants', () => {
  it('friction loss increases monotonically with flow', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 50, max: 1200, noNaN: true }),  // Q1
        fc.double({ min: 10, max: 100, noNaN: true }),   // deltaQ
        fc.double({ min: 1.5, max: 3.0, noNaN: true }),  // diameter
        fc.integer({ min: 100, max: 180 }),              // C coefficient
        (q1, deltaQ, d, C) => {
          const q2 = q1 + deltaQ;
          const fl1 = hazenWilliamsFLpsiPer100ft(q1, d, C);
          const fl2 = hazenWilliamsFLpsiPer100ft(q2, d, C);
          return fl2 >= fl1; // Friction increases with flow
        }
      ),
      { numRuns: 100 }
    );
  });

  it('friction loss decreases with larger diameter', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 800, noNaN: true }),  // flow
        fc.double({ min: 1.5, max: 2.5, noNaN: true }),  // d1
        fc.double({ min: 0.25, max: 1.0, noNaN: true }), // deltaD
        fc.integer({ min: 100, max: 180 }),              // C
        (q, d1, deltaD, C) => {
          const d2 = d1 + deltaD;
          const fl1 = hazenWilliamsFLpsiPer100ft(q, d1, C);
          const fl2 = hazenWilliamsFLpsiPer100ft(q, d2, C);
          return fl2 <= fl1; // Friction decreases with diameter
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns non-negative values', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 2000, noNaN: true }),
        fc.double({ min: 1.0, max: 6.0, noNaN: true }),
        fc.integer({ min: 80, max: 180 }),
        (q, d, C) => {
          const fl = hazenWilliamsFLpsiPer100ft(q, d, C);
          return fl >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Smooth-bore flow invariants', () => {
  it('flow increases with nozzle pressure', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.5, max: 1.5, noNaN: true }),  // tip diameter
        fc.double({ min: 20, max: 100, noNaN: true }),   // NP1
        fc.double({ min: 10, max: 50, noNaN: true }),    // deltaNP
        (d, np1, deltaNP) => {
          const np2 = np1 + deltaNP;
          const q1 = smoothBoreFlow(d, np1);
          const q2 = smoothBoreFlow(d, np2);
          return q2 >= q1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('flow increases with tip diameter', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.5, max: 1.5, noNaN: true }),  // d1
        fc.double({ min: 0.1, max: 0.5, noNaN: true }),  // deltaD
        fc.double({ min: 30, max: 100, noNaN: true }),   // NP
        (d1, deltaD, np) => {
          const d2 = d1 + deltaD;
          const q1 = smoothBoreFlow(d1, np);
          const q2 = smoothBoreFlow(d2, np);
          return q2 >= q1;
        }
      ),
      { numRuns: 100 }
    );
  });
});