import type { WrongAnswerRecord } from "../../types/quiz";

interface ReviewGateProps {
  isRecallMode?: boolean;
  remainingWrongCount: number;
  reviewedCorrectCount: number;
  reviewedWrongCount: number;
  wrongQueue: readonly WrongAnswerRecord[];
}

export function ReviewGate({
  isRecallMode = false,
  remainingWrongCount,
  reviewedCorrectCount,
  reviewedWrongCount,
  wrongQueue,
}: ReviewGateProps) {
  return (
    <div className="review-gate">
      <div>
        <div className="review-gate-title">{isRecallMode ? "암기 복습 중" : "오답 복습 중"}</div>
        <div className="review-gate-copy">
          {isRecallMode
            ? "공부가 필요하다고 표시한 문법입니다. 모두 알고 있음으로 분류하면 다음 세트로 넘어갑니다."
            : "틀린 문제 복습 중입니다. 이 문제들을 모두 맞혀야 다음 세트로 넘어갈 수 있습니다."}
        </div>
      </div>
      <div className="review-gate-stats">
        <span>
          {isRecallMode ? "남은 학습" : "남은 오답"} {remainingWrongCount}
        </span>
        <span>
          {isRecallMode ? "복습 완료" : "복습 정답"} {reviewedCorrectCount}
        </span>
        <span>
          {isRecallMode ? "다시 학습" : "복습 오답"} {reviewedWrongCount}
        </span>
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
