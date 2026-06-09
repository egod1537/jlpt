import { readFile, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildCompactSentenceOrder } from "./sentenceOrderCompactor.mjs";

const rootDirectory = path.resolve(".");
const questionDirectory = path.join(rootDirectory, "src/data/quiz/byGrammar");
const grammarFile = path.join(rootDirectory, "src/data/grammar/n2Grammar.ts");
const generatedDirectory = path.join(os.tmpdir(), "jlpt-original-quiz-generation");

function parseGrammarData(source) {
  const startIndex = source.indexOf("= [") + 2;
  const endIndex = source.lastIndexOf("];") + 1;

  return JSON.parse(source.slice(startIndex, endIndex));
}

function getAnswerChoice(question) {
  return question.choices.find((choice) => choice.id === question.answerChoiceId);
}

function rotate(items, offset) {
  const normalizedOffset = offset % items.length;

  return [...items.slice(normalizedOffset), ...items.slice(0, normalizedOffset)];
}

function buildExplanation(example, grammar, answer) {
  const warning = grammar.warningKo ? ` 주의할 점은 ${grammar.warningKo}` : "";

  return `「${answer}」는 '${grammar.meaningKo}'라는 뜻을 나타낸다. 이 문장에서는 '${example.korean}'라는 상황에 쓰였으며, ${grammar.nuanceKo}${warning}`;
}

function splitText(value, partCount) {
  if (partCount === 1) {
    return [value];
  }

  const parts = [];
  let startIndex = 0;

  for (let partIndex = 1; partIndex < partCount; partIndex += 1) {
    const targetIndex = Math.round((value.length * partIndex) / partCount);
    const splitIndex = Math.max(
      startIndex + 1,
      Math.min(targetIndex, value.length - (partCount - partIndex)),
    );

    parts.push(value.slice(startIndex, splitIndex));
    startIndex = splitIndex;
  }

  parts.push(value.slice(startIndex));
  return parts;
}

function buildPieces(japanese, answer) {
  const answerIndex = japanese.indexOf(answer);
  const before = japanese.slice(0, answerIndex);
  const after = japanese.slice(answerIndex + answer.length);

  if (before.length >= after.length) {
    return [...splitText(before, 2), answer, after];
  }

  return [before, answer, ...splitText(after, 2)];
}

async function collectValidGeneratedExamples(grammarId) {
  const data = JSON.parse(
    await readFile(path.join(questionDirectory, `${grammarId}.json`), "utf8"),
  );
  const sourceQuestions = data.fillBlankQuestions.filter(
    (question) => !question.id.startsWith("fb-created-"),
  );
  const sourceById = new Map(sourceQuestions.map((question) => [question.id, question]));
  const files = (await readdir(generatedDirectory))
    .filter((file) => file.startsWith(`${grammarId}-attempt-`))
    .sort();
  const examples = new Map();

  for (const file of files) {
    let result;

    try {
      result = JSON.parse(await readFile(path.join(generatedDirectory, file), "utf8"));
    } catch {
      continue;
    }

    for (const generatedSet of result.grammarSets ?? []) {
      for (const example of generatedSet.examples ?? []) {
        const sourceQuestion = sourceById.get(example.sourceQuestionId);
        const answerChoice =
          sourceQuestion === undefined ? undefined : getAnswerChoice(sourceQuestion);

        if (
          answerChoice === undefined ||
          example.answer !== answerChoice.text ||
          example.japanese.split(example.answer).length - 1 !== 1 ||
          /[「」]/.test(example.japanese) ||
          /授業|先生|教科書|学習アプリ|例文/.test(example.japanese)
        ) {
          continue;
        }

        examples.set(example.japanese, {
          ...example,
          pieces:
            example.pieces?.length === 4 &&
            example.pieces.join("") === example.japanese &&
            example.pieces.some((piece) => piece.includes(example.answer))
              ? example.pieces
              : buildPieces(example.japanese, example.answer),
        });
      }
    }
  }

  return [...examples.values()];
}

