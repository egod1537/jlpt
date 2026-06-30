import { PureComponent } from "react";
import type { QuizSetOption } from "./quizConfig";

interface QuizSetSelectorProps {
  currentSetId?: string;
  currentSetIndex: number;
  currentSetSize: number;
  options: readonly QuizSetOption[];
  onSelect: (option: QuizSetOption) => void;
}

export class QuizSetSelector extends PureComponent<QuizSetSelectorProps> {
  render() {
    const {
      currentSetId,
      currentSetIndex,
      currentSetSize,
      options,
      onSelect,
    } = this.props;

    return (
      <div className="quiz-set-selector" aria-label="문제 세트 선택">
        <span className="set-selector-label">세트 선택</span>
        <div className="set-selector-buttons">
          {options.map((option) => (
            <button
              className={`set-selector-btn${
                currentSetId === option.id ||
                (currentSetId === undefined &&
                  !option.isCustom &&
                  currentSetIndex === option.setIndex &&
                  currentSetSize === option.setSize)
                  ? " active"
                  : ""
              }`}
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
            >
              {option.label}
              <span>{option.rangeLabel}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
}
