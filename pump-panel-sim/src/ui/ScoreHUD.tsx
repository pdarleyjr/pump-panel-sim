/**
 * Score HUD component for quiz mode
 * Displays current score and percentage in top-right corner
 */

import { QuizState } from '../training/quiz';
import './ScoreHUD.css';

interface ScoreHUDProps {
  /** Current quiz state */
  quiz: QuizState;
  /** Whether to show the HUD */
  visible: boolean;
}

/**
 * Score HUD component
 * Shows score, max score, and percentage during quiz mode
 */
export function ScoreHUD({ quiz, visible }: ScoreHUDProps) {
  if (!visible || !quiz.active) return null;
  
  const percentage = quiz.maxScore > 0 
    ? Math.round((quiz.score / quiz.maxScore) * 100)
    : 0;
  
  return (
    <div className="score-hud">
      <div className="score-value">
        Score: {quiz.score}/{quiz.maxScore}
      </div>
      <div className="score-percentage">
        {percentage}%
      </div>
    </div>
  );
}