import importedData from "@/content/grammar/imported-documents.json";

type ImportedDocument = {
  id: string;
  title: string;
  sourceFile: string;
  markdown: string;
};

const supplementalExamples: Record<string, string[]> = {
  "imported-01-point-01": [
    "この香りをかぐと、子供のころに過ごした夏休みが懐かしく思い出される。",
    "事故の知らせを聞いて、現地にいる友人の安否が案じられた。",
  ],
  "imported-01-point-10": [
    "新しい職場にも少しずつ慣れてこられたことと思います。",
    "長旅でさぞお疲れのことと思います。",
  ],
  "imported-02-point-06": ["数回の審議を経て、新しい規則が正式に採択された。"],
  "imported-02-point-07": ["この契約は双方の合意を前提として成立する。"],
  "imported-02-point-10": ["この町は景色もさることながら、地元の料理も魅力的だ。"],
  "imported-02-point-12": ["この難しい手術を任せられる医師は、彼をおいてほかにいない。"],
  "imported-02-point-14": ["彼女は周囲の批判をものともせず、自分の研究を続けた。"],
  "imported-02-point-16": ["彼は医師の忠告を押して、試合への出場を決めた。"],
  "imported-02-point-18": ["家を出ようとした矢先に、激しい雨が降り出した。"],
  "imported-03-point-02": ["修理を終えた作業員の手は油まみれになっていた。"],
  "imported-04-point-05": ["経験の有無いかんにかかわらず、誰でも応募できます。"],
  "imported-04-point-10": [
    "彼は安定した収入と引き換えに、自由な時間を失った。",
    "新しい道路の建設と引き換えに、豊かな森が伐採された。",
    "多額の費用と引き換えに、最新の設備を手に入れた。",
  ],
  "imported-04-point-13": ["アンケートの結果を踏まえて、サービスの内容を見直した。"],
  "imported-05-point-02": ["目標を達成すべく、チーム全員が力を合わせた。"],
  "imported-05-point-03": ["今となっては、当時の真相を知るべくもない。"],
  "imported-05-point-04": [
    "長年努力してきた彼は、勝つべくして勝ったと言える。",
    "十分な準備を怠ったその計画は、失敗すべくして失敗した。",
  ],
  "imported-06-point-10": [
    "ベルが鳴るが早いか、生徒たちは教室を飛び出した。",
    "彼は駅に着くが早いか、待っていた電車に飛び乗った。",
  ],
  "imported-06-point-14": [
    "運動を兼ねて、毎朝一駅分歩いて通勤している。",
    "市場調査を兼ねて、話題の店を訪ねた。",
    "休養を兼ねて、週末は温泉地で過ごすことにした。",
  ],
};

function plainText(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function documentTitle(sourceFile: string) {
  return sourceFile.replace(/^(\d+)_/, "$1. ").replace(/\.md$/i, "").replaceAll("_", " ");
}

function fieldValues(section: string, field: "접속" | "의미" | "주의") {
  return section.split("\n").flatMap((line) => {
    const match = line.match(new RegExp(`^- \\*\\*${field}(?:\\s*[①②③④⑤⑥⑦⑧⑨⑩A-Z])?[^:]*:\\*\\*\\s*(.+)$`));
    return match ? [plainText(match[1])] : [];
  });
}

function parseDocument(document: ImportedDocument, documentIndex: number) {
  const headingPattern = /^##\s+(\d+)\.\s+(.+)$/gm;
  const headings = [...document.markdown.matchAll(headingPattern)];
  const title = documentTitle(document.sourceFile);
  const points = headings.map((heading, pointIndex) => {
    const id = `${document.id}-point-${String(pointIndex + 1).padStart(2, "0")}`;
    const start = heading.index ?? 0;
    const end = headings[pointIndex + 1]?.index ?? document.markdown.length;
    const sectionMarkdown = document.markdown.slice(start, end).trim();
    const headingText = heading[2].trim();
    const [pattern, subtitle = ""] = headingText.split(/\s+—\s+/, 2);
    const meanings = fieldValues(sectionMarkdown, "의미");
    const connections = fieldValues(sectionMarkdown, "접속");
    const cautions = fieldValues(sectionMarkdown, "주의");
    const examples = [
      ...[...sectionMarkdown.matchAll(/^\d+\.\s+(.+)$/gm)].map((match) => plainText(match[1])),
      ...(supplementalExamples[id] ?? []),
    ].map((japanese) => ({ japanese, korean: "" }));
    return {
      id,
      pattern: pattern.trim(),
      reading: pattern.trim(),
      meaning: meanings.join(" ") || subtitle || "원문 설명을 확인하세요.",
      connection: connections.length ? connections : ["원문 접속 설명 참조"],
      explanation: meanings.join(" ") || subtitle || `${title} 문서의 문형입니다.`,
      caution: cautions.join(" ") || undefined,
      examples,
      keywords: [title],
      notesMarkdown: sectionMarkdown.replace(/^##[^\n]*\n?/, "").trim(),
      sourceFile: document.sourceFile,
    };
  });
  const pointIds = points.map((point) => point.id);
  return {
    points,
    sets: [
      {
        id: `${document.id}-cards`,
        title,
        description: `${title} 문형 ${points.length}개를 한 장씩 학습합니다.`,
        level: "N1" as const,
        type: "flashcard" as const,
        pointIds,
        sourceFile: document.sourceFile,
        sortOrder: 100 + documentIndex * 2,
      },
      {
        id: `${document.id}-book`,
        title,
        description: `${document.sourceFile} 원문을 목차와 함께 이어 읽습니다.`,
        level: "N1" as const,
        type: "book" as const,
        pointIds,
        markdown: document.markdown,
        sourceFile: document.sourceFile,
        sortOrder: 101 + documentIndex * 2,
      },
    ],
  };
}

const parsed = (importedData.documents as ImportedDocument[]).map(parseDocument);

export const importedGrammarPoints = parsed.flatMap((document) => document.points);
export const importedGrammarSets = parsed.flatMap((document) => document.sets);
