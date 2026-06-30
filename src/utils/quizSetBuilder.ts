import type { QuizQuestion, WrongAnswerRecord } from "../types/quiz";
import { shuffle } from "./shuffle";

function shouldUseSequentialSets(questionPool: readonly QuizQuestion[]): boolean {
  const quizType = questionPool[0]?.type;

  return (
    quizType === "GRAMMAR_MEANING" ||
    quizType === "GRAMMAR_SELECT" ||
    quizType === "GRAMMAR_RECALL" ||
    quizType === "EXAMPLE_BLANK" ||
    quizType === "SENTENCE_ORDER"
  );
}

function isShuffleTarget(quizType: QuizQuestion["type"] | undefined): boolean {
  return (
    quizType === "GRAMMAR_MEANING" ||
    quizType === "GRAMMAR_SELECT" ||
    quizType === "EXAMPLE_BLANK" ||
    quizType === "SENTENCE_ORDER"
  );
}

function shouldShuffleWithinSet(questionPool: readonly QuizQuestion[]): boolean {
  const quizType = questionPool[0]?.type;

  return quizType === "GRAMMAR_RECALL" || isShuffleTarget(quizType);
}

export function shuffleQuizQuestionChoices(question: QuizQuestion): QuizQuestion {
  if (!isShuffleTarget(question.type)) {
    return question;
  }

  return {
    ...question,
    choices: shuffle(question.choices),
  };
}

function randomizeQuestionSet(questions: readonly QuizQuestion[]): QuizQuestion[] {
  return shuffle(questions).map(shuffleQuizQuestionChoices);
}

function shouldUseUniqueAnswerGrammarSets(questionPool: readonly QuizQuestion[]): boolean {
  const quizType = questionPool[0]?.type;

  return quizType === "EXAMPLE_BLANK" || quizType === "SENTENCE_ORDER";
}

function getAnswerGrammarKey(question: QuizQuestion): string {
  return question.sourceGrammarId ?? `question:${question.id}`;
}

function groupQuestionsByAnswerGrammar(
  questionPool: readonly QuizQuestion[],
): QuizQuestion[][] {
  const groupedQuestions = new Map<string, QuizQuestion[]>();

  questionPool.forEach((question) => {
    const answerGrammarKey = getAnswerGrammarKey(question);
    const group = groupedQuestions.get(answerGrammarKey) ?? [];

    group.push(question);
    groupedQuestions.set(answerGrammarKey, group);
  });

  return [...groupedQuestions.values()];
}

export function getQuizQuestionCount(questionPool: readonly QuizQuestion[]): number {
  return shouldUseUniqueAnswerGrammarSets(questionPool)
    ? groupQuestionsByAnswerGrammar(questionPool).length
    : questionPool.length;
}

export function hasUniqueAnswerGrammars(questions: readonly QuizQuestion[]): boolean {
  const answerGrammarKeys = questions.map(getAnswerGrammarKey);

  return new Set(answerGrammarKeys).size === answerGrammarKeys.length;
}

export function arrangeQuestionsIntoUniqueAnswerSets(
  questionPool: readonly QuizQuestion[],
  setSize: number,
): QuizQuestion[] {
  if (questionPool.length === 0) {
    return [];
  }

  const setCount = Math.ceil(questionPool.length / setSize);
  const groupedQuestions = new Map<string, QuizQuestion[]>();

  questionPool.forEach((question) => {
    const answerGrammarKey = getAnswerGrammarKey(question);
    const group = groupedQuestions.get(answerGrammarKey) ?? [];

    group.push(question);
    groupedQuestions.set(answerGrammarKey, group);
  });

  const groups = [...groupedQuestions.values()].sort((left, right) => right.length - left.length);
  const largestGroupSize = groups[0]?.length ?? 0;

  if (largestGroupSize > setCount) {
    throw new Error("There are too many questions with the same answer grammar to keep every set unique.");
  }

  const targetSetSizes = Array.from({ length: setCount }, (_, setIndex) =>
    setIndex === setCount - 1 ? questionPool.length - setSize * setIndex : setSize,
  );
  const questionSets = targetSetSizes.map(() => [] as QuizQuestion[]);

  groups.forEach((group) => {
    const usedSetIndexes = new Set<number>();

    group.forEach((question) => {
      let selectedSetIndex = -1;
      let largestRemainingCapacity = -1;

      questionSets.forEach((questionSet, setIndex) => {
        const remainingCapacity = (targetSetSizes[setIndex] ?? 0) - questionSet.length;

        if (
          !usedSetIndexes.has(setIndex) &&
          remainingCapacity > 0 &&
          remainingCapacity > largestRemainingCapacity
        ) {
          selectedSetIndex = setIndex;
          largestRemainingCapacity = remainingCapacity;
        }
      });

      if (selectedSetIndex < 0) {
        throw new Error("Unable to distribute questions without repeating an answer grammar in a set.");
      }

      questionSets[selectedSetIndex]?.push(question);
      usedSetIndexes.add(selectedSetIndex);
    });
  });

  return questionSets.flat();
}

export function buildQuizSet(
  questionPool: readonly QuizQuestion[],
  setSize: number,
  currentSetIndex = 0,
): QuizQuestion[] {
  if (shouldUseUniqueAnswerGrammarSets(questionPool)) {
    const questionGroups = groupQuestionsByAnswerGrammar(questionPool);
    const totalSets = Math.max(1, Math.ceil(questionGroups.length / setSize));
    const normalizedSetIndex = currentSetIndex % totalSets;
    const startIndex = normalizedSetIndex * setSize;

    const questions = questionGroups
      .slice(startIndex, startIndex + setSize)
      .map((group) => group[Math.floor(Math.random() * group.length)])
      .filter((question): question is QuizQuestion => question !== undefined);

    return randomizeQuestionSet(questions);
  }

  if (shouldUseSequentialSets(questionPool)) {
    const totalSets = Math.max(1, Math.ceil(questionPool.length / setSize));
    const normalizedSetIndex = currentSetIndex % totalSets;
    const startIndex = normalizedSetIndex * setSize;

    const questions = questionPool.slice(startIndex, startIndex + setSize);

    return shouldShuffleWithinSet(questionPool) ? randomizeQuestionSet(questions) : questions;
  }

  return shuffle(questionPool).slice(0, setSize).map(shuffleQuizQuestionChoices);
}

export function getQuestionsByIds(
  questionPool: readonly QuizQuestion[],
  questionIds: readonly string[],
): QuizQuestion[] {
  const questionById = new Map(questionPool.map((question) => [question.id, question]));

  return questionIds
    .map((questionId) => questionById.get(questionId))
    .filter((question): question is QuizQuestion => question !== undefined);
}

export function getReviewQuestions(
  questionPool: readonly QuizQuestion[],
  wrongQueue: readonly WrongAnswerRecord[],
): QuizQuestion[] {
  return randomizeQuestionSet(
    getQuestionsByIds(questionPool, wrongQueue.map((record) => record.questionId)),
  );
}
