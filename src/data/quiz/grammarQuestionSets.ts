import type { GrammarQuestionSet } from "./questionData";

const questionSetModules = import.meta.glob("./byGrammar/*.json", {
  eager: true,
  import: "default",
}) as Record<string, GrammarQuestionSet>;

export const grammarQuestionSets = Object.values(questionSetModules).sort((left, right) =>
  left.grammarId.localeCompare(right.grammarId),
);