const supplementalExamples = {
  "n2-072": [
    {
      sourceQuestionId: "fb-auto-n2-072-1",
      answer: "てでも",
      japanese: "家宝を質に入れてでも、失踪した妹を捜すための費用を工面する。",
      korean: "가보를 전당포에 맡겨서라도 실종된 여동생을 찾을 비용을 마련한다.",
    },
    {
      sourceQuestionId: "fb-auto-n2-072-1",
      answer: "てでも",
      japanese: "反対派を説得してでも、老朽化した堤防の補強工事を始める必要がある。",
      korean: "반대파를 설득해서라도 노후한 제방의 보강 공사를 시작할 필요가 있다.",
    },
  ],
  "n2-167": [
    {
      sourceQuestionId: "fb-auto-n2-167-1",
      answer: "ようものなら",
      japanese: "社外秘の設計図を外部の人間に見せようものなら、即座に懲戒解雇されるだろう。",
      korean: "사외비 설계도를 외부인에게 보여 주기라도 하면 즉시 징계 해고될 것이다.",
    },
    {
      sourceQuestionId: "fb-auto-n2-167-1",
      answer: "ようものなら",
      japanese: "この時期にダムの放流量を急に変更しようものなら、下流の集落が浸水する恐れがある。",
      korean: "이 시기에 댐 방류량을 갑자기 변경하기라도 하면 하류 마을이 침수될 우려가 있다.",
    },
  ],
};

const n2166Examples = [
  ["容疑者は裏口からタクシーに乗り込もうとしていた。", "용의자는 뒷문으로 택시에 올라타려 하고 있었다."],
  ["発車ベルが鳴る中、青年は閉まりかけたドアに駆け込もうとしていた。", "출발 벨이 울리는 가운데 청년은 닫히려는 문 안으로 뛰어들려 하고 있었다."],
  ["記者が声をかけたとき、大臣は報告書を読もうとしていた。", "기자가 말을 걸었을 때 장관은 보고서를 읽으려 하고 있었다."],
  ["看護師が止めたとき、患者は勝手に薬を飲もうとしていた。", "간호사가 말렸을 때 환자는 마음대로 약을 먹으려 하고 있었다."],
  ["濃い霧の中で、救助隊はさらに奥へ進もうとしていた。", "짙은 안개 속에서 구조대는 더 안쪽으로 나아가려 하고 있었다."],
  ["夜勤を終えた警備員は、休憩室で少し休もうとしていた。", "야간 근무를 마친 경비원은 휴게실에서 잠시 쉬려 하고 있었다."],
  ["二人は退職後、海の見える町に住もうとしていた。", "두 사람은 퇴직 후 바다가 보이는 마을에서 살려고 하고 있었다."],
  ["資金が尽きた監督は、旧友に援助を頼もうとしていた。", "자금이 바닥난 감독은 옛 친구에게 도움을 부탁하려 하고 있었다."],
  ["新人選手は世界王者との試合に挑もうとしていた。", "신인 선수는 세계 챔피언과의 경기에 도전하려 하고 있었다."],
  ["研究チームは未解明の感染経路の調査に取り組もうとしていた。", "연구팀은 밝혀지지 않은 감염 경로 조사에 착수하려 하고 있었다."],
  ["捜査員は証拠を確保するため、倉庫の奥へ踏み込もうとしていた。", "수사관은 증거를 확보하기 위해 창고 안쪽으로 들어가려 하고 있었다."],
  ["岸にいた男性は、流された子どもを追って川へ飛び込もうとしていた。", "강가에 있던 남자는 떠내려간 아이를 쫓아 강으로 뛰어들려 하고 있었다."],
  ["開発者は新しい認証機能を既存のシステムに組み込もうとしていた。", "개발자는 새로운 인증 기능을 기존 시스템에 넣으려 하고 있었다."],
  ["締め切り直前、彼女は海外研修に申し込もうとしていた。", "마감 직전 그녀는 해외 연수에 신청하려 하고 있었다."],
  ["係員は端末に大量の顧客データを読み込もうとしていた。", "담당자는 단말기에 대량의 고객 데이터를 불러오려 하고 있었다."],
  ["避難所の職員は井戸から飲み水を汲もうとしていた。", "대피소 직원은 우물에서 식수를 길으려 하고 있었다."],
  ["母親は眠った赤ん坊を毛布で包み込もうとしていた。", "어머니는 잠든 아기를 담요로 감싸려 하고 있었다."],
  ["ゴール直前、選手は目の前の優勝をつかもうとしていた。", "결승점 직전 선수는 눈앞의 우승을 붙잡으려 하고 있었다."],
  ["職人は細い銀線を指輪の模様に編み込もうとしていた。", "장인은 가는 은선을 반지 무늬에 엮어 넣으려 하고 있었다."],
  ["警察が到着したころ、犯人は空き家へ逃げ込もうとしていた。", "경찰이 도착했을 무렵 범인은 빈집으로 도망쳐 들어가려 하고 있었다."],
  ["泥棒は住人の留守を確かめて窓から忍び込もうとしていた。", "도둑은 주민이 없는 것을 확인하고 창문으로 몰래 들어가려 하고 있었다."],
  ["作業員は大きすぎる荷物をエレベーターに押し込もうとしていた。", "작업원은 너무 큰 짐을 엘리베이터에 밀어 넣으려 하고 있었다."],
  ["乗客は規則に反して自転車を車内へ持ち込もうとしていた。", "승객은 규칙을 어기고 자전거를 차량 안으로 반입하려 하고 있었다."],
  ["若い料理人は老舗旅館の厨房に住み込もうとしていた。", "젊은 요리사는 오래된 여관의 주방에서 숙식하며 일하려 하고 있었다."],
  ["広報部は新商品の発表会に人気俳優を呼び込もうとしていた。", "홍보부는 신상품 발표회에 인기 배우를 불러오려 하고 있었다."],
].map(([japanese, korean]) => ({
  sourceQuestionId: "fb-auto-n2-166-1",
  answer: "もうとしていた",
  japanese,
  korean,
  pieces: buildPieces(japanese, "もうとしていた"),
}));

