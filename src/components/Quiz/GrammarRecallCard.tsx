import { useState } from "react";
import type { QuizQuestion } from "../../types/quiz";

interface GrammarRecallCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  onRate: (known: boolean) => void;
}

export function GrammarRecallCard({
  question,
  questionIndex,
  totalQuestions,
  onRate,
}: GrammarRecallCardProps) {
  const [isMeaningVisible, setIsMeaningVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const progress = Math.round((questionIndex / totalQuestions) * 100);
  const meaningId = `${question.id}-meaning`;

  const handleRate = (known: boolean) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    onRate(known);
  };

  return (
    <div className="quiz-card recall-card">
      <div className="quiz-progress">
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          {questionIndex + 1} / {totalQuestions}
        </div>
      </div>

      <div className="quiz-q-label">이 문법의 뜻을 떠올려 보세요</div>
      <div className="recall-expression">{question.prompt}</div>

      <button
        className="recall-reveal-btn"
        aria-controls={meaningId}
        aria-expanded={isMeaningVisible}
        type="button"
        onClick={() => setIsMeaningVisible((visible) => !visible)}
      >
        {isMeaningVisible ? "뜻 숨기기" : "뜻 보기"}
      </button>

      {isMeaningVisible && (
        <div className="recall-meaning" id={meaningId} aria-live="polite">
          {question.subPrompt}
        </div>
      )}

      <div className="recall-rating-actions">
        <button
          className="recall-rate-btn study"
          disabled={!isMeaningVisible || isSubmitting}
          type="button"
          onClick={() => handleRate(false)}
        >
          <span aria-hidden="true">?</span>
          공부하겠음
        </button>
        <button
          className="recall-rate-btn known"
          disabled={!isMeaningVisible || isSubmitting}
          type="button"
          onClick={() => handleRate(true)}
        >
          <span aria-hidden="true">✓</span>
          알고있음
        </button>
      </div>
    </div>
  );
}
