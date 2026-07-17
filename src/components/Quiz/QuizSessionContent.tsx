import { PureComponent } from "react";
import type {
  AnswerResult,
  QuizMode,
  QuizQuestion,
  QuizSessionState,
  UserAnswer,
} from "../../types/quiz";
import { GrammarRecallCard } from "./GrammarRecallCard";
import { QuizCard } from "./QuizCard";
import { QuizHeader } from "./QuizHeader";
import { QuizModeSelector } from "./QuizModeSelector";
import { QuizScopeSelector } from "./QuizScopeSelector";
import { QuizSetResult } from "./QuizSetResult";
import { QuizSetSelector } from "./QuizSetSelector";
import { ReviewGate } from "./ReviewGate";
import {
  type QuizScope,
  type QuizSetOption,
  usesSelectableSets,
} from "./quizConfig";

interface QuizSessionContentProps {
  answerResult: AnswerResult | null;
  currentSetLabel: string;
  displayQuestion: QuizQuestion | null;
  favoriteCount: number;
  mode: QuizMode;
  nextLabel: string;
  progressText: string;
  questionCount: number;
  scope: QuizScope;
  session: QuizSessionState;
  setOptions: readonly QuizSetOption[];
  onAnswer: (answer: UserAnswer) => void;
  onModeChange: (mode: QuizMode) => void;
  onNext: () => void;
  onNextSet: () => void;
  onRecallRate: (known: boolean) => void;
  onReset: () => void;
  onScopeChange: (scope: QuizScope) => void;
  onSetSelect: (option: QuizSetOption) => void;
  onStartReview: () => void;
}

export class QuizSessionContent extends PureComponent<QuizSessionContentProps> {
  render() {
    const {
      answerResult,
      currentSetLabel,
      displayQuestion,
      favoriteCount,
      mode,
      nextLabel,
      progressText,
      questionCount,
      scope,
      session,
      setOptions,
      onAnswer,
      onModeChange,
      onNext,
      onNextSet,
      onRecallRate,
      onReset,
      onScopeChange,
      onSetSelect,
      onStartReview,
    } = this.props;

    return (
      <>
        <QuizHeader
          currentSetLabel={currentSetLabel}
          mode={mode}
          progressText={progressText}
          questionCount={questionCount}
          session={session}
        />
        <QuizModeSelector activeMode={mode} onModeChange={onModeChange} />
        <QuizScopeSelector
          favoriteCount={favoriteCount}
          scope={scope}
          onScopeChange={onScopeChange}
        />

        {usesSelectableSets(mode) && questionCount > 0 && (
          <QuizSetSelector
            currentSetId={session.currentSetId}
            currentSetIndex={session.currentSetIndex}
            currentSetSize={session.currentSetSize}
            options={setOptions}
            onSelect={onSetSelect}
          />
        )}

        {session.phase === "REVIEW" && (
          <ReviewGate
            isRecallMode={mode === "recall"}
            remainingWrongCount={session.wrongQueue.length}
            reviewedCorrectCount={session.reviewedCorrectCount}
            reviewedWrongCount={session.reviewedWrongCount}
            wrongQueue={session.wrongQueue}
          />
        )}

        {questionCount === 0 ? (
          <div className="quiz-empty-state">
            <div className="quiz-empty-symbol" aria-hidden="true">
              ☆
            </div>
            <strong>즐겨찾기한 문법이 없습니다</strong>
            <p>사전 상세 화면에서 문법을 즐겨찾기에 추가한 뒤 다시 테스트하세요.</p>
          </div>
        ) : displayQuestion === null ? (
          <QuizSetResult
            canProceedToNextSet={session.canProceedToNextSet}
            correctCount={session.correctCount}
            currentSetLabel={currentSetLabel}
            isRecallMode={mode === "recall"}
            reviewedCorrectCount={session.reviewedCorrectCount}
            reviewedWrongCount={session.reviewedWrongCount}
            totalQuestions={session.currentQuestions.length}
            wrongCount={session.wrongCount}
            wrongQueue={session.wrongQueue}
            onNextSet={onNextSet}
            onReset={onReset}
            onStartReview={onStartReview}
          />
        ) : mode === "recall" ? (
          <GrammarRecallCard
            key={displayQuestion.id}
            question={displayQuestion}
            questionIndex={session.currentQuestionIndex}
            totalQuestions={session.currentQuestions.length}
            onRate={onRecallRate}
          />
        ) : (
          <QuizCard
            nextLabel={nextLabel}
            question={displayQuestion}
            questionIndex={session.currentQuestionIndex}
            selectedChoiceId={answerResult?.selectedChoiceId}
            selectedChoiceIds={answerResult?.selectedChoiceIds}
            totalQuestions={session.currentQuestions.length}
            onAnswer={onAnswer}
            onNext={onNext}
          />
        )}
      </>
    );
  }
}
