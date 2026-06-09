import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildCompactSentenceOrder } from "./sentenceOrderCompactor.mjs";

const rootDirectory = path.resolve(".");
const questionDirectory = path.join(rootDirectory, "src/data/quiz/byGrammar");
const grammarFile = path.join(rootDirectory, "src/data/grammar/n2Grammar.ts");
const schemaFile = path.join(rootDirectory, "scripts/quizExampleBatch.schema.json");
const outputDirectory = path.join(os.tmpdir(), "jlpt-original-quiz-generation");
const generatedCount = 25;

function parseArgument(name, fallback) {
  const index = process.argv.indexOf(name);

  return index < 0 ? fallback : Number.parseInt(process.argv[index + 1], 10);
}

const fromNumber = parseArgument("--from", 1);
const toNumber = parseArgument("--to", 181);
const batchSize = parseArgument("--batch-size", 3);
const concurrency = parseArgument("--concurrency", 3);
const maxAttempts = parseArgument("--max-attempts", 3);
const timeoutSeconds = parseArgument("--timeout-seconds", 240);
const skipValid = process.argv.includes("--skip-valid");

function parseGrammarData(source) {
  const startIndex = source.indexOf("= [") + 2;
  const endIndex = source.lastIndexOf("];") + 1;

  return JSON.parse(source.slice(startIndex, endIndex));
}

function isGeneratedQuestion(question) {
  return (
    question.id.startsWith("fb-extra-") ||
    question.id.startsWith("fb-extra20-") ||
    question.id.startsWith("fb-created-") ||
    question.id.startsWith("so-extra-") ||
    question.id.startsWith("so-extra20-") ||
    question.id.startsWith("so-created-")
  );
}

function getAnswerChoice(question) {
  const answerChoice = question.choices.find((choice) => choice.id === question.answerChoiceId);

  if (answerChoice === undefined) {
    throw new Error(`Missing answer choice for ${question.id}`);
  }

  return answerChoice;
}

function getSourceQuestions(data) {
  const seen = new Set();

  return data.fillBlankQuestions
    .filter((question) => !isGeneratedQuestion(question))
    .filter((question) => {
      const answerChoice = getAnswerChoice(question);

      return (
        question.sentenceWithBlank.includes("（　　　）") &&
        question.sentenceWithBlank.replace("（　　　）", answerChoice.text) === question.sentence
      );
    })
    .filter((question) => {
      const answerChoice = getAnswerChoice(question);
      const key = `${question.sentenceWithBlank}\u0000${answerChoice.text}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((question) => ({
      sourceQuestionId: question.id,
      answer: getAnswerChoice(question).text,
      requiredOccurrences: countOccurrences(question.sentence, getAnswerChoice(question).text),
      existingJapanese: question.sentence,
      existingKorean: question.korean,
    }));
}

function buildPrompt(items) {
  const specialGuidance = {
    "n2-068":
      "Use the exact substring っぽい once. Build natural words such as 子供っぽい, 忘れっぽい, 水っぽい, or 安っぽい, while varying the adjective or tendency.",
    "n2-072":
      "Use a verb in て-form immediately followed by the exact substring てでも, for example 売ってでも or 徹夜してでも. Do not separate or alter てでも.",
    "n2-166":
      "Every sentence must contain the exact substring もうとしていた. Therefore use verbs whose volitional form ends in もう, such as 読む→読もうとしていた, 飲む→飲もうとしていた, 進む→進もうとしていた, 休む→休もうとしていた, 頼む→頼もうとしていた, 挑む→挑もうとしていた, or 取り組む→取り組もうとしていた.",
    "n2-167":
      "Every sentence must contain the exact substring ようものなら. Use ichidan verbs or する-compounds whose volitional form preserves it, such as 変えようものなら, 忘れようものなら, 認めようものなら, 公表しようものなら, or 無視しようものなら.",
  };
  const input = items.map(({ grammar, sources }) => ({
    grammar: {
      id: grammar.id,
      expression: grammar.expression,
      connection: grammar.connection,
      meaningKo: grammar.meaningKo,
      nuanceKo: grammar.nuanceKo,
      warningKo: grammar.warningKo,
      tags: grammar.tags,
      existingGrammarExamples: grammar.examples,
    },
    allowedSources: sources,
    specialGuidance: specialGuidance[grammar.id],
  }));

  return `You are writing production-quality JLPT N2 quiz content.
Return only JSON matching the supplied schema.

For every grammar item below, write exactly ${generatedCount} genuinely original Japanese example sentences and accurate Korean translations.

Hard requirements:
- The core Japanese sentence itself must be new. Do not wrap, quote, prefix, suffix, paraphrase, or lightly edit an existing sentence.
- Do not write classroom, teacher, textbook, study, quiz, app, explanation, quotation, or other meta-language scenarios.
- Each of the ${generatedCount} examples for one grammar must depict a materially different real-world situation.
- Vary subjects, objects, predicates, places, professions, relationships, and outcomes.
- Avoid duplicate and near-duplicate sentence structures.
- Respect the grammar's connection, meaning, nuance, register, and warning.
- Use natural standalone Japanese appropriate for JLPT N2 learners.
- Translate the full nuance accurately into natural Korean.
- Select one allowed sourceQuestionId and use its exact answer string exactly the listed requiredOccurrences times in the Japanese sentence.
- Do not alter the allowed answer spelling.
- Return exactly four non-empty, natural grammatical pieces in correct order.
- pieces.join("") must equal japanese exactly.
- Keep the tested answer wholly inside one piece.
- Do not reuse the situation, central nouns, predicate, or outcome of any listed existing example.

Before returning, silently check every requirement and rewrite any failing item.

Grammar items:
${JSON.stringify(input, null, 2)}`;
}

function runCodex(prompt, outputFile) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "codex",
      [
        "-a",
        "never",
        "-s",
        "read-only",
        "exec",
        "--ephemeral",
        "--ignore-rules",
        "-c",
        'model_reasoning_effort="medium"',
        "--output-schema",
        schemaFile,
        "-o",
        outputFile,
        "-",
      ],
      {
        cwd: rootDirectory,
        detached: true,
        stdio: ["pipe", "ignore", "pipe"],
      },
    );
    let errorOutput = "";
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;

      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }, timeoutSeconds * 1000);

    child.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);

      if (timedOut) {
        reject(new Error(`Codex timed out after ${timeoutSeconds} seconds`));
        return;
      }

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Codex exited with ${code}: ${errorOutput.slice(-4000)}`));
      }
    });
    child.stdin.end(prompt);
  });
}

