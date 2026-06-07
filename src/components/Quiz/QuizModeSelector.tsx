import type { QuizMode } from "../../types/quiz";
import { quizModes } from "../../utils/quizGenerator";

interface QuizModeSelectorProps {
  activeMode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
}

export function QuizModeSelector({ activeMode, onModeChange }: QuizModeSelectorProps) {
  return (
    <div className="quiz-mode-sel">
      {quizModes.map((mode) => (
        <button
          className={`mode-btn${mode.id === activeMode ? " active" : ""}`}
          key={mode.id}
          type="button"
          onClick={() => onModeChange(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
