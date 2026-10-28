import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDir, "..", "..", "..");
const frontRoot = path.join(repositoryRoot, "src", "front");
const sourceRoot = path.join(repositoryRoot, "jlpt-vocabulary-dataset", "data");
const outputRoot = path.join(frontRoot, "public", "data");
const temporaryRoot = `${outputRoot}.tmp-${process.pid}`;
const wordIdPattern = /^word-[a-f0-9]{12}$/;

const fail = (message) => {
  throw new Error(`데이터 동기화 실패: ${message}`);
};

const readJson = async (filePath) => {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    fail(`${filePath}을 읽을 수 없습니다 (${error instanceof Error ? error.message : String(error)})`);
  }
};

const safeSourcePath = (relativePath) => {
  if (typeof relativePath !== "string" || path.isAbsolute(relativePath)) fail("잘못된 dataFile 경로");
  const resolved = path.resolve(sourceRoot, relativePath);
  if (!resolved.startsWith(`${sourceRoot}${path.sep}`)) fail(`data/ 밖을 가리키는 경로: ${relativePath}`);
  return resolved;
};

const writeJson = async (filePath, value) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
};

const validateWord = (word, collectionId, position) => {
  if (!word || typeof word !== "object") fail(`${collectionId} ${position + 1}번째 단어가 객체가 아닙니다`);
  if (!wordIdPattern.test(word.id)) fail(`${collectionId}의 잘못된 단어 ID: ${word.id}`);
  if (typeof word.term !== "string" || word.term.length === 0) fail(`${word.id}의 표제어가 없습니다`);
  if (word.reading !== null && typeof word.reading !== "string") fail(`${word.id}의 reading 형식이 잘못되었습니다`);
  if (!Array.isArray(word.meanings) || word.meanings.some((item) => typeof item !== "string")) fail(`${word.id}의 meanings 형식이 잘못되었습니다`);
  if (word.primaryMeaning !== null && typeof word.primaryMeaning !== "string") fail(`${word.id}의 primaryMeaning 형식이 잘못되었습니다`);
  if (word.nuance !== null && typeof word.nuance !== "string") fail(`${word.id}의 nuance 형식이 잘못되었습니다`);
  if (!Array.isArray(word.jlptLevels) || !Array.isArray(word.years)) fail(`${word.id}의 배열 필드가 잘못되었습니다`);
  if (word.status !== "ready" && word.status !== "needs-review") fail(`${word.id}의 status가 잘못되었습니다`);
};

const build = async () => {
  const collections = await readJson(path.join(sourceRoot, "collections.json"));
  const stats = await readJson(path.join(sourceRoot, "stats.json"));
  const review = await readJson(path.join(sourceRoot, "review.json"));
  if (!collections || !Array.isArray(collections.collections) || collections.collections.length === 0) fail("collections 목록이 비어 있습니다");
  if (collections.total !== collections.collections.length) fail("collections.total이 목록 길이와 다릅니다");

  const seenCollections = new Set();
  const seenWordIds = new Set();
  const occurrences = [];
  let readyEntries = 0;
  let needsReviewEntries = 0;

  await rm(temporaryRoot, { recursive: true, force: true });
  await mkdir(path.join(temporaryRoot, "wordbooks"), { recursive: true });

  for (const meta of collections.collections) {
    if (!meta || typeof meta !== "object" || typeof meta.id !== "string" || typeof meta.title !== "string" || typeof meta.category !== "string") fail("컬렉션 필수 필드가 없습니다");
    if (seenCollections.has(meta.id)) fail(`중복 컬렉션 ID: ${meta.id}`);
    seenCollections.add(meta.id);
    const inputPath = safeSourcePath(meta.dataFile);
    const book = await readJson(inputPath);
    if (book.id !== meta.id || book.title !== meta.title) fail(`${meta.id}의 ID/제목이 인덱스와 다릅니다`);
    if (!Array.isArray(book.words) || book.total !== book.words.length || meta.wordCount !== book.words.length) fail(`${meta.id}의 단어 수가 일치하지 않습니다`);
    book.words.forEach((word, position) => {
      validateWord(word, meta.id, position);
      seenWordIds.add(word.id);
      if (word.status === "ready") readyEntries += 1;
      else needsReviewEntries += 1;
      occurrences.push({
        collectionId: meta.id,
        wordId: word.id,
        term: word.term,
        reading: word.reading,
        meanings: word.meanings,
        primaryMeaning: word.primaryMeaning,
        nuance: word.nuance,
        jlptLevels: word.jlptLevels,
        years: word.years,
        status: word.status,
        position,
      });
    });
    await writeJson(path.join(temporaryRoot, "wordbooks", `${meta.id}.json`), book);
  }

  const expected = {
    wordbookFiles: collections.collections.length,
    wordEntries: occurrences.length,
    uniqueAcrossWordbooks: seenWordIds.size,
    readyEntries,
    needsReviewEntries,
  };
  for (const [field, actual] of Object.entries(expected)) {
    if (stats[field] !== actual) fail(`stats.${field}=${stats[field]}이지만 실제 값은 ${actual}입니다`);
  }
  if (!Array.isArray(review.items) || review.total !== review.items.length || review.total !== needsReviewEntries) fail("review.json 수량이 검수 필요 항목과 다릅니다");

  await writeJson(path.join(temporaryRoot, "collections.json"), collections);
  await writeJson(path.join(temporaryRoot, "stats.json"), stats);
  await writeJson(path.join(temporaryRoot, "review.json"), review);
  await writeJson(path.join(temporaryRoot, "search-index.json"), { schemaVersion: "1.0.0", generatedAt: stats.generatedAt, total: occurrences.length, occurrences });
  await writeJson(path.join(temporaryRoot, "manifest.json"), { schemaVersion: "1.0.0", generatedAt: stats.generatedAt, collections: collections.collections.length, occurrences: occurrences.length, uniqueWords: seenWordIds.size });

  const oldRoot = `${outputRoot}.old-${process.pid}`;
  await rm(oldRoot, { recursive: true, force: true });
  try {
    await rename(outputRoot, oldRoot);
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
  }
  await rename(temporaryRoot, outputRoot);
  await rm(oldRoot, { recursive: true, force: true });
  const copiedBooks = await readdir(path.join(outputRoot, "wordbooks"));
  console.log(`데이터 동기화 완료: 단어장 ${copiedBooks.length}개, 출현 ${occurrences.length}개, 고유 단어 ${seenWordIds.size}개`);
};

build().catch(async (error) => {
  await rm(temporaryRoot, { recursive: true, force: true });
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
