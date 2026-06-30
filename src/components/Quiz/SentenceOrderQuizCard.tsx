import { Component } from "react";
import type { QuizQuestion, UserAnswer } from "../../types/quiz";
import { QuizProgress } from "./QuizProgress";
import { QuizResultBox } from "./QuizResultBox";
import {
  SentenceOrderPreview,
  SentenceOrderPrompt,
} from "./SentenceOrderPrompt";
import { getPromptClass, getQuestionLabel } from "./quizPresentation";

interface SentenceOrderQuizCardProps {
  nextLabel: string;
  question: QuizQuestion;
  questionIndex: number;
  selectedChoiceIds?: readonly string[];
  totalQuestions: number;
  onAnswer: (answer: UserAnswer) => void;
  onNext: () => void;
}

interface SentenceOrderQuizCardState {
  draftOrder: string[];
}

export class SentenceOrderQuizCard extends Component<
  SentenceOrderQuizCardProps,
  SentenceOrderQuizCardState
> {
  state: SentenceOrderQuizCardState = {
    draftOrder: [],
  };

  componentDidUpdate(previousProps: SentenceOrderQuizCardProps): void {
    if (previousProps.question.id !== this.props.question.id) {
      this.setState({ draftOrder: [] });
    }
  }

  private handlePieceClick = (choiceId: string): void => {
    if (
      this.props.selectedChoiceIds !== undefined ||
      this.state.draftOrder.includes(choiceId)
    ) {
      return;
    }

    this.setState((state) => ({ draftOrder: [...state.draftOrder, choiceId] }));
  };

  private handlePieceRemove = (choiceId: string): void => {
    if (this.props.selectedChoiceIds === undefined) {
      this.setState((state) => ({
        draftOrder: state.draftOrder.filter((item) => item !== choiceId),
      }));
    }
  };

  private handleReset = (): void => {
    if (this.props.selectedChoiceIds === undefined) {
      this.setState({ draftOrder: [] });
    }
  };

  private handleCheck = (): void => {
    const { question, selectedChoiceIds, onAnswer } = this.props;

    if (
      selectedChoiceIds === undefined &&
      this.state.draftOrder.length === question.choices.length
    ) {
      onAnswer({ selectedPieceIds: this.state.draftOrder });
    }
  };

  render() {
    const {
      nextLabel,
      question,
      questionIndex,
      selectedChoiceIds,
      totalQuestions,
      onNext,
    } = this.props;
    const isAnswered = selectedChoiceIds !== undefined;
    const visibleOrder = selectedChoiceIds ?? this.state.draftOrder;

    return (
      <div className="quiz-card">
        <QuizProgress
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
        />
        <div className="quiz-q-label">{getQuestionLabel(question)}</div>
        <div className={getPromptClass(question)}>{question.prompt}</div>
        <SentenceOrderPrompt question={question} />
        <SentenceOrderPreview
          question={question}
          selectedPieceIds={visibleOrder}
        />

        <div className="selected-order-row">
          {question.choices.map((choice, index) => {
            const selectedChoice = question.choices.find(
              (item) => item.id === visibleOrder[index],
            );

            return (
              <button
                className="selected-order-slot"
                disabled={isAnswered || selectedChoice === undefined}
                key={choice.id}
                type="button"
                onClick={() =>
                  selectedChoice !== undefined &&
                  this.handlePieceRemove(selectedChoice.id)
                }
              >
                <span>{index + 1}</span>
                {selectedChoice?.text ?? ""}
              </button>
            );
          })}
        </div>

        {!isAnswered && visibleOrder.length > 0 && (
          <div className="selected-order-text">
            선택한 순서:{" "}
            {visibleOrder
              .map(
                (choiceId) =>
                  question.choices.find((item) => item.id === choiceId)?.text ??
                  choiceId,
              )
              .join(" / ")}
          </div>
        )}

        <div className="quiz-choices single-column sentence-choice-grid">
          {question.choices.map((choice, index) => {
            const selectedIndex = visibleOrder.indexOf(choice.id);
            const isSelected = selectedIndex >= 0;

            return (
              <button
                className={`choice-btn sentence-piece${
                  isSelected ? " selected" : ""
                }`}
                disabled={isAnswered || isSelected}
                key={choice.id}
                type="button"
                onClick={() => this.handlePieceClick(choice.id)}
              >
                <span className="choice-number">{index + 1}</span>
                {choice.text}
                {isSelected && (
                  <span className="selected-order-mark">{selectedIndex + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {!isAnswered && (
          <div className="sentence-order-actions">
            <button
              className="sentence-undo-btn"
              disabled={this.state.draftOrder.length === 0}
              type="button"
              onClick={this.handleReset}
            >
              초기화
            </button>
            <button
              className="sentence-check-btn"
              disabled={
                this.state.draftOrder.length !== question.choices.length
              }
              type="button"
              onClick={this.handleCheck}
            >
              정답 확인
            </button>
          </div>
        )}

        {isAnswered && (
          <QuizResultBox
            question={question}
            selectedChoiceIds={selectedChoiceIds}
          />
        )}
        {isAnswered && (
          <button className="quiz-next-btn" type="button" onClick={onNext}>
            {nextLabel}
          </button>
        )}
      </div>
    );
  }
}
