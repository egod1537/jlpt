import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(repoRoot, 'data');
const load = async (name) => JSON.parse(await readFile(path.join(dataDir, name), 'utf8'));
const [collectionsDocument, stats, review] = await Promise.all([
  load('collections.json'),
  load('stats.json'),
  load('review.json'),
]);
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const normalize = (value) => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ja-JP');

assert(collectionsDocument.schemaVersion === '1.0.0', 'collections.json schemaVersion이 올바르지 않습니다.');
assert(collectionsDocument.total === collectionsDocument.collections.length, 'collections.json total이 실제 배열 길이와 다릅니다.');

function countCsvRows(text) {
  let rows = 0;
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '"') {
      if (quoted && text[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (text[index] === '\n' && !quoted) rows += 1;
  }
  return rows;
}

const collectionIds = new Set();
const expectedFiles = new Set();
const globalWordIds = new Set();
const reviewKeys = new Set(review.items.map((item) => `${item.collectionId}\u0000${item.id}`));
let wordEntries = 0;
let readyEntries = 0;
let needsReviewEntries = 0;

for (const collection of collectionsDocument.collections) {
  assert(!collectionIds.has(collection.id), `중복 컬렉션 ID: ${collection.id}`);
  collectionIds.add(collection.id);
  assert(collection.dataFile === `wordbooks/${collection.id}.json`, `${collection.id}: JSON 파일 경로가 올바르지 않습니다.`);
  assert(collection.csvFile === `wordbooks/${collection.id}.csv`, `${collection.id}: CSV 파일 경로가 올바르지 않습니다.`);
  expectedFiles.add(path.basename(collection.dataFile));
  expectedFiles.add(path.basename(collection.csvFile));

  let document;
  let csv;
  try {
    [document, csv] = await Promise.all([
      load(collection.dataFile),
      readFile(path.join(dataDir, collection.csvFile), 'utf8'),
    ]);
  } catch (error) {
    errors.push(`${collection.id}: 데이터 파일을 읽을 수 없습니다 (${error.message}).`);
    continue;
  }

  assert(document.schemaVersion === '1.0.0', `${collection.id}: schemaVersion이 올바르지 않습니다.`);
  assert(document.id === collection.id, `${collection.id}: 파일 안의 컬렉션 ID가 다릅니다.`);
  assert(document.title === collection.title, `${collection.id}: 파일 안의 제목이 다릅니다.`);
  assert(document.total === document.words.length, `${collection.id}: total이 실제 배열 길이와 다릅니다.`);
  assert(document.total === collection.wordCount, `${collection.id}: 인덱스의 wordCount가 다릅니다.`);
  assert(countCsvRows(csv) === document.words.length + 1, `${collection.id}: CSV 행 수가 단어 수와 일치하지 않습니다.`);

  const localWordIds = new Set();
  const localWordKeys = new Set();
  for (const word of document.words) {
    assert(/^word-[a-f0-9]{12}$/.test(word.id), `${collection.id}: 잘못된 단어 ID ${word.id}`);
    assert(!localWordIds.has(word.id), `${collection.id}: 중복 단어 ID ${word.id}`);
    localWordIds.add(word.id);
    globalWordIds.add(word.id);
    assert(typeof word.term === 'string' && word.term.trim().length > 0, `${collection.id}/${word.id}: 표제어가 비어 있습니다.`);
    assert(!/[가-힣]/.test(word.term), `${collection.id}/${word.id}: 일본어 표제어에 한글이 섞여 있습니다.`);
    assert(!/[。！？]$/.test(word.term), `${collection.id}/${word.id}: 완전한 문장이 표제어로 들어갔습니다.`);
    assert(Array.isArray(word.meanings), `${collection.id}/${word.id}: meanings가 배열이 아닙니다.`);
    assert(Array.isArray(word.collectionIds) && word.collectionIds.length === 1 && word.collectionIds[0] === collection.id, `${collection.id}/${word.id}: 다른 단어장 참조가 섞여 있습니다.`);
    assert(Array.isArray(word.sources) && word.sources.length > 0, `${collection.id}/${word.id}: sources가 비어 있습니다.`);
    assert(word.sources.every((source) => source.collectionId === collection.id), `${collection.id}/${word.id}: 다른 단어장의 출처가 섞여 있습니다.`);
    assert(['ready', 'needs-review'].includes(word.status), `${collection.id}/${word.id}: status가 올바르지 않습니다.`);
    if (word.status === 'ready') {
      assert(word.meanings.length > 0, `${collection.id}/${word.id}: ready 항목에 뜻이 없습니다.`);
      assert(Boolean(word.reading) || !/\p{Script=Han}/u.test(word.term), `${collection.id}/${word.id}: ready 한자 항목에 읽기가 없습니다.`);
      readyEntries += 1;
    } else {
      needsReviewEntries += 1;
      assert(reviewKeys.has(`${collection.id}\u0000${word.id}`), `${collection.id}/${word.id}: review.json에 없습니다.`);
    }
    const key = [word.term, word.reading ?? '', word.nuance ?? ''].map(normalize).join('\u0000');
    assert(!localWordKeys.has(key), `${collection.id}/${word.id}: 단어장 안에 중복 단어 키가 있습니다.`);
    localWordKeys.add(key);
    const expectedId = `word-${createHash('sha256').update(key).digest('hex').slice(0, 12)}`;
    assert(word.id === expectedId, `${collection.id}/${word.id}: 내용 기반 ID가 일치하지 않습니다(예상 ${expectedId}).`);
  }
  wordEntries += document.words.length;
}

let actualFiles = [];
try {
  actualFiles = await readdir(path.join(dataDir, 'wordbooks'));
} catch (error) {
  errors.push(`wordbooks 폴더를 읽을 수 없습니다 (${error.message}).`);
}
for (const file of actualFiles) assert(expectedFiles.has(file), `인덱스에 없는 단어장 파일: ${file}`);
for (const file of expectedFiles) assert(actualFiles.includes(file), `누락된 단어장 파일: ${file}`);

assert(stats.wordbookFiles === collectionsDocument.collections.length, 'stats.wordbookFiles가 일치하지 않습니다.');
assert(stats.wordEntries === wordEntries, 'stats.wordEntries가 일치하지 않습니다.');
assert(stats.uniqueAcrossWordbooks === globalWordIds.size, 'stats.uniqueAcrossWordbooks가 일치하지 않습니다.');
assert(stats.readyEntries === readyEntries, 'stats.readyEntries가 일치하지 않습니다.');
assert(stats.needsReviewEntries === needsReviewEntries, 'stats.needsReviewEntries가 일치하지 않습니다.');
assert(review.total === review.items.length, 'review.total이 실제 배열 길이와 다릅니다.');
assert(review.total === needsReviewEntries, 'review 항목 수가 검수 대기 단어 수와 다릅니다.');
for (const item of review.items) assert(collectionIds.has(item.collectionId), `review.json: 존재하지 않는 컬렉션 ${item.collectionId}`);

if (errors.length) {
  console.error(`검증 실패 (${errors.length}건)`);
  for (const error of errors.slice(0, 100)) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`검증 완료: 단어장 ${collectionsDocument.collections.length}개, 단어 항목 ${wordEntries}개, 검수 대기 ${review.total}개`);
