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
import { QuizSessionContent } from "./QuizSessionContent";
import {
  QUIZ_SET_SIZE,
  type QuizScope,
  type QuizSetOption,
} from "./quizConfig";
import {
  buildQuizSessionResources,
  buildQuizSessionViewModel,
} from "./quizSessionPanelModel";

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

    const resources = buildQuizSessionResources(props);

    this.customQuestionPools = resources.customQuestionPools;
    this.questionCount = resources.questionCount;
    this.setOptions = resources.setOptions;
    this.controller = new QuizSessionController({
      questionPool: resources.questionPool,
      setSize: QUIZ_SET_SIZE,
      storageKey: resources.storageKey,
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
    const viewModel = buildQuizSessionViewModel({
      answerResult,
      answeredQuestion,
      currentQuestion: this.controller.getCurrentQuestion(),
      questionCount: this.questionCount,
      session,
      setOptions: this.setOptions,
    });

    return (
      <QuizSessionContent
        answerResult={answerResult}
        currentSetLabel={viewModel.currentSetLabel}
        displayQuestion={viewModel.displayQuestion}
        favoriteCount={favoriteIds.length}
        mode={mode}
        nextLabel={viewModel.nextLabel}
        progressText={viewModel.progressText}
        questionCount={this.questionCount}
        scope={scope}
        session={session}
        setOptions={this.setOptions}
        onAnswer={this.handleAnswer}
        onModeChange={onModeChange}
        onNext={this.handleNext}
        onNextSet={this.handleNextSet}
        onRecallRate={this.handleRecallRate}
        onReset={this.handleReset}
        onScopeChange={onScopeChange}
        onSetSelect={this.handleSetSelect}
        onStartReview={this.handleStartReview}
      />
    );
  }
}
