import type { JlptLevel } from "../../types/grammar";

export interface SentenceOrderPiece {
  id: string;
  text: string;
  order: number;
}

export interface SentenceOrderQuestion {
  id: string;
  level: JlptLevel;
  sentence: string;
  sentenceWithBlanks: string;
  korean: string;
  pieces: SentenceOrderPiece[];
  correctPieceIds: string[];
  explanation: string;
  sourceGrammarIds: string[];
  tags: string[];
}

export const sentenceOrderQuestions: SentenceOrderQuestion[] = [
  {
    id: "so-n2-ijou-001",
    level: "N2",
    sentence: "学生である以上、勉強を第一にしなさい。",
    sentenceWithBlanks: "学生である ____ ____ ____ ____。",
    korean: "학생인 이상 공부를 최우선으로 하세요.",
    pieces: [
      { id: "so-n2-ijou-001-p1", text: "勉強を", order: 2 },
      { id: "so-n2-ijou-001-p2", text: "第一に", order: 3 },
      { id: "so-n2-ijou-001-p3", text: "以上", order: 1 },
      { id: "so-n2-ijou-001-p4", text: "しなさい", order: 4 },
    ],
    correctPieceIds: ["so-n2-ijou-001-p3", "so-n2-ijou-001-p1", "so-n2-ijou-001-p2", "so-n2-ijou-001-p4"],
    explanation:
      "「以上」は「Nである以上」の形で、前提が成立する以上、後ろの義務・責任が当然だという意味を表す。「学生である」に直接続き、その後に義務内容が続く。",
    sourceGrammarIds: ["n2-003"],
    tags: ["条件", "義務", "文法配列"],
  },
  {
    id: "so-n2-karatoitte-001",
    level: "N2",
    sentence: "日本に住んでいたからといって、日本語が完璧だとは限らない。",
    sentenceWithBlanks: "日本に住んでいた ____ ____ ____ ____。",
    korean: "일본에 살았다고 해서 일본어가 완벽하다고는 할 수 없다.",
    pieces: [
      { id: "so-n2-karatoitte-001-p1", text: "からといって", order: 1 },
      { id: "so-n2-karatoitte-001-p2", text: "日本語が", order: 2 },
      { id: "so-n2-karatoitte-001-p3", text: "完璧だとは", order: 3 },
      { id: "so-n2-karatoitte-001-p4", text: "限らない", order: 4 },
    ],
    correctPieceIds: [
      "so-n2-karatoitte-001-p1",
      "so-n2-karatoitte-001-p2",
      "so-n2-karatoitte-001-p3",
      "so-n2-karatoitte-001-p4",
    ],
    explanation:
      "「からといって」は、前の理由だけで後ろの結論が必ず成立するわけではないことを表す。後ろには「とは限らない」「わけではない」などの否定・制限表現が来やすい。",
    sourceGrammarIds: ["n2-028"],
    tags: ["理由", "制限", "否定呼応"],
  },
  {
    id: "so-n2-karatoitte-002",
    level: "N2",
    sentence: "値段が高いからといって、品質がいいとは限らない。",
    sentenceWithBlanks: "値段が高い ____ ____ ____ ____。",
    korean: "가격이 비싸다고 해서 품질이 좋다고는 할 수 없다.",
    pieces: [
      { id: "so-n2-karatoitte-002-p1", text: "品質が", order: 2 },
      { id: "so-n2-karatoitte-002-p2", text: "からといって", order: 1 },
      { id: "so-n2-karatoitte-002-p3", text: "とは限らない", order: 4 },
      { id: "so-n2-karatoitte-002-p4", text: "いい", order: 3 },
    ],
    correctPieceIds: [
      "so-n2-karatoitte-002-p2",
      "so-n2-karatoitte-002-p1",
      "so-n2-karatoitte-002-p4",
      "so-n2-karatoitte-002-p3",
    ],
    explanation:
      "「からといって」は「〜だからといって必ずしも〜ではない」という意味で、後ろに「とは限らない」が来る。ここでは「値段が高い」という理由だけで「品質がいい」とは言えない、という文になる。",
    sourceGrammarIds: ["n2-028"],
    tags: ["理由", "制限", "否定呼応"],
  },
];
