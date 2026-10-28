import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "flashcard-template.html");
const outputPath = path.join(root, "data", "imported-html", "n1-yuui-79-84.json");
const checkOnly = process.argv.includes("--check");

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function extractWords(html) {
  const marker = "const words = ";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("flashcard HTML에서 const words 선언을 찾지 못했습니다.");
  const valueStart = start + marker.length;
  const end = html.indexOf(";", valueStart);
  if (end < 0) throw new Error("flashcard HTML의 words 배열 끝을 찾지 못했습니다.");
  const suffix = html.slice(end + 1);
  if (!suffix.includes("function") && !suffix.includes("renderSelect")) throw new Error("flashcard HTML 경계 검증에 실패했습니다.");
  return JSON.parse(html.slice(valueStart, end));
}

function validateWords(value) {
  if (!Array.isArray(value) || value.length !== 268) throw new Error("HTML 카드 수는 정확히 268개여야 합니다.");
  const tuples = new Set();
  for (const [index, word] of value.entries()) {
    if (!word || typeof word !== "object" || Array.isArray(word)) throw new Error(`${index + 1}번 카드가 객체가 아닙니다.`);
    if (word.n !== index + 1) throw new Error(`${index + 1}번 카드 순서가 연속적이지 않습니다.`);
    for (const field of ["jp", "rd", "kr", "pos", "ex", "exKr"]) {
      if (typeof word[field] !== "string" || word[field].trim().length === 0 || word[field].length > 4_000) throw new Error(`${word.n}번 ${field} 값이 올바르지 않습니다.`);
    }
    if (!Number.isInteger(word.star) || word.star < 0 || word.star > 3) throw new Error(`${word.n}번 star 값이 올바르지 않습니다.`);
    if (word.nuance !== undefined && (typeof word.nuance !== "string" || word.nuance.length > 1_000)) throw new Error(`${word.n}번 nuance 값이 올바르지 않습니다.`);
    const tuple = JSON.stringify([word.n, word.jp, word.rd, word.kr, word.nuance ?? ""]);
    if (tuples.has(tuple)) throw new Error(`${word.n}번 카드의 식별 튜플이 중복됩니다.`);
    tuples.add(tuple);
  }
  if (new Set(value.map((word) => word.jp)).size !== 244) throw new Error("고유 일본어 표기는 정확히 244개여야 합니다.");
  if (new Set(value.map((word) => word.pos)).size !== 7) throw new Error("품사 그룹은 정확히 7개여야 합니다.");
}

function normalizedDocument(html, words) {
  const sourceSha256 = hash(html);
  return {
    schemaVersion: "1.0.0",
    id: "html-n1-yuui-79-84",
    title: "N1 유의표현 예상 어휘 79–84",
    category: "JLPT N1",
    sourceFile: "flashcard-template.html",
    sourceSha256,
    total: words.length,
    uniqueJapanese: new Set(words.map((word) => word.jp)).size,
    partOfSpeechCount: new Set(words.map((word) => word.pos)).size,
    cards: words.map((word) => {
      const identity = `${word.n}\u0000${word.jp}\u0000${word.rd}\u0000${word.kr}\u0000${word.nuance ?? ""}`;
      const digest = hash(`html:n1-yuui-79-84:v1\u0000${identity}`);
      return {
        entryId: `html-entry-${digest.slice(0, 20)}`,
        wordId: `word-${digest.slice(20, 32)}`,
        sourceIndex: word.n,
        term: word.jp,
        reading: word.rd,
        meanings: [word.kr],
        primaryMeaning: word.kr,
        nuance: word.nuance ?? null,
        partOfSpeech: [word.pos],
        sourcePriority: word.star,
        examples: [{ ja: word.ex, ko: word.exKr }],
        tags: ["source-html", `source-star:${word.star}`, `source-index:${word.n}`, `pos:${word.pos}`],
        source: { sourceType: "html", sourceFile: "flashcard-template.html", sourceIndex: word.n, sourcePriority: word.star },
      };
    }),
  };
}

const html = await readFile(sourcePath, "utf8");
const words = extractWords(html);
validateWords(words);
const rendered = `${JSON.stringify(normalizedDocument(html, words), null, 2)}\n`;

if (checkOnly) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== rendered) throw new Error("정규화 산출물이 원본 HTML과 다릅니다. npm run convert:html을 실행하세요.");
} else {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, rendered, "utf8");
}

console.log(JSON.stringify({ source: path.relative(root, sourcePath), output: path.relative(root, outputPath), cards: words.length, sourceSha256: hash(html), mode: checkOnly ? "check" : "write" }));
