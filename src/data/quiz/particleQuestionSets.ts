import type { GrammarQuestionSet } from "./questionData";

interface ParticleChoiceDefinition {
  grammarId: string;
  text: string;
}

interface ParticleQuestionDefinition {
  grammarId: string;
  answer: string;
  sentence: string;
  sentenceWithBlank: string;
  korean: string;
  choices: ParticleChoiceDefinition[];
  pieces: [string, string, string, string];
  explanation: string;
}

const expressionByGrammarId: Readonly<Record<string, string>> = {
  "n2-182": "だけ",
  "n2-183": "のみ",
  "n2-184": "こそ",
  "n2-185": "さえ",
  "n2-186": "すら",
  "n2-187": "でも",
  "n2-188": "など",
  "n2-189": "なんか",
  "n2-190": "なんて",
  "n2-191": "くらい / ぐらい",
  "n2-192": "ほど",
  "n2-193": "まで",
};

const definitions: ParticleQuestionDefinition[] = [
  {
    grammarId: "n2-182",
    answer: "だけ",
    sentence: "今日は朝から水だけ飲んだ。",
    sentenceWithBlank: "今日は朝から水（　　　）飲んだ。",
    korean: "오늘은 아침부터 물만 마셨다.",
    choices: [
      { grammarId: "n2-184", text: "こそ" },
      { grammarId: "n2-182", text: "だけ" },
      { grammarId: "n2-187", text: "でも" },
      { grammarId: "n2-193", text: "まで" },
    ],
    pieces: ["今日は", "朝から", "水だけ", "飲んだ。"],
    explanation: "「だけ」는 일상적인 상황에서 범위를 중립적으로 '~만'이라고 제한한다.",
  },
  {
    grammarId: "n2-183",
    answer: "のみ",
    sentence: "この入口は関係者のみ利用できます。",
    sentenceWithBlank: "この入口は関係者（　　　）利用できます。",
    korean: "이 입구는 관계자만 이용할 수 있습니다.",
    choices: [
      { grammarId: "n2-183", text: "のみ" },
      { grammarId: "n2-189", text: "なんか" },
      { grammarId: "n2-187", text: "でも" },
      { grammarId: "n2-192", text: "ほど" },
    ],
    pieces: ["この入口は", "関係者のみ", "利用", "できます。"],
    explanation: "「のみ」는 안내문이나 규정에서 범위를 공식적·문어적으로 한정한다.",
  },
  {
    grammarId: "n2-184",
    answer: "こそ",
    sentence: "今度こそ必ず試験に合格したい。",
    sentenceWithBlank: "今度（　　　）必ず試験に合格したい。",
    korean: "이번에야말로 반드시 시험에 합격하고 싶다.",
    choices: [
      { grammarId: "n2-182", text: "だけ" },
      { grammarId: "n2-193", text: "まで" },
      { grammarId: "n2-184", text: "こそ" },
      { grammarId: "n2-188", text: "など" },
    ],
    pieces: ["今度こそ", "必ず", "試験に", "合格したい。"],
    explanation: "「こそ」는 다른 때가 아니라 '이번이야말로'라는 강한 강조를 나타낸다.",
  },
  {
    grammarId: "n2-185",
    answer: "さえ",
    sentence: "必要な資金さえあれば、この計画を始められる。",
    sentenceWithBlank: "必要な資金（　　　）あれば、この計画を始められる。",
    korean: "필요한 자금만 있으면 이 계획을 시작할 수 있다.",
    choices: [
      { grammarId: "n2-187", text: "でも" },
      { grammarId: "n2-185", text: "さえ" },
      { grammarId: "n2-184", text: "こそ" },
      { grammarId: "n2-193", text: "まで" },
    ],
    pieces: ["必要な資金さえ", "あれば、", "この計画を", "始められる。"],
    explanation: "「さえ〜ば」는 그것 하나만 충족되면 된다는 최소 조건을 나타낸다.",
  },
  {
    grammarId: "n2-186",
    answer: "すら",
    sentence: "彼は謝罪の言葉すら口にしなかった。",
    sentenceWithBlank: "彼は謝罪の言葉（　　　）口にしなかった。",
    korean: "그는 사과의 말조차 입에 담지 않았다.",
    choices: [
      { grammarId: "n2-190", text: "なんて" },
      { grammarId: "n2-186", text: "すら" },
      { grammarId: "n2-187", text: "でも" },
      { grammarId: "n2-191", text: "くらい" },
    ],
    pieces: ["彼は", "謝罪の言葉すら", "口にしな", "かった。"],
    explanation: "「すら」는 부정적인 문장에서 극단적인 예를 문어적이고 딱딱하게 강조한다.",
  },
  {
    grammarId: "n2-187",
    answer: "でも",
    sentence: "少し休んで、お茶でも飲みませんか。",
    sentenceWithBlank: "少し休んで、お茶（　　　）飲みませんか。",
    korean: "조금 쉬면서 차라도 마시지 않을래요?",
    choices: [
      { grammarId: "n2-193", text: "まで" },
      { grammarId: "n2-188", text: "など" },
      { grammarId: "n2-187", text: "でも" },
      { grammarId: "n2-184", text: "こそ" },
    ],
    pieces: ["少し", "休んで、", "お茶でも", "飲みませんか。"],
    explanation: "「でも」는 권유할 때 부담 없는 예를 '~라도'라는 느낌으로 가볍게 제시한다.",
  },
  {
    grammarId: "n2-188",
    answer: "など",
    sentence: "申請書には氏名や住所などを記入してください。",
    sentenceWithBlank: "申請書には氏名や住所（　　　）を記入してください。",
    korean: "신청서에는 성명과 주소 등을 기입해 주세요.",
    choices: [
      { grammarId: "n2-189", text: "なんか" },
      { grammarId: "n2-184", text: "こそ" },
      { grammarId: "n2-188", text: "など" },
      { grammarId: "n2-192", text: "ほど" },
    ],
    pieces: ["申請書には", "氏名や住所などを", "記入して", "ください。"],
    explanation: "「など」는 공식적인 문맥에서 몇 가지 예를 문어적으로 열거한다.",
  },
  {
    grammarId: "n2-189",
    answer: "なんか",
    sentence: "私なんかにそんな大役は務まりません。",
    sentenceWithBlank: "私（　　　）にそんな大役は務まりません。",
    korean: "저 같은 사람에게 그런 중책은 감당할 수 없습니다.",
    choices: [
      { grammarId: "n2-183", text: "のみ" },
      { grammarId: "n2-193", text: "まで" },
      { grammarId: "n2-189", text: "なんか" },
      { grammarId: "n2-192", text: "ほど" },
    ],
    pieces: ["私なんかに", "そんな", "大役は", "務まりません。"],
    explanation: "「なんか」는 회화에서 자신이나 대상을 가볍게 낮추어 '~같은 것'이라고 말한다.",
  },
  {
    grammarId: "n2-190",
    answer: "なんて",
    sentence: "彼が一人で優勝するなんて信じられない。",
    sentenceWithBlank: "彼が一人で優勝する（　　　）信じられない。",
    korean: "그가 혼자 우승하다니 믿을 수 없다.",
    choices: [
      { grammarId: "n2-190", text: "なんて" },
      { grammarId: "n2-182", text: "だけ" },
      { grammarId: "n2-187", text: "でも" },
      { grammarId: "n2-193", text: "まで" },
    ],
    pieces: ["彼が一人で", "優勝する", "なんて", "信じられない。"],
    explanation: "「なんて」는 문장 전체를 받아 예상 밖의 사실에 대한 놀람을 '~라니'로 나타낸다.",
  },
  {
    grammarId: "n2-191",
    answer: "くらい",
    sentence: "会場まで歩いて十五分くらいかかります。",
    sentenceWithBlank: "会場まで歩いて十五分（　　　）かかります。",
    korean: "행사장까지 걸어서 15분 정도 걸립니다.",
    choices: [
      { grammarId: "n2-184", text: "こそ" },
      { grammarId: "n2-191", text: "くらい" },
      { grammarId: "n2-188", text: "など" },
      { grammarId: "n2-193", text: "まで" },
    ],
    pieces: ["会場まで", "歩いて", "十五分くらい", "かかります。"],
    explanation: "「くらい」는 수량이 정확한 값이 아니라 대략 그 정도임을 나타낸다.",
  },
  {
    grammarId: "n2-192",
    answer: "ほど",
    sentence: "声も出ないほど驚いた。",
    sentenceWithBlank: "声も出ない（　　　）驚いた。",
    korean: "목소리도 나오지 않을 만큼 놀랐다.",
    choices: [
      { grammarId: "n2-187", text: "でも" },
      { grammarId: "n2-193", text: "まで" },
      { grammarId: "n2-188", text: "など" },
      { grammarId: "n2-192", text: "ほど" },
    ],
    pieces: ["声も", "出ないほど", "驚い", "た。"],
    explanation: "「ほど」는 목소리도 나오지 않을 만큼 정도가 매우 강함을 나타낸다.",
  },
  {
    grammarId: "n2-193",
    answer: "まで",
    sentence: "普段は味方の兄にまで反対された。",
    sentenceWithBlank: "普段は味方の兄に（　　　）反対された。",
    korean: "평소에는 내 편인 형에게까지 반대당했다.",
    choices: [
      { grammarId: "n2-183", text: "のみ" },
      { grammarId: "n2-193", text: "まで" },
      { grammarId: "n2-189", text: "なんか" },
      { grammarId: "n2-192", text: "ほど" },
    ],
    pieces: ["普段は", "味方の兄にまで", "反対", "された。"],
    explanation: "「まで」는 예상하지 못한 대상인 형까지 범위에 포함되었음을 강조한다.",
  },
];