function countOccurrences(value, search) {
  return value.split(search).length - 1;
}

function normalizeSentence(value) {
  return value.replace(/\s+/g, "").replace(/[「」『』]/g, "");
}

function splitText(value, partCount) {
  if (partCount === 1) {
    return [value];
  }

  const boundaries = [...value.matchAll(/[、。！？]|(?:て|で|に|を|は|が|も|から|ので|なら|ても|には)/g)]
    .map((match) => match.index + match[0].length)
    .filter((index) => index > 0 && index < value.length);
  const parts = [];
  let startIndex = 0;

  for (let partIndex = 1; partIndex < partCount; partIndex += 1) {
    const targetIndex = Math.round((value.length * partIndex) / partCount);
    const boundary = boundaries
      .filter((index) => index > startIndex)
      .sort(
        (left, right) =>
          Math.abs(left - targetIndex) - Math.abs(right - targetIndex),
      )[0];
    const remainingParts = partCount - partIndex;
    const latestIndex = value.length - remainingParts;
    const splitIndex = Math.max(
      startIndex + 1,
      Math.min(boundary ?? targetIndex, latestIndex),
    );

    parts.push(value.slice(startIndex, splitIndex));
    startIndex = splitIndex;
  }

  parts.push(value.slice(startIndex));
  return parts;
}

function repairPieces(example) {
  if (
    example.pieces.length === 4 &&
    example.pieces.every((piece) => piece.length > 0) &&
    example.pieces.join("") === example.japanese &&
    example.pieces.some((piece) => piece.includes(example.answer))
  ) {
    return example;
  }

  const answerIndex = example.japanese.indexOf(example.answer);
  const before = example.japanese.slice(0, answerIndex);
  const after = example.japanese.slice(answerIndex + example.answer.length);
  let pieces;

  if (before.length === 0) {
    pieces = [example.answer, ...splitText(after, 3)];
  } else if (after.length === 0) {
    pieces = [...splitText(before, 3), example.answer];
  } else if (before.length >= after.length) {
    pieces = [...splitText(before, 2), example.answer, after];
  } else {
    pieces = [before, example.answer, ...splitText(after, 2)];
  }

  return {
    ...example,
    pieces,
  };
}

