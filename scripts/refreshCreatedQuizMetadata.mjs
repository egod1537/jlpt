import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDirectory = path.resolve(".");
const questionDirectory = path.join(rootDirectory, "src/data/quiz/byGrammar");
const grammarFile = path.join(rootDirectory, "src/data/grammar/n2Grammar.ts");

function parseGrammarData(source) {
  const startIndex = source.indexOf("= [") + 2;
  const endIndex = source.lastIndexOf("];") + 1;

  return JSON.parse(source.slice(startIndex, endIndex));
}

function getAnswerChoice(question) {
  const answerChoice = question.choices.find((choice) => choice.id === question.answerChoiceId);

  if (answerChoice === undefined) {
    throw new Error(`Missing answer choice for ${question.id}`);
  }

  return answerChoice;
}

function buildExplanation(question, grammar, answer) {
  const warning = grammar.warningKo ? ` 주의할 점은 ${grammar.warningKo}` : "";

  return `「${answer}」는 '${grammar.meaningKo}'라는 뜻을 나타낸다. 이 문장에서는 '${question.korean}'라는 상황에 쓰였으며, ${grammar.nuanceKo}${warning}`;
}

const grammarById = new Map(
  parseGrammarData(await readFile(grammarFile, "utf8")).map((grammar) => [grammar.id, grammar]),
);
const files = (await readdir(questionDirectory))
  .filter((file) => /^n2-\d{3}\.json$/.test(file))
  .sort();

for (const file of files) {
  const filePath = path.join(questionDirectory, file);
  const data = JSON.parse(await readFile(filePath, "utf8"));
  const grammar = grammarById.get(data.grammarId);

  if (grammar === undefined) {
    throw new Error(`${data.grammarId}: missing grammar metadata`);
  }

  data.fillBlankQuestions = data.fillBlankQuestions.map((question) => {
    if (!question.id.startsWith("fb-created-")) {
      return question;
    }

    const answerChoice = getAnswerChoice(question);
    const { sentenceContext: _sentenceContext, ...questionFields } = question;

    return {
      ...questionFields,
      explanation: buildExplanation(question, grammar, answerChoice.text),
      tags: [...new Set([...grammar.tags, "신규예문", "빈칸"])],
    };
  });
  data.sentenceOrderQuestions = data.sentenceOrderQuestions.map((question) => {
    if (!question.id.startsWith("so-created-")) {
      return question;
    }

    const matchingFillBlank = data.fillBlankQuestions.find(
      (fillBlankQuestion) =>
        fillBlankQuestion.id.replace("fb-created-", "") ===
        question.id.replace("so-created-", ""),
    );

    if (matchingFillBlank === undefined) {
      throw new Error(`${question.id}: missing matching fill-blank question`);
    }

    return {
      ...question,
      explanation: buildExplanation(
        question,
        grammar,
        getAnswerChoice(matchingFillBlank).text,
      ),
      tags: [...new Set([...grammar.tags, "신규예문", "문장배열"])],
    };
  });

  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

console.log(`Refreshed generated metadata in ${files.length} grammar files.`);