function buildQuestionSet(definition: ParticleQuestionDefinition): GrammarQuestionSet {
  const questionKey = `${definition.grammarId}-01`;
  const fillBlankId = `fb-created-${questionKey}`;
  const sentenceOrderId = `so-created-${questionKey}`;
  const choices = definition.choices.map((choice, index) => ({
    id: `${fillBlankId}-${String.fromCharCode(97 + index)}`,
    text: choice.text,
    grammarId: choice.grammarId,
    baseExpression: expressionByGrammarId[choice.grammarId] ?? choice.text,
    conjugatedExpression: choice.text,
    isSimilarDistractor: choice.grammarId !== definition.grammarId,
  }));
  const answerChoice = choices.find(
    (choice) => choice.grammarId === definition.grammarId && choice.text === definition.answer,
  );

  if (answerChoice === undefined) {
    throw new Error(`${definition.grammarId}: missing particle answer choice`);
  }

  const pieces = definition.pieces.map((text, index) => ({
    id: `${sentenceOrderId}-p${index + 1}`,
    text,
    order: index + 1,
  }));
  const sourceGrammarIds = [
    definition.grammarId,
    ...definition.choices
      .map((choice) => choice.grammarId)
      .filter((grammarId) => grammarId !== definition.grammarId),
  ];

  return {
    grammarId: definition.grammarId,
    fillBlankQuestions: [
      {
        id: fillBlankId,
        level: "N2",
        sentence: definition.sentence,
        sentenceWithBlank: definition.sentenceWithBlank,
        korean: definition.korean,
        answerChoiceId: answerChoice.id,
        choices,
        explanation: definition.explanation,
        sourceGrammarIds,
        tags: ["부조사", "신규예문", "빈칸"],
      },
    ],
    sentenceOrderQuestions: [
      {
        id: sentenceOrderId,
        level: "N2",
        sentence: definition.sentence,
        sentenceWithBlanks: "____ ____ ____ ____",
        korean: definition.korean,
        pieces,
        correctPieceIds: pieces.map((piece) => piece.id),
        explanation: definition.explanation,
        sourceGrammarIds,
        tags: ["부조사", "신규예문", "문장배열"],
      },
    ],
  };
}

export const particleQuestionSets: GrammarQuestionSet[] = definitions.map(buildQuestionSet);