function validateGeneratedSet(generatedSet, item) {
  const { data, grammar, sources } = item;
  const sourceById = new Map(sources.map((source) => [source.sourceQuestionId, source]));
  const existingSentences = new Set([
    ...grammar.examples.map((example) => normalizeSentence(example.japanese)),
    ...data.fillBlankQuestions
      .filter((question) => !isGeneratedQuestion(question))
      .map((question) => normalizeSentence(question.sentence)),
  ]);
  const generatedSentences = new Set();

  if (generatedSet.grammarId !== grammar.id) {
    throw new Error(`Expected ${grammar.id}, received ${generatedSet.grammarId}`);
  }
  if (generatedSet.examples.length !== generatedCount) {
    throw new Error(`${grammar.id}: expected ${generatedCount} examples`);
  }

  generatedSet.examples.forEach((example, index) => {
    validateGeneratedExample(example, item, index, existingSentences);
    const normalized = normalizeSentence(example.japanese);

    if (generatedSentences.has(normalized)) {
      throw new Error(`${grammar.id}/${index + 1}: duplicate generated sentence`);
    }

    generatedSentences.add(normalized);
  });
}

function validateGeneratedExample(example, item, index, existingSentences) {
  const { grammar, sources } = item;
  const sourceById = new Map(sources.map((source) => [source.sourceQuestionId, source]));
  const source = sourceById.get(example.sourceQuestionId);
  const normalized = normalizeSentence(example.japanese);

  if (source === undefined) {
    throw new Error(`${grammar.id}/${index + 1}: invalid sourceQuestionId`);
  }
  if (example.answer !== source.answer) {
    throw new Error(`${grammar.id}/${index + 1}: answer does not match source`);
  }
  if (countOccurrences(example.japanese, example.answer) !== source.requiredOccurrences) {
    throw new Error(
      `${grammar.id}/${index + 1}: answer must occur ${source.requiredOccurrences} times`,
    );
  }
  if (example.pieces.length !== 4 || example.pieces.some((piece) => piece.length === 0)) {
    throw new Error(`${grammar.id}/${index + 1}: invalid pieces`);
  }
  if (example.pieces.join("") !== example.japanese) {
    throw new Error(`${grammar.id}/${index + 1}: pieces do not reconstruct sentence`);
  }
  if (!example.pieces.some((piece) => piece.includes(example.answer))) {
    throw new Error(`${grammar.id}/${index + 1}: answer is split across pieces`);
  }
  if (existingSentences.has(normalized)) {
    throw new Error(`${grammar.id}/${index + 1}: duplicates existing sentence`);
  }
  if (/[「」]/.test(example.japanese) || /授業|先生|教科書|学習アプリ|例文/.test(example.japanese)) {
    throw new Error(`${grammar.id}/${index + 1}: meta-language sentence`);
  }
}

function rotate(items, offset) {
  const normalizedOffset = offset % items.length;

  return [...items.slice(normalizedOffset), ...items.slice(0, normalizedOffset)];
}

function buildExplanation(example, grammar, answer) {
  const warning = grammar.warningKo ? ` 주의할 점은 ${grammar.warningKo}` : "";

  return `「${answer}」는 '${grammar.meaningKo}'라는 뜻을 나타낸다. 이 문장에서는 '${example.korean}'라는 상황에 쓰였으며, ${grammar.nuanceKo}${warning}`;
}

function buildFillBlankQuestion(example, sourceQuestion, grammar, index, grammarNumber) {
  const questionId = `fb-created-${grammar.id}-${String(index + 1).padStart(2, "0")}`;
  const sourceAnswer = getAnswerChoice(sourceQuestion);
  const choices = sourceQuestion.choices.map((choice, choiceIndex) => ({
    ...choice,
    id: `${questionId}-${String.fromCharCode(97 + choiceIndex)}`,
  }));
  const answerChoice = choices.find(
    (choice) => choice.grammarId === sourceAnswer.grammarId && !choice.isSimilarDistractor,
  );

  if (answerChoice === undefined) {
    throw new Error(`${grammar.id}/${index + 1}: unable to rebuild answer choice`);
  }

  const { sentenceContext: _sentenceContext, ...sourceFields } = sourceQuestion;

  return {
    ...sourceFields,
    id: questionId,
    sentence: example.japanese,
    sentenceWithBlank: example.japanese.replace(example.answer, "（　　　）"),
    korean: example.korean,
    answerChoiceId: answerChoice.id,
    choices: rotate(choices, grammarNumber + index),
    explanation: buildExplanation(example, grammar, answerChoice.text),
    tags: [...new Set([...grammar.tags, "신규예문", "빈칸"])],
  };
}

