import type { GrammarItem } from "../../types/grammar";
import type {
  AnswerResult,
  QuizMode,
  QuizQuestion,
  QuizSessionState,
} from "../../types/quiz";
import { buildGrammarQuestionPool } from "../../utils/quiz/quizQuestionPool";
import { getQuizQuestionCount } from "../../utils/quizSetBuilder";
import {
  buildQuizSetOptions,
  buildQuizStorageKey,
  MONO_KOTO_GRAMMAR_SET_ID,
  NI_GRAMMAR_SET_ID,
  type QuizScope,
  type QuizSetOption,
} from "./quizConfig";

interface QuizSessionResourceParams {
  favoriteIds: readonly string[];
  grammarItems: readonly GrammarItem[];
  mode: QuizMode;
  scope: QuizScope;
}

export interface QuizSessionResources {
  customQuestionPools: ReadonlyMap<string, readonly QuizQuestion[]>;
  questionCount: number;
  questionPool: readonly QuizQuestion[];
  setOptions: readonly QuizSetOption[];
  storageKey: string;
}

export interface QuizSessionViewModel {
  currentSetLabel: string;
  displayQuestion: QuizQuestion | null;
  nextLabel: string;
  progressText: string;
}

interface QuizSessionViewModelParams {
  answerResult: AnswerResult | null;
  answeredQuestion: QuizQuestion | null;
  currentQuestion: QuizQuestion | undefined;
  questionCount: number;
  session: QuizSessionState;
  setOptions: readonly QuizSetOption[];
}

export function buildQuizSessionResources({
  favoriteIds,
  grammarItems,
  mode,
  scope,
}: QuizSessionResourceParams): QuizSessionResources {
  const questionPool = buildScopedQuestionPool({
    favoriteIds,
    grammarItems,
    mode,
    scope,
  });
  const customQuestionPools = buildCustomQuestionPools(questionPool, grammarItems);
  const niGrammarQuestionPool =
    customQuestionPools.get(NI_GRAMMAR_SET_ID) ?? [];
  const monoKotoGrammarQuestionPool =
    customQuestionPools.get(MONO_KOTO_GRAMMAR_SET_ID) ?? [];
  const questionCount = getQuizQuestionCount(questionPool);

  return {
    customQuestionPools,
    questionCount,
    questionPool,
    setOptions: buildQuizSetOptions(questionCount, [
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
    ]),
    storageKey: buildQuizStorageKey(mode, scope, favoriteIds),
  };
}

export function buildQuizSessionViewModel({
  answerResult,
  answeredQuestion,
  currentQuestion,
  questionCount,
  session,
  setOptions,
}: QuizSessionViewModelParams): QuizSessionViewModel {
  const isLastQuestion =
    session.currentQuestionIndex >= session.currentQuestions.length - 1;

  return {
    currentSetLabel: getCurrentSetLabel(session, setOptions, questionCount),
    displayQuestion:
      currentQuestion ?? (answerResult !== null ? answeredQuestion : null),
    nextLabel: isLastQuestion
      ? session.phase === "REVIEW"
        ? "복습 계속 →"
        : "세트 결과 보기 →"
      : "다음 문제 →",
    progressText:
      session.phase === "SET_COMPLETE"
        ? `${session.currentQuestions.length} / ${session.currentQuestions.length}`
        : `${session.currentQuestionIndex + 1} / ${session.currentQuestions.length}`,
  };
}

function buildScopedQuestionPool({
  favoriteIds,
  grammarItems,
  mode,
  scope,
}: QuizSessionResourceParams): readonly QuizQuestion[] {
  const allQuestions = buildGrammarQuestionPool(mode, grammarItems);

  if (scope === "all") {
    return allQuestions;
  }

  const favoriteIdSet = new Set(favoriteIds);

  return allQuestions.filter(
    (question) =>
      question.sourceGrammarId !== undefined &&
      favoriteIdSet.has(question.sourceGrammarId),
  );
}

function buildCustomQuestionPools(
  questionPool: readonly QuizQuestion[],
  grammarItems: readonly GrammarItem[],
): ReadonlyMap<string, readonly QuizQuestion[]> {
  const niGrammarIds = new Set(
    grammarItems
      .filter((item) => item.expression.trimStart().startsWith("に"))
      .map((item) => item.id),
  );
  const monoKotoGrammarIds = new Set(
    grammarItems
      .filter((item) => /^(もの|こと)/.test(item.expression.trimStart()))
      .map((item) => item.id),
  );

  return new Map([
    [NI_GRAMMAR_SET_ID, filterQuestionsByGrammarIds(questionPool, niGrammarIds)],
    [
      MONO_KOTO_GRAMMAR_SET_ID,
      filterQuestionsByGrammarIds(questionPool, monoKotoGrammarIds),
    ],
  ]);
}

function filterQuestionsByGrammarIds(
  questionPool: readonly QuizQuestion[],
  grammarIds: ReadonlySet<string>,
): readonly QuizQuestion[] {
  return questionPool.filter(
    (question) =>
      question.sourceGrammarId !== undefined &&
      grammarIds.has(question.sourceGrammarId),
  );
}

function getCurrentSetLabel(
  session: QuizSessionState,
  setOptions: readonly QuizSetOption[],
  questionCount: number,
): string {
  const currentSetOption = setOptions.find(
    (option) =>
      option.id === session.currentSetId ||
      (session.currentSetId === undefined &&
        !option.isCustom &&
        option.setIndex === session.currentSetIndex &&
        option.setSize === session.currentSetSize),
  );

  return (
    (currentSetOption?.isCustom
      ? `${currentSetOption.label} · ${currentSetOption.rangeLabel}`
      : currentSetOption?.rangeLabel) ??
    `${session.currentSetIndex * session.currentSetSize + 1}-${Math.min(
      (session.currentSetIndex + 1) * session.currentSetSize,
      questionCount,
    )}`
  );
}
