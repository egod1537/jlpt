import { useMemo, useState } from "react";
import type { GrammarItem } from "../../types/grammar";
import type { AnswerResult, QuizMode, QuizQuestion } from "../../types/quiz";
import { useQuizSession } from "../../hooks/useQuizSession";
import { buildGrammarQuestionPool, getQuizQuestionCount } from "../../utils/quizSetBuilder";
import { QuizCard } from "./QuizCard";
import { QuizModeSelector } from "./QuizModeSelector";
import { QuizSetResult } from "./QuizSetResult";
import { ReviewGate } from "./ReviewGate";

interface QuizPageProps {
  grammarItems: readonly GrammarItem[];
}

interface QuizSessionPanelProps {
  mode: QuizMode;
  grammarItems: readonly GrammarItem[];
  onModeChange: (mode: QuizMode) => void;
}

const QUIZ_SET_SIZE = 20;
const GROUPED_SET_COUNT = 3;

interface QuizSetOption {
  id: string;
  label: string;
  rangeLabel: string;
  setIndex: number;
  setSize: number;
}

function buildQuizSetOptions(questionCount: number): QuizSetOption[] {
  const options: QuizSetOption[] = [];
  const setCount = Math.ceil(questionCount / QUIZ_SET_SIZE);
  const groupedSetSize = QUIZ_SET_SIZE * GROUPED_SET_COUNT;

  for (let setIndex = 0; setIndex < setCount; setIndex += 1) {
    const startNumber = setIndex * QUIZ_SET_SIZE + 1;
    const endNumber = Math.min((setIndex + 1) * QUIZ_SET_SIZE, questionCount);

    options.push({
      id: `standard-${setIndex}`,
      label: `${setIndex + 1}세트`,
      rangeLabel: `${startNumber}-${endNumber}`,
      setIndex,
      setSize: QUIZ_SET_SIZE,
    });

    if ((setIndex + 1) % GROUPED_SET_COUNT === 0) {
      const groupedSetIndex = Math.floor(setIndex / GROUPED_SET_COUNT);
      const groupedStartNumber = groupedSetIndex * groupedSetSize + 1;
      const groupedEndNumber = Math.min((groupedSetIndex + 1) * groupedSetSize, questionCount);

      options.push({
        id: `grouped-${groupedSetIndex}`,
        label: "묶음 세트",
        rangeLabel: `${groupedStartNumber}-${groupedEndNumber}`,
        setIndex: groupedSetIndex,
        setSize: groupedSetSize,
      });
    }
  }

  if (questionCount > 0) {
    options.push({
      id: "all",
      label: "전체 세트",
      rangeLabel: `1-${questionCount}`,
      setIndex: 0,
      setSize: questionCount,
    });
  }

  return options;
}

function usesSelectableSets(mode: QuizMode): boolean {
  return mode === "meaning" || mode === "grammar" || mode === "example" || mode === "sentenceOrder";
}

