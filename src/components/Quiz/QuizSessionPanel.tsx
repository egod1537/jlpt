import { Component } from "react";
import { QuizSessionController } from "../../services/quiz/QuizSessionController";
import type { GrammarItem } from "../../types/grammar";
import type {
  AnswerResult,
  QuizMode,
  QuizQuestion,
  QuizSessionState,
  UserAnswer,
} from "../../types/quiz";
import { buildGrammarQuestionPool } from "../../utils/quiz/quizQuestionPool";
import { getQuizQuestionCount } from "../../utils/quizSetBuilder";
import { GrammarRecallCard } from "./GrammarRecallCard";
import { QuizCard } from "./QuizCard";
import { QuizHeader } from "./QuizHeader";
import { QuizModeSelector } from "./QuizModeSelector";
import { QuizScopeSelector } from "./QuizScopeSelector";
import { QuizSetResult } from "./QuizSetResult";
import { QuizSetSelector } from "./QuizSetSelector";
import { ReviewGate } from "./ReviewGate";
import {
  buildQuizSetOptions,
  buildQuizStorageKey,
  MONO_KOTO_GRAMMAR_SET_ID,
  NI_GRAMMAR_SET_ID,
  QUIZ_SET_SIZE,
  type QuizScope,
  type QuizSetOption,
  usesSelectableSets,
} from "./quizConfig";

interface QuizSessionPanelProps {
  favoriteIds: readonly string[];
  grammarItems: readonly GrammarItem[];
  mode: QuizMode;
  scope: QuizScope;
  onModeChange: (mode: QuizMode) => void;
  onScopeChange: (scope: QuizScope) => void;
}

interface QuizSessionPanelState {
  answerResult: AnswerResult | null;
  answeredQuestion: QuizQuestion | null;
  session: QuizSessionState;
}

export class QuizSessionPanel extends Component<
  QuizSessionPanelProps,
  QuizSessionPanelState
