import { PureComponent } from "react";
import type { QuizMode, QuizSessionState } from "../../types/quiz";

interface QuizHeaderProps {
  currentSetLabel: string;
  mode: QuizMode;
  progressText: string;
  questionCount: number;
  session: QuizSessionState;
}

export class QuizHeader extends PureComponent<QuizHeaderProps> {
  render() {
    const { currentSetLabel, mode, progressText, questionCount, session } =
      this.props;
    const answeredCount = session.correctCount + session.wrongCount;
    const accuracy =
      answeredCount > 0
        ? `${Math.round((session.correctCount / answeredCount) * 100)}%`
        : "—";
    const isRecallMode = mode === "recall";

    return (
      <div className="quiz-header-bar">
        <h2>문법 테스트</h2>
        {questionCount > 0 && (
          <div className="quiz-stats">
            <span>
              현재 세트 <span className="stat-val">{currentSetLabel}</span>
            </span>
            <span>
              진행도 <span className="stat-val">{progressText}</span>
            </span>
            {session.phase === "REVIEW" ? (
              <>
                <span>
                  {isRecallMode ? "남은 학습" : "남은 오답"}{" "}
                  <span className="stat-val wrong">{session.wrongQueue.length}</span>
                </span>
                <span>
                  {isRecallMode ? "복습 완료" : "복습 정답"}{" "}
                  <span className="stat-val correct">
                    {session.reviewedCorrectCount}
                  </span>
                </span>
                <span>
                  {isRecallMode ? "다시 학습" : "복습 오답"}{" "}
                  <span className="stat-val wrong">
                    {session.reviewedWrongCount}
                  </span>
                </span>
              </>
            ) : (
              <>
                <span>
                  {isRecallMode ? "알고 있음" : "정답"}{" "}
                  <span className="stat-val correct">{session.correctCount}</span>
                </span>
                <span>
                  {isRecallMode ? "공부 필요" : "오답"}{" "}
                  <span className="stat-val wrong">{session.wrongCount}</span>
                </span>
                <span>
                  {isRecallMode ? "암기율" : "정확도"}{" "}
                  <span className="stat-val">{accuracy}</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}
