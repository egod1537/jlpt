import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildCompactSentenceOrder } from "./sentenceOrderCompactor.mjs";

const rootDirectory = path.resolve(".");
const rawFile = path.join(rootDirectory, "rarw_db.txt");
const grammarFile = path.join(rootDirectory, "src/data/grammar/n2Grammar.ts");
const questionDirectory = path.join(rootDirectory, "src/data/quiz/byGrammar");
const additionMarker = "일본어 문법 추가 정리본";
const sourceTag = "rarw-db-추가";

const answerBySourceNumber = {
  177: "一方だ",
  178: "上に",
  179: "上",
  180: "うちに",
  181: "おかげで",
  182: "やいなや",
  183: "そばから",
  184: "にすれば",
  185: "にかけて",
  186: "代わりに",
  187: "に代わって",
  188: "気だ",
  189: "からこそ",
  190: "ことから",
  191: "ことは読んだが",
  192: "ことはない",
  193: "ことになった",
  194: "ことにした",
  195: "でさえ",
  196: "さえあれば",
  197: "らせていただけませんか",
  198: "しかない",
  199: "だけのことはあって",
  200: "だけましだ",
  201: "としても",
  202: "としたら",
  203: "だろうに",
  204: "ついでに",
  205: "がてら",
  206: "てからでないと",
  207: "でしょうがない",
  208: "てはじめて",
  209: "手前",
  210: "てみせる",
  211: "というか",
  212: "ということだ",
  213: "というより",
  214: "といっても",
  215: "として",
  216: "というのは",
  217: "とみえて",
  218: "において",
  219: "に限る",
  220: "について",
  221: "に決まっている",
  222: "に比べて",
  223: "に従って",
  224: "に対して",
  225: "につれて",
  226: "にとって",
  227: "に反して",
  228: "によって",
  229: "によると",
  230: "にわたって",
  231: "は別として",
  232: "すればするほど",
  233: "はもちろん",
  234: "反面",
  235: "はずがない",
  236: "わけだ",
  237: "をきっかけに",
  238: "を込めて",
  239: "を通じて",
};

const categoryGroups = {
  변화: [177, 223, 225, 232],
  추가: [178, 233],
  관점: [179, 184, 215, 218, 220, 224, 226, 228],
  시간: [180, 182, 183, 185, 204, 205, 206, 208, 230, 239],
  원인: [181, 190, 217, 229],
  대체: [186, 187],
  의지: [188, 194, 210],
  강조: [189, 195, 196],
  결정: [193, 194],
  불필요: [192, 198],
  평가: [199, 200, 219],
  가정: [201, 202, 203],
  감정: [207, 238],
  책임: [209],
  설명: [211, 212, 213, 214, 216],
  확신: [221, 235, 236],
  비교: [222, 224, 227, 231, 232, 234],
  계기: [237],
  수단: [228, 238, 239],
};

const highFrequencyNumbers = new Set([
  178, 180, 181, 186, 189, 192, 193, 194, 198, 201, 204, 211, 212, 213,
  214, 215, 220, 221, 222, 224, 225, 226, 228, 229, 232, 233, 235, 236,
]);

function parseGrammarData(source) {
  const startIndex = source.indexOf("= [") + 2;
  const endIndex = source.lastIndexOf("];") + 1;

  return JSON.parse(source.slice(startIndex, endIndex));
}

