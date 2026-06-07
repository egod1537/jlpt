import type { GrammarItem } from "../types/grammar";
import type { QuizChoice, QuizMode, QuizQuestion, QuizType } from "../types/quiz";
import { generateGrammarChoices } from "./choiceGenerator";
import { shuffle } from "./shuffle";

export const quizModes: Array<{ id: QuizMode; label: string }> = [
  { id: "meaning", label: "뜻 맞추기" },
  { id: "grammar", label: "문법 맞추기" },
  { id: "example", label: "예문 완성" },
  { id: "nuance", label: "뉘앙스 구분" },
];

function modeToQuizType(mode: QuizMode): QuizType {
  if (mode === "meaning") return "GRAMMAR_MEANING";
  if (mode === "grammar") return "GRAMMAR_SELECT";
  if (mode === "example") return "EXAMPLE_BLANK";
  return "NUANCE_SELECT";
}

function buildChoices(items: readonly GrammarItem[], textSelector: (item: GrammarItem) => string): QuizChoice[] {
  return items.map((item) => ({
    id: item.id,
    text: textSelector(item),
    sourceGrammarId: item.id,
  }));
}

export function generateQuizQuestion(
  mode: QuizMode,
  correct: GrammarItem,
  allGrammar: readonly GrammarItem[],
): QuizQuestion {
  const questionId = `${mode}-${correct.id}`;
  const choiceItems = generateGrammarChoices(correct, allGrammar, 4, questionId);
  const example = correct.examples[0];

  if (mode === "meaning") {
    return {
      id: questionId,
      type: modeToQuizType(mode),
      level: correct.level,
      prompt: correct.expression,
      subPrompt: correct.connection,
      choices: buildChoices(choiceItems, (item) => item.meaningKo),
      answerChoiceId: correct.id,
      explanation: correct.nuanceKo,
      sourceGrammarId: correct.id,
      tags: correct.tags,
    };
  }

  if (mode === "grammar") {
    return {
      id: questionId,
      type: modeToQuizType(mode),
      level: correct.level,
      prompt: correct.meaningKo,
      subPrompt: correct.nuanceKo,
      choices: buildChoices(choiceItems, (item) => item.expression),
      answerChoiceId: correct.id,
      explanation: correct.nuanceKo,
      sourceGrammarId: correct.id,
      tags: correct.tags,
    };
  }

  if (mode === "example") {
    return {
      id: questionId,
      type: modeToQuizType(mode),
      level: correct.level,
      prompt: example?.japanese ?? correct.expression,
      subPrompt: example?.korean ?? correct.meaningKo,
      choices: buildChoices(choiceItems, (item) => item.expression),
      answerChoiceId: correct.id,
      explanation: correct.nuanceKo,
      sourceGrammarId: correct.id,
      sourceExampleId: example?.id,
      tags: correct.tags,
    };
  }

  const nuanceChoiceItems = shuffle(choiceItems);

  return {
    id: questionId,
    type: modeToQuizType(mode),
    level: correct.level,
    prompt: correct.expression,
    subPrompt: correct.meaningKo,
    choices: buildChoices(nuanceChoiceItems, (item) => item.nuanceKo),
    answerChoiceId: correct.id,
    explanation: correct.nuanceKo,
    sourceGrammarId: correct.id,
    tags: correct.tags,
  };
}

export function generateQuizSet(
  mode: QuizMode,
  grammarItems: readonly GrammarItem[],
  count = 20,
): QuizQuestion[] {
  return shuffle(grammarItems)
    .slice(0, count)
    .map((item) => generateQuizQuestion(mode, item, grammarItems));
}
