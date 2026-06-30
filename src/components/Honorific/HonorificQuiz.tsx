import { Component } from "react";
import type { HonorificQuizQuestion } from "../../types/honorific";

interface HonorificQuizProps {
  questions: readonly HonorificQuizQuestion[];
}

interface HonorificQuizState {
  correctCount: number;
  currentIndex: number;
  selectedAnswer: string | null;
}

export class HonorificQuiz extends Component<
  HonorificQuizProps,
  HonorificQuizState
> {
  state: HonorificQuizState = {
    correctCount: 0,
    currentIndex: 0,
    selectedAnswer: null,
  };

  private handleSelect = (answer: string): void => {
    if (this.state.selectedAnswer !== null) {
      return;
    }

    const question = this.props.questions[this.state.currentIndex];
    this.setState((state) => ({
      selectedAnswer: answer,
      correctCount:
        answer === question?.answer ? state.correctCount + 1 : state.correctCount,
    }));
  };

  private handleNext = (): void => {
    this.setState((state) => ({
      currentIndex: state.currentIndex + 1,
      selectedAnswer: null,
    }));
  };

  private handleReset = (): void => {
    this.setState({
      correctCount: 0,
      currentIndex: 0,
      selectedAnswer: null,
    });
  };

  render() {
    const { questions } = this.props;
    const { correctCount, currentIndex, selectedAnswer } = this.state;
    const question = questions[currentIndex];

    if (question === undefined) {
      const score =
        questions.length > 0
          ? Math.round((correctCount / questions.length) * 100)
          : 0;

      return (
        <div className="honorific-quiz-result">
          <span>연습 완료</span>
          <strong>{score}점</strong>
          <p>
            {questions.length}문제 중 {correctCount}문제를 맞혔습니다.
          </p>
          <button type="button" onClick={this.handleReset}>
            다시 풀기
          </button>
        </div>
      );
    }

    const isCorrect = selectedAnswer === question.answer;

    return (
      <div className="honorific-quiz-card">
        <div className="honorific-quiz-progress">
          <span>경어 연습</span>
          <strong>
            {currentIndex + 1} / {questions.length}
          </strong>
        </div>
        <div className="honorific-quiz-context">{question.context}</div>
        <h3>{question.prompt}</h3>
        <div className="honorific-quiz-choices">
          {question.choices.map((choice) => {
            const isSelected = selectedAnswer === choice;
            const isAnswer = choice === question.answer;
            const stateClass =
              selectedAnswer === null
                ? ""
                : isAnswer
                  ? " correct"
                  : isSelected
                    ? " wrong"
                    : "";

            return (
              <button
                className={`honorific-quiz-choice${stateClass}`}
                disabled={selectedAnswer !== null}
                key={choice}
                type="button"
                onClick={() => this.handleSelect(choice)}
              >
                {choice}
              </button>
            );
          })}
        </div>
        {selectedAnswer !== null && (
          <div
            className={`honorific-quiz-explanation${
              isCorrect ? " correct" : " wrong"
            }`}
          >
            <strong>{isCorrect ? "정답입니다." : `정답: ${question.answer}`}</strong>
            <p>{question.explanation}</p>
          </div>
        )}
        {selectedAnswer !== null && (
          <button
            className="honorific-quiz-next"
            type="button"
            onClick={this.handleNext}
          >
            {currentIndex === questions.length - 1 ? "결과 보기" : "다음 문제"} →
          </button>
        )}
      </div>
    );
  }
}
