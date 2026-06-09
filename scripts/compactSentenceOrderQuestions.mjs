import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildCompactSentenceOrder } from "./sentenceOrderCompactor.mjs";

const rootDirectory = path.resolve(".");
const questionDirectory = path.join(rootDirectory, "src/data/quiz/byGrammar");
const files = (await readdir(questionDirectory))
  .filter((file) => /^n2-\d{3}\.json$/.test(file))
  .sort();
let updatedCount = 0;

function getAnswerChoice(question) {
  const answerChoice = question.choices.find((choice) => choice.id === question.answerChoiceId);

  if (answerChoice === undefined) {
    throw new Error(`Missing answer choice for ${question.id}`);
  }

  return answerChoice;
}

for (const file of files) {
  const filePath = path.join(questionDirectory, file);
  const data = JSON.parse(await readFile(filePath, "utf8"));
  const fillBlankByKey = new Map(
    data.fillBlankQuestions
      .filter((question) => question.id.startsWith("fb-created-"))
      .map((question) => [question.id.replace("fb-created-", ""), question]),
  );

  data.sentenceOrderQuestions = data.sentenceOrderQuestions.map((question) => {
    if (!question.id.startsWith("so-created-")) {
      return question;
    }

    const questionKey = question.id.replace("so-created-", "");
    const fillBlankQuestion = fillBlankByKey.get(questionKey);

    if (fillBlankQuestion === undefined) {
      throw new Error(`${question.id}: missing matching fill-blank question`);
    }

    const answer = getAnswerChoice(fillBlankQuestion).text;
    const compactOrder = buildCompactSentenceOrder(question.sentence, answer);
    const orderedPieces = compactOrder.pieces.map((text, index) => ({
      id: `${question.id}-p${index + 1}`,
      text,
      order: index + 1,
    }));

    updatedCount += 1;

    return {
      ...question,
      sentenceWithBlanks: compactOrder.sentenceWithBlanks,
      pieces: question.pieces.map((piece) => {
        const pieceNumber = Number.parseInt(piece.id.match(/-p(\d+)$/)?.[1] ?? "", 10);
        const orderedPiece = orderedPieces[pieceNumber - 1];

        if (orderedPiece === undefined) {
          throw new Error(`${question.id}: invalid piece id ${piece.id}`);
        }

        return orderedPiece;
      }),
      correctPieceIds: orderedPieces.map((piece) => piece.id),
    };
  });

  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

console.log(`Compacted ${updatedCount} sentence-order questions.`);