async function applyExamples(grammarId, examples, grammarById) {
  const filePath = path.join(questionDirectory, `${grammarId}.json`);
  const data = JSON.parse(await readFile(filePath, "utf8"));
  const grammar = grammarById.get(grammarId);
  const baseFillBlankQuestions = data.fillBlankQuestions.filter(
    (question) => !question.id.startsWith("fb-created-"),
  );
  const baseSentenceOrderQuestions = data.sentenceOrderQuestions.filter(
    (question) => !question.id.startsWith("so-created-"),
  );
  const sourceById = new Map(baseFillBlankQuestions.map((question) => [question.id, question]));
  const grammarNumber = Number.parseInt(grammarId.split("-")[1], 10);

  if (examples.length !== 25 || new Set(examples.map((example) => example.japanese)).size !== 25) {
    throw new Error(`${grammarId}: expected 25 unique examples`);
  }
  if (grammar === undefined) {
    throw new Error(`${grammarId}: missing grammar metadata`);
  }

  data.fillBlankQuestions = [
    ...baseFillBlankQuestions,
    ...examples.map((example, index) => {
      const sourceQuestion = sourceById.get(example.sourceQuestionId);
      const sourceAnswer = getAnswerChoice(sourceQuestion);
      const questionId = `fb-created-${grammarId}-${String(index + 1).padStart(2, "0")}`;
      const choices = sourceQuestion.choices.map((choice, choiceIndex) => ({
        ...choice,
        id: `${questionId}-${String.fromCharCode(97 + choiceIndex)}`,
      }));
      const answerChoice = choices.find(
        (choice) => choice.grammarId === sourceAnswer.grammarId && !choice.isSimilarDistractor,
      );
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
    }),
  ];
  data.sentenceOrderQuestions = [
    ...baseSentenceOrderQuestions,
    ...examples.map((example, index) => {
      const sourceQuestion = sourceById.get(example.sourceQuestionId);
      const questionId = `so-created-${grammarId}-${String(index + 1).padStart(2, "0")}`;
      const compactOrder = buildCompactSentenceOrder(example.japanese, example.answer);
      const pieces = compactOrder.pieces.map(
        (text, pieceIndex) => ({
          id: `${questionId}-p${pieceIndex + 1}`,
          text,
          order: pieceIndex + 1,
        }),
      );

      return {
        id: questionId,
        level: sourceQuestion.level,
        sentence: example.japanese,
        sentenceWithBlanks: compactOrder.sentenceWithBlanks,
        korean: example.korean,
        pieces: rotate(pieces, grammarNumber + index * 3),
        correctPieceIds: pieces.map((piece) => piece.id),
        explanation: buildExplanation(example, grammar, example.answer),
        sourceGrammarIds: sourceQuestion.sourceGrammarIds,
        tags: [...new Set([...grammar.tags, "신규예문", "문장배열"])],
      };
    }),
  ];

  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

const grammarById = new Map(
  parseGrammarData(await readFile(grammarFile, "utf8")).map((grammar) => [grammar.id, grammar]),
);

for (const grammarId of ["n2-072", "n2-167"]) {
  const generated = await collectValidGeneratedExamples(grammarId);
  const combined = new Map(generated.map((example) => [example.japanese, example]));

  for (const example of supplementalExamples[grammarId]) {
    combined.set(example.japanese, {
      ...example,
      pieces: buildPieces(example.japanese, example.answer),
    });
  }

  await applyExamples(grammarId, [...combined.values()].slice(0, 25), grammarById);
}

await applyExamples("n2-166", n2166Examples, grammarById);

console.log("Finalized n2-072, n2-166, and n2-167.");
