import { PureComponent } from "react";

interface QuizProgressProps {
  questionIndex: number;
  totalQuestions: number;
}

export class QuizProgress extends PureComponent<QuizProgressProps> {
  render() {
    const { questionIndex, totalQuestions } = this.props;
    const progress =
      totalQuestions > 0 ? Math.round((questionIndex / totalQuestions) * 100) : 0;

    return (
      <div className="quiz-progress">
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          {questionIndex + 1} / {totalQuestions}
        </div>
      </div>
    );
  }
}
