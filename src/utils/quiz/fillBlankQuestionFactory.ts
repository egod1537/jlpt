import type { FillBlankQuestion } from "../../data/quiz/fillBlankQuestions";
import type { FillBlankSentenceContext, GrammarItem } from "../../types/grammar";
import type { QuizChoice, QuizQuestion } from "../../types/quiz";
import { generateFillBlankChoices } from "../choiceGenerator";
import {
  blankTarget,
  type ExampleTargetMatch,
} from "./grammarExampleMatcher";

function buildDefaultFillBlankContext(
  item: GrammarItem,
): FillBlankSentenceContext {
  const connection = item.connection;
  const requiredConnectionType = /Vた/.test(connection)
    ? "V_PAST"
    : /V辞書形/.test(connection)
      ? "V_DICTIONARY"
      : /Vます形語幹/.test(connection)
        ? "V_MASU_STEM"
        : /Vない形語幹/.test(connection)
          ? "V_NAI_STEM"
          : /普通形/.test(connection)
            ? "PLAIN_FORM"
            : /N\+|Nの|Nである/.test(connection)
              ? "NOUN"
              : "ANY";

  return {
    requiredConnectionType,
    semanticTags: item.tags,
    expectsNegativeConclusion: /否定|制限|とは限らない|わけではない|부정|제한/.test(
      item.tags.join(" ") + item.nuanceKo + (item.warningKo ?? ""),
    ),
    expectsDutyOrResponsibility: /責任|義務|べき|당연|책임|의무/.test(
      item.tags.join(" ") + item.nuanceKo,
    ),
    expectsBadResult: /悪い結果|부정적|나쁜|望ましくない/.test(
      item.tags.join(" ") + item.nuanceKo,
    ),
  };
}

function buildConfusingNotes(
  questionGrammarIds: readonly string[],
  grammarById: ReadonlyMap<string, GrammarItem>,
): string[] {
  return questionGrammarIds
    .map((id) => grammarById.get(id))
    .filter((item): item is GrammarItem => item !== undefined)
    .map((item) => `${item.expression}: ${item.warningKo ?? item.nuanceKo}`);
}

export function buildManualFillBlankQuestion(
  question: FillBlankQuestion,
  allGrammar: readonly GrammarItem[],
): QuizQuestion {
  const grammarById = new Map(allGrammar.map((item) => [item.id, item]));
  const answerChoice = question.choices.find(
    (choice) => choice.id === question.answerChoiceId,
  );
  const correctGrammar =
    answerChoice === undefined
      ? undefined
      : grammarById.get(answerChoice.grammarId);
  const choices: QuizChoice[] = question.choices.map((choice) => ({
    id: choice.id,
    text: choice.text,
    sourceGrammarId: choice.grammarId,
    baseExpression: choice.baseExpression,
    conjugatedExpression: choice.conjugatedExpression,
    isSimilarDistractor: choice.isSimilarDistractor,
  }));
  const confusingNotes = buildConfusingNotes(
    question.sourceGrammarIds.filter((id) => id !== correctGrammar?.id),
    grammarById,
  );

  return {
    id: question.id,
    type: "EXAMPLE_BLANK",
    level: question.level,
    prompt: question.sentenceWithBlank,
    subPrompt:
      "次の文の（　　　）に入る最もよいものを、1・2・3・4から一つ選びなさい。",
    choices,
    answerChoiceId: question.answerChoiceId,
    explanation: question.explanation,
    fillBlank: {
      sentence: question.sentence,
      sentenceWithBlank: question.sentenceWithBlank,
      korean: question.korean,
      sourceGrammarIds: question.sourceGrammarIds,
      answerBaseExpression:
        answerChoice?.baseExpression ?? correctGrammar?.expression,
      answerMeaningKo: correctGrammar?.meaningKo,
      answerConnection: correctGrammar?.connection,
      confusingNotes,
    },
    sourceGrammarId: correctGrammar?.id ?? answerChoice?.grammarId,
    sourceGrammarIds: question.sourceGrammarIds,
    tags: question.tags,
  };
}

export function buildGeneratedFillBlankQuestion(
  correct: GrammarItem,
  allGrammar: readonly GrammarItem[],
  exampleMatch: ExampleTargetMatch,
  questionId: string,
): QuizQuestion {
  const sentenceContext = buildDefaultFillBlankContext(correct);
  const fillBlankChoices = generateFillBlankChoices({
    correctGrammar: correct,
    sentenceContext,
    allGrammar,
    count: 4,
    sourceGrammarIds: correct.similarGrammarIds,
    seed: questionId,
  });
  const answerChoiceId = fillBlankChoices.find(
    (choice) => choice.grammarId === correct.id && !choice.isSimilarDistractor,
  )?.id;
  const sentenceWithBlank = blankTarget(exampleMatch);

  return {
    id: questionId,
    type: "EXAMPLE_BLANK",
    level: correct.level,
    prompt: sentenceWithBlank,
    subPrompt:
      "次の文の（　　　）に入る最もよいものを、1・2・3・4から一つ選びなさい。",
    choices: fillBlankChoices.map((choice) => ({
      id: choice.id,
      text: choice.text,
      sourceGrammarId: choice.grammarId,
      baseExpression: choice.baseExpression,
      conjugatedExpression: choice.conjugatedExpression,
      isSimilarDistractor: choice.isSimilarDistractor,
    })),
    answerChoiceId: answerChoiceId ?? `${questionId}-answer`,
    explanation: `${correct.nuanceKo} ${exampleMatch.example.korean}`,
    fillBlank: {
      sentence: exampleMatch.example.japanese,
      sentenceWithBlank,
      korean: exampleMatch.example.korean,
      sourceGrammarIds: [correct.id, ...correct.similarGrammarIds],
      answerBaseExpression: correct.expression,
      answerMeaningKo: correct.meaningKo,
      answerConnection: correct.connection,
      confusingNotes: buildConfusingNotes(
        correct.similarGrammarIds,
        new Map(allGrammar.map((item) => [item.id, item])),
      ),
    },
    sourceGrammarId: correct.id,
    sourceExampleId: exampleMatch.example.id,
    tags: correct.tags,
  };
}