function parseRawAdditions(source) {
  const markerIndex = source.indexOf(additionMarker);

  if (markerIndex < 0) {
    throw new Error(`Missing marker: ${additionMarker}`);
  }

  const additionSource = source.slice(markerIndex);
  const headings = [...additionSource.matchAll(/^(\d+)\. (.+)$/gm)];

  return headings.map((heading, index) => {
    const sourceNumber = Number.parseInt(heading[1], 10);
    const bodyStart = (heading.index ?? 0) + heading[0].length + 1;
    const bodyEnd = headings[index + 1]?.index ?? additionSource.length;
    const body = additionSource.slice(bodyStart, bodyEnd).trim();
    const connection = body.match(/^접속형: (.+)$/m)?.[1];
    const meaningKo = body.match(/^뜻: (.+)$/m)?.[1];
    const nuanceKo = body.match(/^뉘앙스: (.+)$/m)?.[1];
    const exampleMatches = [
      ...body.matchAll(/^예문: (.+)\n해석: (.+)$/gm),
    ];

    if (
      connection === undefined ||
      meaningKo === undefined ||
      nuanceKo === undefined ||
      exampleMatches.length === 0
    ) {
      throw new Error(`${sourceNumber}: incomplete raw grammar entry`);
    }

    return {
      sourceNumber,
      expression: heading[2].trim(),
      connection,
      meaningKo,
      nuanceKo,
      examples: exampleMatches.map((example, index) => ({
        sourceIndex: index + 1,
        japanese: example[1].trim(),
        korean: example[2].trim(),
      })),
    };
  });
}

function getCategories(sourceNumber) {
  return Object.entries(categoryGroups)
    .filter(([, numbers]) => numbers.includes(sourceNumber))
    .map(([category]) => category);
}

function getRegister(nuanceKo) {
  if (nuanceKo.includes("문어")) {
    return "문어체";
  }

  if (nuanceKo.includes("회화")) {
    return "회화체";
  }

  return "중립";
}

function rotate(items, offset) {
  const normalizedOffset = offset % items.length;
  return [...items.slice(normalizedOffset), ...items.slice(0, normalizedOffset)];
}

function buildGrammarItems(rawItems, startingNumber) {
  const idBySourceNumber = new Map(
    rawItems.map((item, index) => [
      item.sourceNumber,
      `n2-${String(startingNumber + index).padStart(3, "0")}`,
    ]),
  );

  return rawItems.map((item, index) => {
    const number = startingNumber + index;
    const id = idBySourceNumber.get(item.sourceNumber);
    const categories = getCategories(item.sourceNumber);
    const similarSourceNumbers = [
      ...new Set(
        categories.flatMap((category) => categoryGroups[category] ?? []),
      ),
    ]
      .filter((sourceNumber) => sourceNumber !== item.sourceNumber)
      .slice(0, 4);

    return {
      id,
      no: number,
      noLabel: String(number),
      level: "N2",
      expression: item.expression,
      connection: item.connection.replace(/\s*\+\s*/g, "+"),
      meaningKo: item.meaningKo,
      nuanceKo: item.nuanceKo,
      register: getRegister(item.nuanceKo),
      frequency: highFrequencyNumbers.has(item.sourceNumber) ? 3 : 2,
      similarGrammarIds: similarSourceNumbers
        .map((sourceNumber) => idBySourceNumber.get(sourceNumber))
        .filter(Boolean),
      similarExpressionNames: similarSourceNumbers
        .map(
          (sourceNumber) =>
            rawItems.find((candidate) => candidate.sourceNumber === sourceNumber)
              ?.expression,
        )
        .filter(Boolean),
      examples: item.examples.map((example) => ({
        id: `${id}-ex-${example.sourceIndex}`,
        japanese: example.japanese,
        korean: example.korean,
      })),
      tags: [...categories, "추가문법", sourceTag],
      blankChoiceForms: [
        {
          formId: "raw-example-form",
          label: item.expression,
          text: answerBySourceNumber[item.sourceNumber],
          requiredContext: item.connection,
          note: item.nuanceKo,
        },
      ],
      sourceNumber: item.sourceNumber,
    };
  });
}

