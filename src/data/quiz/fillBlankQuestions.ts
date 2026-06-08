import type { FillBlankSentenceContext, JlptLevel } from "../../types/grammar";

export interface FillBlankChoice {
  id: string;
  text: string;
  grammarId: string;
  baseExpression: string;
  conjugatedExpression: string;
  isSimilarDistractor: boolean;
}

export interface FillBlankQuestion {
  id: string;
  level: JlptLevel;
  sentence: string;
  sentenceWithBlank: string;
  korean: string;
  answerChoiceId: string;
  choices: FillBlankChoice[];
  explanation: string;
  sourceGrammarIds: string[];
  tags: string[];
  sentenceContext?: FillBlankSentenceContext;
}

export const fillBlankQuestions: FillBlankQuestion[] = [
  {
    id: "fb-n2-ijou-001",
    level: "N2",
    sentence: "約束した以上は、最後まで責任を持つべきだ。",
    sentenceWithBlank: "約束（　　　）、最後まで責任を持つべきだ。",
    korean: "약속한 이상 끝까지 책임을 져야 한다.",
    answerChoiceId: "fb-n2-ijou-001-a",
    choices: [
      {
        id: "fb-n2-ijou-001-a",
        text: "した以上は",
        grammarId: "n2-003",
        baseExpression: "以上は",
        conjugatedExpression: "した以上は",
        isSimilarDistractor: false,
      },
      {
        id: "fb-n2-ijou-001-b",
        text: "したからといって",
        grammarId: "n2-028",
        baseExpression: "からといって",
        conjugatedExpression: "したからといって",
        isSimilarDistractor: true,
      },
      {
        id: "fb-n2-ijou-001-c",
        text: "したところで",
        grammarId: "n2-059",
        baseExpression: "たところで",
        conjugatedExpression: "したところで",
        isSimilarDistractor: true,
      },
      {
        id: "fb-n2-ijou-001-d",
        text: "するあまり",
        grammarId: "n2-002",
        baseExpression: "あまり",
        conjugatedExpression: "するあまり",
        isSimilarDistractor: true,
      },
    ],
    explanation:
      "「以上は」は、前の事実を受けて「当然〜すべきだ」という意味を表す。ここでは「約束した」という事実があるため、責任を持つべきだという文脈に合う。",
    sourceGrammarIds: ["n2-003", "n2-007", "n2-028", "n2-059"],
    tags: ["責任", "条件", "義務", "유사문법"],
    sentenceContext: {
      requiredConnectionType: "V_PAST",
      semanticTags: ["조건", "책임", "의무"],
      expectsDutyOrResponsibility: true,
    },
  },
  {
    id: "fb-n2-karatoitte-001",
    level: "N2",
    sentence: "アメリカに住んでいたからといって、英語が完璧だとは限らない。",
    sentenceWithBlank: "アメリカに住んでいた（　　　）、英語が完璧だとは限らない。",
    korean: "미국에 살았다고 해서 영어가 완벽하다고는 할 수 없다.",
    answerChoiceId: "fb-n2-karatoitte-001-a",
    choices: [
      {
        id: "fb-n2-karatoitte-001-a",
        text: "からといって",
        grammarId: "n2-028",
        baseExpression: "からといって",
        conjugatedExpression: "からといって",
        isSimilarDistractor: false,
      },
      {
        id: "fb-n2-karatoitte-001-b",
        text: "からには",
        grammarId: "n2-003",
        baseExpression: "以上は",
        conjugatedExpression: "からには",
        isSimilarDistractor: true,
      },
      {
        id: "fb-n2-karatoitte-001-c",
        text: "以上は",
        grammarId: "n2-003",
        baseExpression: "以上は",
        conjugatedExpression: "以上は",
        isSimilarDistractor: true,
      },
      {
        id: "fb-n2-karatoitte-001-d",
        text: "だけあって",
        grammarId: "n2-054",
        baseExpression: "だけあって",
        conjugatedExpression: "だけあって",
        isSimilarDistractor: true,
      },
    ],
    explanation:
      "「からといって」は「〜という理由だけで、必ずしも〜とは言えない」という意味。後ろに「とは限らない」「わけではない」などの否定・制限表現が来やすい。",
    sourceGrammarIds: ["n2-028", "n2-003", "n2-054"],
    tags: ["理由", "否定", "制限", "유사문법"],
    sentenceContext: {
      requiredConnectionType: "PLAIN_FORM",
      semanticTags: ["이유", "부정", "제한"],
      expectsNegativeConclusion: true,
    },
  },
  {
    id: "fb-n2-ageku-001",
    level: "N2",
    sentence: "何度も話し合ったあげく、結局けんか別れになってしまった。",
    sentenceWithBlank: "何度も話し合った（　　　）、結局けんか別れになってしまった。",
    korean: "몇 번이나 의논한 끝에 결국 싸우고 헤어지고 말았다.",
    answerChoiceId: "fb-n2-ageku-001-a",
    choices: [
      {
        id: "fb-n2-ageku-001-a",
        text: "あげく",
        grammarId: "n2-001",
        baseExpression: "あげく",
        conjugatedExpression: "あげく",
        isSimilarDistractor: false,
      },
      {
        id: "fb-n2-ageku-001-b",
        text: "末に",
        grammarId: "n2-050",
        baseExpression: "すえに",
        conjugatedExpression: "末に",
        isSimilarDistractor: true,
      },
      {
        id: "fb-n2-ageku-001-c",
        text: "ところで",
        grammarId: "n2-059",
        baseExpression: "たところで",
        conjugatedExpression: "ところで",
        isSimilarDistractor: true,
      },
      {
        id: "fb-n2-ageku-001-d",
        text: "からには",
        grammarId: "n2-003",
        baseExpression: "以上は",
        conjugatedExpression: "からには",
        isSimilarDistractor: true,
      },
    ],
    explanation:
      "「あげく」は長い過程の末に、望ましくない結果になったことを表す。ここでは「けんか別れになってしまった」という悪い結果に自然につながる。",
    sourceGrammarIds: ["n2-001", "n2-050", "n2-059", "n2-003"],
    tags: ["結果", "悪い結果", "유사문법"],
    sentenceContext: {
      requiredConnectionType: "V_PAST",
      semanticTags: ["결과", "나쁜 결과"],
      expectsBadResult: true,
    },
  },
];
