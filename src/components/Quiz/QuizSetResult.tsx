import type { WrongAnswerRecord } from "../../types/quiz";

interface QuizSetResultProps {
  currentSetLabel: string;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  wrongQueue: readonly WrongAnswerRecord[];
  reviewedCorrectCount: number;
  reviewedWrongCount: number;
  canProceedToNextSet: boolean;
  onStartReview: () => void;
  onNextSet: () => void;
  onReset: () => void;
}

function getGrade(score: number): string {
  if (score >= 90) return "완벽해요!";
  if (score >= 70) return "잘했어요!";
  if (score >= 50) return "더 연습해요";
  return "다시 도전!";
}

export function QuizSetResult({
  currentSetLabel,
  correctCount,
  wrongCount,
  totalQuestions,
  wrongQueue,
  reviewedCorrectCount,
  reviewedWrongCount,
  canProceedToNextSet,
  onStartReview,
  onNextSet,
  onReset,
}: QuizSetResultProps) {
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const hasWrongAnswers = wrongQueue.length > 0;
  const hasReviewed = reviewedCorrectCount + reviewedWrongCount > 0;

  return (
    <div className="quiz-card">
      <div className="quiz-end-screen">
        <div className="quiz-q-label">현재 세트 {currentSetLabel}</div>
        <div className="score">{score}점</div>
        <div className="score-sub">
          {totalQuestions}문제 중 {correctCount}개 정답, {wrongCount}개 오답 — {getGrade(score)}
        </div>

        {hasWrongAnswers ? (
          <div className="review-lock-box">
            <div className="review-lock-title">이번 세트에서 {wrongQueue.length}문제를 틀렸습니다.</div>
            <p>틀린 문제를 모두 다시 맞혀야 다음 세트로 넘어갈 수 있습니다.</p>
          </div>
        ) : (
          <div className="review-complete-box">
            {hasReviewed
              ? "현재 세트의 오답을 모두 복습했습니다. 다음 세트로 넘어갈 수 있습니다."
              : "현재 세트를 모두 맞혔습니다. 다음 세트로 넘어갈 수 있습니다."}
          </div>
        )}

        <div className="set-result-actions">
          {hasWrongAnswers && (
            <button className="quiz-restart-btn" type="button" onClick={onStartReview}>
              오답 복습 시작
            </button>
          )}
          <button className="quiz-next-set-btn" disabled={!canProceedToNextSet} type="button" onClick={onNextSet}>
            다음 세트로
          </button>
          <button className="quiz-secondary-btn" type="button" onClick={onReset}>
            현재 세트 다시 시작
          </button>
        </div>
      </div>
    </div>
  );
}