> {
  private readonly controller: QuizSessionController;
  private readonly customQuestionPools: ReadonlyMap<
    string,
    readonly QuizQuestion[]
  >;
  private readonly questionCount: number;
  private readonly setOptions: readonly QuizSetOption[];

  constructor(props: QuizSessionPanelProps) {
    super(props);

    const favoriteIdSet = new Set(props.favoriteIds);
    const allQuestions = buildGrammarQuestionPool(props.mode, props.grammarItems);
    const questionPool =
      props.scope === "all"
        ? allQuestions
        : allQuestions.filter(
            (question) =>
              question.sourceGrammarId !== undefined &&
              favoriteIdSet.has(question.sourceGrammarId),
          );
    const niGrammarIds = new Set(
      props.grammarItems
        .filter((item) => item.expression.trimStart().startsWith("に"))
        .map((item) => item.id),
    );
    const monoKotoGrammarIds = new Set(
      props.grammarItems
        .filter((item) => /^(もの|こと)/.test(item.expression.trimStart()))
        .map((item) => item.id),
    );
    const niGrammarQuestionPool = questionPool.filter(
      (question) =>
        question.sourceGrammarId !== undefined &&
        niGrammarIds.has(question.sourceGrammarId),
    );
    const monoKotoGrammarQuestionPool = questionPool.filter(
      (question) =>
        question.sourceGrammarId !== undefined &&
        monoKotoGrammarIds.has(question.sourceGrammarId),
    );

    this.customQuestionPools = new Map([
      [NI_GRAMMAR_SET_ID, niGrammarQuestionPool],
      [MONO_KOTO_GRAMMAR_SET_ID, monoKotoGrammarQuestionPool],
    ]);
    this.questionCount = getQuizQuestionCount(questionPool);
    this.setOptions = buildQuizSetOptions(
      this.questionCount,
      [
        {
          id: NI_GRAMMAR_SET_ID,
          label: "に 문법",
          questionCount: getQuizQuestionCount(niGrammarQuestionPool),
        },
        {
          id: MONO_KOTO_GRAMMAR_SET_ID,
          label: "もの・こと 문법",
          questionCount: getQuizQuestionCount(monoKotoGrammarQuestionPool),
        },
      ],
    );
    this.controller = new QuizSessionController({
      questionPool,
      setSize: QUIZ_SET_SIZE,
      storageKey: buildQuizStorageKey(props.mode, props.scope, props.favoriteIds),
    });
    this.state = {
      answerResult: null,
      answeredQuestion: null,
      session: this.controller.getState(),
    };
  }

  private clearAnswer(session: QuizSessionState): void {
    this.setState({
      answerResult: null,
      answeredQuestion: null,
      session,
    });
  }

  private handleAnswer = (answer: UserAnswer): void => {
    if (this.state.answerResult !== null) {
      return;
    }

    const answeredQuestion = this.controller.getCurrentQuestion();

    if (answeredQuestion === undefined) {
      return;
    }

    const { result, state: session } =
      this.controller.answerCurrentQuestion(answer);
    this.setState({ answerResult: result, answeredQuestion, session });
  };

  private handleNext = (): void => {
    this.clearAnswer(this.controller.goToNextQuestion());
  };

  private handleRecallRate = (known: boolean): void => {
    const question = this.controller.getCurrentQuestion();

    if (question === undefined) {
      return;
    }

    const selectedChoiceId = known
      ? question.answerChoiceId
      : question.choices.find(
          (choice) => choice.id !== question.answerChoiceId,
        )?.id;

    if (selectedChoiceId === undefined) {
      return;
    }

    this.controller.answerCurrentQuestion({ selectedChoiceId });
    this.clearAnswer(this.controller.goToNextQuestion());
  };

  private handleStartReview = (): void => {
    this.clearAnswer(this.controller.startReviewSession());
  };

  private handleNextSet = (): void => {
    this.clearAnswer(
      this.state.session.currentSetId !== undefined
        ? this.controller.startSet(0, QUIZ_SET_SIZE)
        : this.controller.goToNextSet(),
    );
  };

  private handleSetSelect = (option: QuizSetOption): void => {
    const customQuestionPool = this.customQuestionPools.get(option.id);

    this.clearAnswer(
      customQuestionPool !== undefined
        ? this.controller.startCustomSet(option.id, customQuestionPool)
        : this.controller.startSet(option.setIndex, option.setSize),
    );
  };

  private handleReset = (): void => {
    const currentSetId = this.state.session.currentSetId;
    const customQuestionPool =
      currentSetId === undefined
        ? undefined
        : this.customQuestionPools.get(currentSetId);

    this.clearAnswer(
      currentSetId !== undefined && customQuestionPool !== undefined
        ? this.controller.startCustomSet(currentSetId, customQuestionPool)
        : this.controller.startSet(
            this.state.session.currentSetIndex,
            this.state.session.currentSetSize,
          ),
    );
  };

  render() {
    const { favoriteIds, mode, scope, onModeChange, onScopeChange } = this.props;
    const { answerResult, answeredQuestion, session } = this.state;
    const currentSetOption = this.setOptions.find(
      (option) =>
        option.id === session.currentSetId ||
        (session.currentSetId === undefined &&
          !option.isCustom &&
          option.setIndex === session.currentSetIndex &&
          option.setSize === session.currentSetSize),
    );
    const currentSetLabel =
      (currentSetOption?.isCustom
        ? `${currentSetOption.label} · ${currentSetOption.rangeLabel}`
        : currentSetOption?.rangeLabel) ??
      `${session.currentSetIndex * session.currentSetSize + 1}-${Math.min(
        (session.currentSetIndex + 1) * session.currentSetSize,
        this.questionCount,
      )}`;
    const displayQuestion =
      this.controller.getCurrentQuestion() ??
      (answerResult !== null ? answeredQuestion : null);
    const isLastQuestion =
      session.currentQuestionIndex >= session.currentQuestions.length - 1;
    const progressText =
      session.phase === "SET_COMPLETE"
        ? `${session.currentQuestions.length} / ${session.currentQuestions.length}`
        : `${session.currentQuestionIndex + 1} / ${session.currentQuestions.length}`;
    const nextLabel = isLastQuestion
      ? session.phase === "REVIEW"
        ? "복습 계속 →"
        : "세트 결과 보기 →"
      : "다음 문제 →";

    return (
      <>
        <QuizHeader
          currentSetLabel={currentSetLabel}
          mode={mode}
          progressText={progressText}
          questionCount={this.questionCount}
          session={session}
        />
        <QuizModeSelector activeMode={mode} onModeChange={onModeChange} />
        <QuizScopeSelector
          favoriteCount={favoriteIds.length}
          scope={scope}
          onScopeChange={onScopeChange}
        />

        {usesSelectableSets(mode) && this.questionCount > 0 && (
          <QuizSetSelector
            currentSetId={session.currentSetId}
            currentSetIndex={session.currentSetIndex}
            currentSetSize={session.currentSetSize}
            options={this.setOptions}
            onSelect={this.handleSetSelect}
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

        {this.questionCount === 0 ? (
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
            onNextSet={this.handleNextSet}
            onReset={this.handleReset}
            onStartReview={this.handleStartReview}
          />
        ) : mode === "recall" ? (
          <GrammarRecallCard
            key={displayQuestion.id}
            question={displayQuestion}
            questionIndex={session.currentQuestionIndex}
            totalQuestions={session.currentQuestions.length}
            onRate={this.handleRecallRate}
          />
        ) : (
          <QuizCard
            nextLabel={nextLabel}
            question={displayQuestion}
            questionIndex={session.currentQuestionIndex}
            selectedChoiceId={answerResult?.selectedChoiceId}
            selectedChoiceIds={answerResult?.selectedChoiceIds}
            totalQuestions={session.currentQuestions.length}
            onAnswer={this.handleAnswer}
            onNext={this.handleNext}
          />
        )}
      </>
    );
  }
}
