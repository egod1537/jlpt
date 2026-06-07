import type { WrongAnswerRecord } from "../../types/quiz";

interface ReviewGateProps {
  remainingWrongCount: number;
  reviewedCorrectCount: number;
  reviewedWrongCount: number;
  wrongQueue: readonly WrongAnswerRecord[];
}

export function ReviewGate({
  remainingWrongCount,
  reviewedCorrectCount,
  reviewedWrongCount,
  wrongQueue,
}: ReviewGateProps) {
  return (
    <div className="review-gate">
      <div>
        <div className="review-gate-title">오답 복습 중</div>
        <div className="review-gate-copy">
          틀린 문제 복습 중입니다. 이 문제들을 모두 맞혀야 다음 세트로 넘어갈 수 있습니다.
        </div>
      </div>
      <div className="review-gate-stats">
        <span>남은 오답 {remainingWrongCount}</span>
        <span>복습 정답 {reviewedCorrectCount}</span>
        <span>복습 오답 {reviewedWrongCount}</span>
      </div>
      {wrongQueue.length > 0 && (
        <div className="review-gate-queue">
          {wrongQueue.map((record) => (
            <span className="review-queue-chip" key={record.questionId}>
              {record.attemptCount}회
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
