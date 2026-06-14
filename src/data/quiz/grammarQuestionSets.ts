import type { GrammarQuestionSet } from "./questionData";
import { particleQuestionSets } from "./particleQuestionSets";

const questionSetModules = import.meta.glob("./byGrammar/*.json", {
  eager: true,
  import: "default",
}) as Record<string, GrammarQuestionSet>;

export const grammarQuestionSets = [
  ...Object.values(questionSetModules),
  ...particleQuestionSets,
].sort((left, right) => left.grammarId.localeCompare(right.grammarId));
