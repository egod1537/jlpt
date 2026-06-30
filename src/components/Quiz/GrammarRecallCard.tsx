import { Component } from "react";
import type { QuizQuestion } from "../../types/quiz";
import { QuizProgress } from "./QuizProgress";

interface GrammarRecallCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  onRate: (known: boolean) => void;
}

interface GrammarRecallCardState {
  isMeaningVisible: boolean;
  isSubmitting: boolean;
}

export class GrammarRecallCard extends Component<
  GrammarRecallCardProps,
  GrammarRecallCardState
> {
  state: GrammarRecallCardState = {
    isMeaningVisible: false,
    isSubmitting: false,
  };

  private toggleMeaning = (): void => {
    this.setState((state) => ({ isMeaningVisible: !state.isMeaningVisible }));
  };

  private handleRate = (known: boolean): void => {
    if (this.state.isSubmitting) {
      return;
    }

    this.setState({ isSubmitting: true });
    this.props.onRate(known);
  };

  render() {
    const { question, questionIndex, totalQuestions } = this.props;
    const { isMeaningVisible, isSubmitting } = this.state;
    const meaningId = `${question.id}-meaning`;

    return (
      <div className="quiz-card recall-card">
        <QuizProgress
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
        />

        <div className="quiz-q-label">이 문법의 뜻을 떠올려 보세요</div>
        <div className="recall-expression-wrap">
          <div className="recall-expression">{question.prompt}</div>
          {question.hint && <div className="recall-hint">（{question.hint}）</div>}
        </div>

        <button
          className="recall-reveal-btn"
          aria-controls={meaningId}
          aria-expanded={isMeaningVisible}
          type="button"
          onClick={this.toggleMeaning}
        >
          {isMeaningVisible ? "뜻 숨기기" : "뜻 보기"}
        </button>

        {isMeaningVisible && (
          <div className="recall-meaning" id={meaningId} aria-live="polite">
            <div className="recall-meaning-row">
              <span className="recall-meaning-label">뜻</span>
              <span>{question.subPrompt}</span>
            </div>
            <div className="recall-meaning-row nuance">
              <span className="recall-meaning-label">뉘앙스</span>
              <span>{question.explanation}</span>
            </div>
          </div>
        )}

        <div className="recall-rating-actions">
          <button
            className="recall-rate-btn study"
            disabled={!isMeaningVisible || isSubmitting}
            type="button"
            onClick={() => this.handleRate(false)}
          >
            <span aria-hidden="true">?</span>
            공부하겠음
          </button>
          <button
            className="recall-rate-btn known"
            disabled={!isMeaningVisible || isSubmitting}
            type="button"
            onClick={() => this.handleRate(true)}
          >
            <span aria-hidden="true">✓</span>
            알고있음
          </button>
        </div>
      </div>
    );
  }
}
