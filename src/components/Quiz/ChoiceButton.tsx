import type { QuizChoice } from "../../types/quiz";

interface ChoiceButtonProps {
  choice: QuizChoice;
  answerChoiceId: string;
  selectedChoiceId: string | null;
  compact?: boolean;
  onSelect: (choiceId: string) => void;
}

export function ChoiceButton({
  choice,
  answerChoiceId,
  selectedChoiceId,
  compact = false,
  onSelect,
}: ChoiceButtonProps) {
  const isAnswered = selectedChoiceId !== null;
  const isSelected = choice.id === selectedChoiceId;
  const isCorrectAnswer = choice.id === answerChoiceId;
  const stateClass =
    isAnswered && isCorrectAnswer ? " correct" : isAnswered && isSelected ? " wrong" : "";
  const compactClass = compact ? " compact" : "";

  return (
    <button
      className={`choice-btn${stateClass}${compactClass}`}
      disabled={isAnswered}
      type="button"
      onClick={() => onSelect(choice.id)}
    >
      {choice.text}
    </button>
  );
}
