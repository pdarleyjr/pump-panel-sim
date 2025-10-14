/**
 * Training quiz system for pump operation procedures
 * Provides step-by-step guided training with validation and scoring
 */

import { PumpState } from '../sim/model';

/**
 * A single quiz step with validation logic
 */
export interface QuizStep {
  /** Unique identifier for this step */
  id: string;
  /** Description shown to the user */
  description: string;
  /** Validation function to check if step is complete */
  check: (state: PumpState) => boolean;
  /** Points awarded for completing this step */
  points: number;
  /** Optional timeout in seconds */
  timeoutSec?: number;
  /** Optional hint text */
  hint?: string;
}

/**
 * Quiz session state
 */
export interface QuizState {
  /** Whether quiz is currently active */
  active: boolean;
  /** Current score */
  score: number;
  /** Maximum possible score */
  maxScore: number;
  /** Current step index */
  currentStep: number;
  /** Timestamp when quiz started */
  startedAt: number;
  /** Array of completed step IDs */
  completedSteps: string[];
}

/**
 * Pierce PUC startup procedure quiz
 * Teaches proper pump engagement and operation sequence
 */
export const PiercePUC_Startup: QuizStep[] = [
  {
    id: 'engage',
    description: 'Engage the pump',
    check: (s) => s.interlocks.engaged,
    points: 50,
    hint: 'Turn on the main pump engagement switch'
  },
  {
    id: 'open_discharge',
    description: 'Open at least one discharge valve',
    check: (s) => Object.values(s.dischargeValvePct).some(v => v > 0),
    points: 25,
    hint: 'Open any discharge valve to allow water flow'
  },
  {
    id: 'increase_throttle',
    description: 'Increase engine throttle to at least 1000 RPM',
    check: (s) => s.runtime.rpm >= 1000,
    points: 25,
    hint: 'Move the throttle lever to increase engine speed'
  }
];

/**
 * Helper to check current quiz step completion
 * 
 * @param state - Current pump state
 * @param quiz - Current quiz state
 * @param steps - Array of quiz steps
 * @returns Object with completion status and current step
 */
export function checkQuizProgress(
  state: PumpState,
  quiz: QuizState,
  steps: QuizStep[]
): { completed: boolean; step?: QuizStep } {
  if (!quiz.active || quiz.currentStep >= steps.length) {
    return { completed: false };
  }
  
  const step = steps[quiz.currentStep];
  const completed = step.check(state);
  
  return { completed, step };
}

/**
 * Calculate total available points for a quiz
 * 
 * @param steps - Array of quiz steps
 * @returns Total points available
 */
export function calculateMaxScore(steps: QuizStep[]): number {
  return steps.reduce((sum, step) => sum + step.points, 0);
}