function buildSentenceOrderQuestion(example, sourceQuestion, grammar, index, grammarNumber) {
  const questionId = `so-created-${grammar.id}-${String(index + 1).padStart(2, "0")}`;
  const compactOrder = buildCompactSentenceOrder(example.japanese, example.answer);
  const orderedPieces = compactOrder.pieces.map((text, pieceIndex) => ({
    id: `${questionId}-p${pieceIndex + 1}`,
    text,
    order: pieceIndex + 1,
  }));

  return {
    id: questionId,
    level: sourceQuestion.level,
    sentence: example.japanese,
    sentenceWithBlanks: compactOrder.sentenceWithBlanks,
    korean: example.korean,
    pieces: rotate(orderedPieces, grammarNumber + index * 3),
    correctPieceIds: orderedPieces.map((piece) => piece.id),
    explanation: buildExplanation(example, grammar, example.answer),
    sourceGrammarIds: sourceQuestion.sourceGrammarIds,
    tags: [...new Set([...grammar.tags, "신규예문", "문장배열"])],
  };
}

async function applyGeneratedSet(generatedSet, item) {
  const { data, grammar, sources } = item;
  const sourceById = new Map(
    data.fillBlankQuestions
      .filter((question) => !isGeneratedQuestion(question))
      .map((question) => [question.id, question]),
  );
  const grammarNumber = Number.parseInt(grammar.id.split("-")[1], 10);
  const baseFillBlankQuestions = data.fillBlankQuestions.filter((question) => !isGeneratedQuestion(question));
  const baseSentenceOrderQuestions = data.sentenceOrderQuestions.filter((question) => !isGeneratedQuestion(question));
  const fillBlankQuestions = generatedSet.examples.map((example, index) => {
    const sourceQuestion = sourceById.get(example.sourceQuestionId);

    if (sourceQuestion === undefined) {
      throw new Error(`${grammar.id}/${index + 1}: source question unavailable during apply`);
    }

    return buildFillBlankQuestion(example, sourceQuestion, grammar, index, grammarNumber);
  });
  const sentenceOrderQuestions = generatedSet.examples.map((example, index) => {
    const sourceQuestion = sourceById.get(example.sourceQuestionId);

    if (sourceQuestion === undefined) {
      throw new Error(`${grammar.id}/${index + 1}: source question unavailable during apply`);
    }

    return buildSentenceOrderQuestion(example, sourceQuestion, grammar, index, grammarNumber);
  });

  data.fillBlankQuestions = [...baseFillBlankQuestions, ...fillBlankQuestions];
  data.sentenceOrderQuestions = [...baseSentenceOrderQuestions, ...sentenceOrderQuestions];

  await writeFile(
    path.join(questionDirectory, `${grammar.id}.json`),
    `${JSON.stringify(data, null, 2)}\n`,
  );
}

async function loadItems() {
  const grammarItems = parseGrammarData(await readFile(grammarFile, "utf8"));
  const selectedGrammar = grammarItems.filter(
    (grammar) => grammar.no >= fromNumber && grammar.no <= toNumber,
  );

  const items = await Promise.all(
    selectedGrammar.map(async (grammar) => {
      const data = JSON.parse(
        await readFile(path.join(questionDirectory, `${grammar.id}.json`), "utf8"),
      );
      const sources = getSourceQuestions(data);

      if (sources.length === 0) {
        throw new Error(`${grammar.id}: no valid source questions`);
      }

      return { data, grammar, sources };
    }),
  );

  if (!skipValid) {
    return items;
  }

  return items.filter(({ data }) => {
    const fillBlankQuestions = data.fillBlankQuestions.filter((question) =>
      question.id.startsWith("fb-created-"),
    );
    const sentenceOrderQuestions = data.sentenceOrderQuestions.filter((question) =>
      question.id.startsWith("so-created-"),
    );

    if (
      fillBlankQuestions.length !== generatedCount ||
      sentenceOrderQuestions.length !== generatedCount
    ) {
      return true;
    }

    const hasInvalidFillBlank = fillBlankQuestions.some((question) => {
      const answerChoice = getAnswerChoice(question);

      return (
        /[「」]/.test(question.sentence) ||
        /授業|先生|教科書|学習アプリ|例文/.test(question.sentence) ||
        !question.sentenceWithBlank.includes("（　　　）") ||
        question.sentenceWithBlank.replace("（　　　）", answerChoice.text) !== question.sentence
      );
    });
    const hasInvalidSentenceOrder = sentenceOrderQuestions.some((question) => {
      const pieceById = new Map(question.pieces.map((piece) => [piece.id, piece.text]));
      const firstBlankIndex = question.sentenceWithBlanks.indexOf("____");
      const lastBlankIndex = question.sentenceWithBlanks.lastIndexOf("____");
      const prefix = question.sentenceWithBlanks.slice(0, firstBlankIndex).trimEnd();
      const suffix = question.sentenceWithBlanks.slice(lastBlankIndex + "____".length).trimStart();

      return (
        `${prefix}${question.correctPieceIds.map((id) => pieceById.get(id)).join("")}${suffix}` !==
        question.sentence
      );
    });

    return hasInvalidFillBlank || hasInvalidSentenceOrder;
  });
}

