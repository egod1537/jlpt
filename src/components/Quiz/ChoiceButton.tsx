import { PureComponent } from "react";
import type { QuizChoice } from "../../types/quiz";

interface ChoiceButtonProps {
  choice: QuizChoice;
  answerChoiceId: string;
  selectedChoiceId: string | null;
  compact?: boolean;
  onSelect: (choiceId: string) => void;
}

export class ChoiceButton extends PureComponent<ChoiceButtonProps> {
  private handleSelect = (): void => {
    this.props.onSelect(this.props.choice.id);
  };

  render() {
    const {
      choice,
      answerChoiceId,
      selectedChoiceId,
      compact = false,
    } = this.props;
    const isAnswered = selectedChoiceId !== null;
    const isSelected = choice.id === selectedChoiceId;
    const isCorrectAnswer = choice.id === answerChoiceId;
    const stateClass =
      isAnswered && isCorrectAnswer
        ? " correct"
        : isAnswered && isSelected
          ? " wrong"
          : "";
    const compactClass = compact ? " compact" : "";

    return (
      <button
        className={`choice-btn${stateClass}${compactClass}`}
        disabled={isAnswered}
        type="button"
        onClick={this.handleSelect}
      >
        {choice.text}
      </button>
    );
  }
}