function QuizSessionPanel({ mode, grammarItems, onModeChange }: QuizSessionPanelProps) {
  const questionPool = useMemo(() => buildGrammarQuestionPool(mode, grammarItems), [grammarItems, mode]);
  const questionCount = useMemo(() => getQuizQuestionCount(questionPool), [questionPool]);
  const session = useQuizSession({ questionPool, setSize: QUIZ_SET_SIZE });
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [answeredQuestion, setAnsweredQuestion] = useState<QuizQuestion | null>(null);

  const answeredCount = session.correctCount + session.wrongCount;
  const setOptions = useMemo(() => buildQuizSetOptions(questionCount), [questionCount]);
  const currentSetOption = setOptions.find(
    (option) => option.setIndex === session.currentSetIndex && option.setSize === session.currentSetSize,
  );
  const currentSetLabel =
    currentSetOption?.rangeLabel ??
    `${session.currentSetIndex * session.currentSetSize + 1}-${Math.min(
      (session.currentSetIndex + 1) * session.currentSetSize,
      questionCount,
    )}`;
  const accuracy = answeredCount > 0 ? `${Math.round((session.correctCount / answeredCount) * 100)}%` : "—";
  const selectedChoiceId = answerResult?.selectedChoiceId;
  const selectedChoiceIds = answerResult?.selectedChoiceIds;
  const displayQuestion = session.currentQuestion ?? (answerResult !== null ? answeredQuestion : null);
  const isLastQuestion = session.currentQuestionIndex >= session.currentQuestions.length - 1;
  const progressText =
    session.phase === "SET_COMPLETE"
      ? `${session.currentQuestions.length} / ${session.currentQuestions.length}`
      : `${session.currentQuestionIndex + 1} / ${session.currentQuestions.length}`;
  const nextLabel = isLastQuestion
    ? session.phase === "REVIEW"
      ? "복습 계속 →"
      : "세트 결과 보기 →"
    : "다음 문제 →";

  const handleAnswer = (answer: Parameters<typeof session.answerCurrentQuestion>[0]) => {
    if (answerResult !== null || session.currentQuestion === undefined) {
      return;
    }

    setAnswerResult(session.answerCurrentQuestion(answer));
    setAnsweredQuestion(session.currentQuestion);
  };

  const handleNext = () => {
    session.goToNextQuestion();
    setAnswerResult(null);
    setAnsweredQuestion(null);
  };

  const handleStartReview = () => {
    session.startReviewSession();
    setAnswerResult(null);
    setAnsweredQuestion(null);
  };

  const handleNextSet = () => {
    session.goToNextSet();
    setAnswerResult(null);
    setAnsweredQuestion(null);
  };

  const handleSetSelect = (option: QuizSetOption) => {
    session.startSet(option.setIndex, option.setSize);
    setAnswerResult(null);
    setAnsweredQuestion(null);
  };

  const handleReset = () => {
    session.startSet(session.currentSetIndex, session.currentSetSize);
    setAnswerResult(null);
    setAnsweredQuestion(null);
  };

  return (
    <>
      <div className="quiz-header-bar">
        <h2>문법 테스트</h2>
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
                남은 오답 <span className="stat-val wrong">{session.wrongQueue.length}</span>
              </span>
              <span>
                복습 정답 <span className="stat-val correct">{session.reviewedCorrectCount}</span>
              </span>
              <span>
                복습 오답 <span className="stat-val wrong">{session.reviewedWrongCount}</span>
              </span>
            </>
          ) : (
            <>
              <span>
                정답 <span className="stat-val correct">{session.correctCount}</span>
              </span>
              <span>
                오답 <span className="stat-val wrong">{session.wrongCount}</span>
              </span>
              <span>
                정확도 <span className="stat-val">{accuracy}</span>
              </span>
            </>
          )}
        </div>
      </div>

      <QuizModeSelector activeMode={mode} onModeChange={onModeChange} />

      {usesSelectableSets(mode) && (
        <div className="quiz-set-selector" aria-label="문제 세트 선택">
          <span className="set-selector-label">세트 선택</span>
          <div className="set-selector-buttons">
            {setOptions.map((option) => (
              <button
                className={`set-selector-btn${
                  session.currentSetIndex === option.setIndex && session.currentSetSize === option.setSize
                    ? " active"
                    : ""
                }`}
                key={option.id}
                type="button"
                onClick={() => handleSetSelect(option)}
              >
                {option.label}
                <span>{option.rangeLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {session.phase === "REVIEW" && (
        <ReviewGate
          remainingWrongCount={session.wrongQueue.length}
          reviewedCorrectCount={session.reviewedCorrectCount}
          reviewedWrongCount={session.reviewedWrongCount}
          wrongQueue={session.wrongQueue}
        />
      )}

      {displayQuestion === null ? (
        <QuizSetResult
          canProceedToNextSet={session.canProceedToNextSet}
          correctCount={session.correctCount}
          currentSetLabel={currentSetLabel}
          reviewedCorrectCount={session.reviewedCorrectCount}
          reviewedWrongCount={session.reviewedWrongCount}
          totalQuestions={session.currentQuestions.length}
          wrongCount={session.wrongCount}
          wrongQueue={session.wrongQueue}
          onNextSet={handleNextSet}
          onReset={handleReset}
          onStartReview={handleStartReview}
        />
      ) : (
        <QuizCard
          nextLabel={nextLabel}
          question={displayQuestion}
          questionIndex={session.currentQuestionIndex}
          selectedChoiceId={selectedChoiceId}
          selectedChoiceIds={selectedChoiceIds}
          totalQuestions={session.currentQuestions.length}
          onAnswer={handleAnswer}
          onNext={handleNext}
        />
      )}
    </>
  );
}

export function QuizPage({ grammarItems }: QuizPageProps) {
  const [mode, setMode] = useState<QuizMode>("meaning");

  const handleModeChange = (nextMode: QuizMode) => {
    setMode(nextMode);
  };

  return (
    <section className="quiz-section">
      <QuizSessionPanel grammarItems={grammarItems} key={mode} mode={mode} onModeChange={handleModeChange} />
    </section>
  );
}