async function generateBatch(items, batchIndex) {
  const batchName = items.map((item) => item.grammar.id).join("_");
  const accumulatedExamples = new Map(
    items.map((item) => [item.grammar.id, new Map()]),
  );

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const outputFile = path.join(outputDirectory, `${batchName}-attempt-${attempt}.json`);

    console.log(`[${batchIndex}] generating ${batchName} (attempt ${attempt})`);
    await unlink(outputFile).catch(() => {});

    try {
      await runCodex(buildPrompt(items), outputFile);

      const result = JSON.parse(await readFile(outputFile, "utf8"));
      if (items.length === 1 && result.grammarSets.length === 1) {
        result.grammarSets[0].grammarId = items[0].grammar.id;
        result.grammarSets[0].examples = result.grammarSets[0].examples.map(repairPieces);
      }
      const generatedById = new Map(
        result.grammarSets.map((generatedSet) => [generatedSet.grammarId, generatedSet]),
      );

      for (const item of items) {
        const generatedSet = generatedById.get(item.grammar.id);

        if (generatedSet === undefined) {
          throw new Error(`${batchName}: missing ${item.grammar.id}`);
        }

        const existingSentences = new Set([
          ...item.grammar.examples.map((example) => normalizeSentence(example.japanese)),
          ...item.data.fillBlankQuestions
            .filter((question) => !isGeneratedQuestion(question))
            .map((question) => normalizeSentence(question.sentence)),
        ]);
        const accumulated = accumulatedExamples.get(item.grammar.id);

        generatedSet.examples.map(repairPieces).forEach((example, index) => {
          try {
            validateGeneratedExample(example, item, index, existingSentences);
            accumulated.set(normalizeSentence(example.japanese), example);
          } catch {
            // Keep valid examples from each attempt and replace only rejected items.
          }
        });

        if (accumulated.size < generatedCount) {
          throw new Error(
            `${item.grammar.id}: collected ${accumulated.size}/${generatedCount} valid examples`,
          );
        }
      }

      for (const item of items) {
        const generatedSet = {
          grammarId: item.grammar.id,
          examples: [...accumulatedExamples.get(item.grammar.id).values()].slice(
            0,
            generatedCount,
          ),
        };

        validateGeneratedSet(generatedSet, item);
        await applyGeneratedSet(generatedSet, item);
      }

      console.log(`[${batchIndex}] applied ${batchName}`);
      return;
    } catch (error) {
      console.error(`[${batchIndex}] ${batchName} attempt ${attempt} failed: ${error.message}`);

      if (attempt === maxAttempts) {
        throw error;
      }
    }
  }
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const items = await loadItems();
  const batches = [];

  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }

  let nextBatchIndex = 0;
  const failures = [];

  async function worker() {
    while (nextBatchIndex < batches.length) {
      const batchIndex = nextBatchIndex;
      const batch = batches[nextBatchIndex];

      nextBatchIndex += 1;
      try {
        await generateBatch(batch, batchIndex + 1);
      } catch (error) {
        failures.push({
          grammarIds: batch.map((item) => item.grammar.id),
          message: error.message,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, worker));

  if (failures.length > 0) {
    console.error(`Failed batches: ${JSON.stringify(failures, null, 2)}`);
    process.exitCode = 1;
  }
}

await main();