function getQuestionCandidates(grammar, additions) {
  const candidates = additions
    .filter((candidate) => candidate.id !== grammar.id)
    .map((candidate) => ({
      grammar: candidate,
      score: grammar.tags.filter((tag) => candidate.tags.includes(tag)).length,
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.grammar.no - right.grammar.no,
    )
    .slice(0, 3)
    .map(({ grammar: candidate }) => candidate);

  return [grammar, ...candidates];
}

function buildQuestionSet(grammar, additions) {
  const sourceNumber = grammar.sourceNumber;
  const answer = answerBySourceNumber[sourceNumber];
  const example = grammar.examples[0];

  if (answer === undefined || !example.japanese.includes(answer)) {
    throw new Error(
      `${grammar.id}: example does not contain configured answer "${answer}"`,
    );
  }

  const fillBlankId = `fb-created-${grammar.id}-01`;
  const sentenceOrderId = `so-created-${grammar.id}-01`;
  const questionCandidates = getQuestionCandidates(grammar, additions);
  const choices = rotate(
    questionCandidates.map((candidate, index) => ({
      id: `${fillBlankId}-${String.fromCharCode(97 + index)}`,
      text: answerBySourceNumber[candidate.sourceNumber],
      grammarId: candidate.id,
      baseExpression: candidate.expression,
      conjugatedExpression: answerBySourceNumber[candidate.sourceNumber],
      isSimilarDistractor: candidate.id !== grammar.id,
    })),
    grammar.no,
  );
  const answerChoice = choices.find((choice) => choice.grammarId === grammar.id);
  const compactOrder = buildCompactSentenceOrder(example.japanese, answer);
  const orderedPieces = compactOrder.pieces.map((text, index) => ({
    id: `${sentenceOrderId}-p${index + 1}`,
    text,
    order: index + 1,
  }));

  return {
    grammarId: grammar.id,
    fillBlankQuestions: [
      {
        id: fillBlankId,
        level: "N2",
        sentence: example.japanese,
        sentenceWithBlank: example.japanese.replace(answer, "（　　　）"),
        korean: example.korean,
        answerChoiceId: answerChoice.id,
        choices,
        explanation: `「${answer}」는 '${grammar.meaningKo}'라는 뜻이다. ${grammar.nuanceKo}`,
        sourceGrammarIds: questionCandidates.map((candidate) => candidate.id),
        tags: [...grammar.tags, "신규예문", "빈칸"],
      },
    ],
    sentenceOrderQuestions: [
      {
        id: sentenceOrderId,
        level: "N2",
        sentence: example.japanese,
        sentenceWithBlanks: compactOrder.sentenceWithBlanks,
        korean: example.korean,
        pieces: rotate(orderedPieces, grammar.no),
        correctPieceIds: orderedPieces.map((piece) => piece.id),
        explanation: `「${answer}」를 사용해 '${grammar.meaningKo}'의 의미를 나타낸 문장이다. ${grammar.nuanceKo}`,
        sourceGrammarIds: questionCandidates.map((candidate) => candidate.id),
        tags: [...grammar.tags, "신규예문", "문장배열"],
      },
    ],
  };
}

const rawSource = await readFile(rawFile, "utf8");
const grammarSource = await readFile(grammarFile, "utf8");
const currentGrammar = parseGrammarData(grammarSource);
const rawAdditions = parseRawAdditions(rawSource);
const existingGrammar = currentGrammar.filter(
  (grammar) => !grammar.tags.includes(sourceTag),
);
const nextGrammarNumber =
  Math.max(0, ...existingGrammar.map((grammar) => grammar.no)) + 1;
const additions = buildGrammarItems(rawAdditions, nextGrammarNumber);
const serializedGrammar = additions.map(({ sourceNumber: _sourceNumber, ...grammar }) => grammar);
const questionSets = additions.map((grammar) => ({
  grammar,
  questionSet: buildQuestionSet(grammar, additions),
}));

for (const grammar of currentGrammar.filter((item) => item.tags.includes(sourceTag))) {
  await rm(path.join(questionDirectory, `${grammar.id}.json`), { force: true });
}

await writeFile(
  grammarFile,
  `import type { GrammarItem } from "../../types/grammar";\n\nexport const n2Grammar: GrammarItem[] = ${JSON.stringify(
    [...existingGrammar, ...serializedGrammar],
    null,
    2,
  )};\n`,
);

for (const { grammar, questionSet } of questionSets) {
  await writeFile(
    path.join(questionDirectory, `${grammar.id}.json`),
    `${JSON.stringify(questionSet, null, 2)}\n`,
  );
}

console.log(
  `Imported ${additions.length} grammar items as ${additions[0].id}..${additions.at(-1).id}.`,
);
