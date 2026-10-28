import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archiveRoot = path.resolve(process.argv[2] ?? path.join(repoRoot, '..', 'jlpt-wordbook-archive'));
const dataDir = path.join(repoRoot, 'data');

if (!existsSync(path.join(archiveRoot, 'catalog.json'))) {
  console.error(`아카이브를 찾을 수 없습니다: ${archiveRoot}`);
  process.exit(1);
}

const catalog = JSON.parse(await readFile(path.join(archiveRoot, 'catalog.json'), 'utf8'));
const sessionByFolder = new Map(catalog.sessions.map((session) => [session.folder, session]));
const candidates = [];
const candidateKeys = new Set();
const unparsed = [];

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const stableId = (value) => `word-${sha256(value).slice(0, 12)}`;
const posix = (value) => value.split(path.sep).join('/');
const relativeArchivePath = (value) => posix(path.relative(archiveRoot, value));
const unique = (values) => [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ''))];
const collator = new Intl.Collator('ja');

async function walk(root) {
  const output = [];
  const entries = await readdir(root, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...await walk(fullPath));
    else output.push(fullPath);
  }
  return output;
}

function sessionFolderFromPath(filePath) {
  const relative = path.relative(path.join(archiveRoot, 'sessions'), filePath);
  return relative.split(path.sep)[0];
}

function collectionIdForFolder(folder) {
  const session = sessionByFolder.get(folder);
  return session ? `session-${String(session.index).padStart(3, '0')}` : null;
}

function isGenericInstruction(content) {
  const head = content.slice(0, 1000);
  return head.includes('일본어 플래시카드 사이트 제작 지시문')
    || head.includes('다의어 맥락(nuance) 라벨 표시 명세')
    || (head.includes('## 전체 구조') && head.includes('## 동작 로직'));
}

function addCandidate({ collectionId, sourceType, sourceFile, content, label = null }) {
  if (!collectionId || typeof content !== 'string') return;
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (normalized.length < 3 || isGenericInstruction(normalized)) return;
  const contentHash = sha256(normalized);
  const key = `${collectionId}\u0000${contentHash}`;
  if (candidateKeys.has(key)) return;
  candidateKeys.add(key);
  candidates.push({ collectionId, sourceType, sourceFile, label, content: normalized, contentHash });
}

function hasJapanese(value) {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(value);
}

function hasKorean(value) {
  return /[가-힣]/.test(value);
}

function looksLikeVocabularyText(value) {
  if (typeof value !== 'string' || value.length < 20 || value.length > 2_000_000) return false;
  if (!hasJapanese(value) || !hasKorean(value)) return false;
  if ((value.match(/\n/g) ?? []).length < 2) return false;
  return true;
}

function commandLooksLikeFullUploadRead(command) {
  if (typeof command !== 'string' || !command.includes('/mnt/user-data/uploads')) return false;
  if (/\b(head|tail)\b/.test(command)) return false;
  return /\bcat\s+["']?\/mnt\/user-data\/uploads\//.test(command)
    || /read_text/.test(command)
    || /^\/mnt\/user-data\/uploads\/.+\.[a-z0-9]+$/i.test(command);
}

function tryJson(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || !'[{'.includes(trimmed[0])) return null;
  try { return JSON.parse(trimmed); } catch { return null; }
}

function recoverPayloads(value, command, output, seen = new Set()) {
  if (value === null || value === undefined) return;
  if (typeof value === 'string') {
    const parsed = tryJson(value);
    if (parsed !== null) recoverPayloads(parsed, command, output, seen);
    return;
  }
  if (typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);

  const filename = typeof value.filename === 'string' ? value.filename : null;
  if (filename?.includes('/uploads/') && looksLikeVocabularyText(value.content)) {
    output.push({ content: value.content, label: path.basename(filename) });
  }
  if (commandLooksLikeFullUploadRead(command) && looksLikeVocabularyText(value.stdout)) {
    const match = command.match(/\/uploads\/([^"'\s/]+)/);
    output.push({ content: value.stdout, label: match ? match[1] : 'recovered-upload.txt' });
  }
  if (commandLooksLikeFullUploadRead(command) && typeof value.text === 'string' && tryJson(value.text) === null && looksLikeVocabularyText(value.text)) {
    output.push({ content: value.text, label: path.basename(command) || 'recovered-upload.txt' });
  }
  for (const nested of Object.values(value)) recoverPayloads(nested, command, output, seen);
}

function extractJsonWordArrays(content) {
  const arrays = [];
  const expression = /\b(?:const|let|var)\s+words\s*=\s*(\[[\s\S]*?\])\s*;/gi;
  for (const match of content.matchAll(expression)) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) arrays.push(parsed);
    } catch {
      // JS 객체 리터럴은 실행하지 않는다. JSON 배열만 안전하게 회수한다.
    }
  }
  return arrays;
}

// 1) 세션 첨부 텍스트
for (const filePath of await walk(path.join(archiveRoot, 'sessions'))) {
  if (path.extname(filePath).toLowerCase() !== '.txt' || !filePath.includes(`${path.sep}attachments${path.sep}`)) continue;
  const folder = sessionFolderFromPath(filePath);
  addCandidate({
    collectionId: collectionIdForFolder(folder),
    sourceType: 'attachment',
    sourceFile: relativeArchivePath(filePath),
    content: await readFile(filePath, 'utf8'),
    label: path.basename(filePath),
  });
}

// 2) 세션에 연결된 최종 HTML artifact
for (const filePath of await walk(path.join(archiveRoot, 'sessions'))) {
  if (path.basename(filePath) !== 'artifact.json' || !filePath.includes(`${path.sep}html${path.sep}`)) continue;
  const folder = sessionFolderFromPath(filePath);
  const artifact = JSON.parse(await readFile(filePath, 'utf8'));
  const activeVersion = artifact.activeVersion ?? artifact.active_version;
  if (!activeVersion) continue;
  const htmlPath = path.join(path.dirname(filePath), 'versions', `${activeVersion}.html`);
  if (!existsSync(htmlPath)) continue;
  const html = await readFile(htmlPath, 'utf8');
  for (const [index, words] of extractJsonWordArrays(html).entries()) {
    addCandidate({
      collectionId: collectionIdForFolder(folder),
      sourceType: 'html-artifact',
      sourceFile: `${relativeArchivePath(htmlPath)}#words-${index + 1}`,
      content: JSON.stringify(words),
      label: artifact.title ?? path.basename(htmlPath),
    });
  }
}

// 3) 대화 내부에 남은 업로드 파일 읽기 결과
for (const filePath of await walk(path.join(archiveRoot, 'sessions'))) {
  if (path.basename(filePath) !== 'conversation.json') continue;
  const folder = sessionFolderFromPath(filePath);
  const conversation = JSON.parse(await readFile(filePath, 'utf8'));
  for (const message of conversation.chat_messages ?? []) {
    const blocks = Array.isArray(message.content) ? message.content : [];
    const uses = new Map(blocks.filter((block) => block?.type === 'tool_use').map((block) => [block.id, block]));
    for (const block of blocks.filter((entry) => entry?.type === 'tool_result')) {
      const toolUse = uses.get(block.tool_use_id);
      const command = toolUse?.input?.command ?? toolUse?.input?.path ?? '';
      const recovered = [];
      recoverPayloads(block.content, command, recovered);
      for (const [index, item] of recovered.entries()) {
        addCandidate({
          collectionId: collectionIdForFolder(folder),
          sourceType: 'conversation-recovery',
          sourceFile: `${relativeArchivePath(filePath)}#${block.tool_use_id ?? 'tool-result'}-${index + 1}`,
          content: item.content,
          label: item.label,
        });
      }
    }
  }
}

const KANA_ONLY = /^[\p{Script=Hiragana}\p{Script=Katakana}ー・〜～]+$/u;
const READING_ONLY = /^[\p{Script=Hiragana}\p{Script=Katakana}ー・／/\s]+$/u;
const HAN = /\p{Script=Han}/u;
const CODE_PREFIX = /^(?:const|let|var|function|class|import|export|return|if|for|while|def|from|print|echo|open|with|async|await)\b/;

function normalizeText(value) {
  return String(value ?? '').normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

function cleanTerm(value) {
  return normalizeText(value)
    .replace(/^(?:tab|pair|pipe)\s+/i, '')
    .replace(/^(?:[-*•·・●○▪◦]+|\d{1,4}[.)．번]?)[\s]*/, '')
    .replace(/[★*]+$/g, '')
    .replace(/^['"“”‘’]|['"“”‘’]$/g, '')
    .trim();
}

function cleanMeaning(value) {
  const result = normalizeText(value)
    .replace(/^(?:[-–—:：|]+\s*)/, '')
    .replace(/^(?:뜻|의미)\s*[:：]\s*/, '')
    .replace(/^[（(][^）)]*[）)]\s*/, '')
    .replace(/\s*[|]+\s*$/, '')
    .trim();
  return result || null;
}

function normalizeReading(value, term) {
  const reading = normalizeText(value).replace(/^[-—–/／|]+$/, '').replace(/\s/g, '');
  if (reading) return reading;
  return KANA_ONLY.test(term.replace(/\s/g, '')) ? term.replace(/\s/g, '') : null;
}

function splitNuance(term) {
  const index = term.indexOf('｜');
  if (index < 0) return { term, nuance: null };
  return { term: cleanTerm(term.slice(0, index)), nuance: normalizeText(term.slice(index + 1)) || null };
}

function parseTermAndReading(raw) {
  const value = cleanTerm(raw);
  for (const expression of [
    /^(.+?)[（(]([^）)]+)[）)]$/u,
    /^(.+?)\[([^\]]+)\]$/u,
  ]) {
    const match = value.match(expression);
    if (match && READING_ONLY.test(match[2])) {
      const split = splitNuance(cleanTerm(match[1]));
      return { ...split, reading: normalizeReading(match[2], split.term) };
    }
  }
  const split = splitNuance(value);
  return { ...split, reading: normalizeReading('', split.term) };
}

function validTerm(term) {
  if (!term || term.length > 80 || !hasJapanese(term)) return false;
  if (/[{}<>=$`]/.test(term) || CODE_PREFIX.test(term)) return false;
  if (/^(?:問題|형식|출처|기준|총|번호|단어|요미가나|한자읽기|문맥구성|기출어휘|JLPT)$/i.test(term)) return false;
  return true;
}

function makeRecord(rawTerm, rawMeaning, context = {}, extra = {}) {
  const parsed = parseTermAndReading(rawTerm);
  const term = cleanTerm(extra.term ?? parsed.term);
  if (!validTerm(term)) return null;
  const meaning = cleanMeaning(rawMeaning);
  const reading = normalizeReading(extra.reading ?? parsed.reading ?? '', term);
  return {
    term,
    reading,
    meaning,
    nuance: normalizeText(extra.nuance ?? parsed.nuance) || null,
    partOfSpeech: extra.partOfSpeech ? [normalizeText(extra.partOfSpeech)] : [],
    level: extra.level ?? context.level ?? null,
    year: extra.year ?? context.year ?? null,
    section: context.section ?? null,
    relatedTerms: extra.relatedTerms ?? [],
    examples: extra.examples ?? [],
    line: extra.line ?? null,
  };
}

function parseDelimitedLine(line, context, lineNumber) {
  let fields = null;
  if (line.includes('\t')) fields = line.split(/\t+/).map(normalizeText).filter(Boolean);
  else if (line.includes('|') && !line.includes('||')) fields = line.split('|').map(normalizeText).filter(Boolean);
  if (!fields || fields.length < 2) return null;

  if (/^\d+$/.test(fields[0])) fields.shift();
  let level = null;
  if (/^N[1-5]$/i.test(fields[0])) level = fields.shift().toUpperCase();
  if (fields.length < 2) return null;

  if (fields.length >= 3 && (READING_ONLY.test(fields[1]) || fields[1] === '-')) {
    return makeRecord(fields[0], fields.slice(2).join(' | '), context, { reading: fields[1], level, line: lineNumber });
  }
  if (fields.length >= 2 && hasKorean(fields.slice(1).join(' '))) {
    return makeRecord(fields[0], fields.slice(1).join(' | '), context, { level, line: lineNumber });
  }
  return null;
}

function parseSingleLine(line, context, lineNumber) {
  const value = normalizeText(line).replace(/^\d{1,4}[.)．]\s*/, '');
  if (!value || value.startsWith('#') || value.startsWith('```') || /^[=─━]{3,}$/.test(value)) return null;

  const delimited = parseDelimitedLine(value, context, lineNumber);
  if (delimited) return delimited;

  const levelFields = value.match(/^(N[1-5])\s+(\S+)\s+(.+)$/i);
  if (levelFields) {
    const [, level, term, rest] = levelFields;
    const withReading = rest.match(/^([\p{Script=Hiragana}\p{Script=Katakana}ー・／/-]+)\s+(.+)$/u);
    if (withReading && hasKorean(withReading[2])) {
      return makeRecord(term, withReading[2], context, { reading: withReading[1], level: level.toUpperCase(), line: lineNumber });
    }
    if (hasKorean(rest)) return makeRecord(term, rest, context, { level: level.toUpperCase(), line: lineNumber });
  }

  const prefixedPair = value.match(/^(?:pair\s+)?(.+?)\s*(?:\/|→)\s*(.+)$/u);
  if (prefixedPair && hasJapanese(prefixedPair[1]) && !hasKorean(prefixedPair[1]) && hasKorean(prefixedPair[2])) {
    return makeRecord(prefixedPair[1], prefixedPair[2], context, { line: lineNumber });
  }

  if (/[{}<>$`]/.test(value) || CODE_PREFIX.test(value)) return null;

  if (value.includes('≒')) {
    const [primary, related] = value.split('≒', 2).map(normalizeText);
    const match = primary.match(/^(.+?)\s+(명|동|부|형|가|접|ナ형|イ형|1형|2형|3형)(?:\)|\s+)(.+)$/u)
      ?? primary.match(/^(\S+)\s+(.+)$/u);
    if (match && hasKorean(match.at(-1))) {
      const relatedTerm = cleanTerm((related.match(/^([^\s]+(?:する)?)/u) ?? [])[1] ?? '');
      return makeRecord(match[1], match.at(-1), context, {
        partOfSpeech: match.length === 4 ? match[2] : null,
        relatedTerms: validTerm(relatedTerm) ? [relatedTerm] : [],
        line: lineNumber,
      });
    }
  }

  const termReadingMeaning = value.match(/^(.+?[（(][^）)]+[）)]|.+?\[[^\]]+\])\s*(?:—|–|-|:|：)\s*(.+)$/u);
  if (termReadingMeaning && hasKorean(termReadingMeaning[2])) {
    return makeRecord(termReadingMeaning[1], termReadingMeaning[2], context, { line: lineNumber });
  }

  const separated = value.match(/^(.{1,80}?)\s*(?:—|–|:|：)\s*(.+)$/u);
  if (separated && hasJapanese(separated[1]) && !hasKorean(separated[1]) && hasKorean(separated[2])) {
    return makeRecord(separated[1], separated[2], context, { line: lineNumber });
  }

  const whitespaceReading = value.match(/^(\S+)\s+([\p{Script=Hiragana}\p{Script=Katakana}ー・／/-]+)\s+(.+)$/u);
  if (whitespaceReading && hasKorean(whitespaceReading[3])) {
    return makeRecord(whitespaceReading[1], whitespaceReading[3], context, { reading: whitespaceReading[2], line: lineNumber });
  }

  const posMeaning = value.match(/^(.+?)\s+(명|동|부|형|가|접|ナ형|イ형|1형|2형|3형)(?:\)|\s+)(.+)$/u);
  if (posMeaning && hasKorean(posMeaning[3])) {
    return makeRecord(posMeaning[1], posMeaning[3], context, { partOfSpeech: posMeaning[2], line: lineNumber });
  }

  const loose = value.match(/^(\S{1,60})\s+(.+)$/u);
  if (loose && hasJapanese(loose[1]) && hasKorean(loose[2])) {
    return makeRecord(loose[1], loose[2], context, { line: lineNumber });
  }
  return null;
}

function headerState(line, context) {
  const value = normalizeText(line);
  const year = value.match(/(?:^|\D)(20(?:0\d|1\d|2\d))(?:년|$|\D)/);
  if (year && value.length < 40) context.year = Number(year[1]);
  const level = value.match(/\bN([1-5])\b/i);
  if (level && value.length < 120) context.level = `N${level[1]}`;
  if (/^(?:\[.+\]|【.+】|문제\s*\d+|\d{4}년|=+.*=+)$/u.test(value) && value.length < 100) {
    context.section = value.replace(/^=+|=+$/g, '').trim();
    return true;
  }
  return false;
}

function isJapaneseOnlyCandidate(line) {
  const value = cleanTerm(line);
  if (!validTerm(value) || hasKorean(value) || value.length > 60) return false;
  if (/[。！？]$/.test(value)) return false;
  if (/^(?:N[1-5]|JLPT|問題|문제|기본|어휘|명사|동사|부사|형용사)/i.test(value)) return false;
  if (/^[\[【（(].+[\]】）)]$/.test(value)) return false;
  return !/[=:{}<>]/.test(value);
}

function parsePlainText(source) {
  const records = [];
  const lines = source.content.split('\n');
  const session = catalog.sessions.find((item) => `session-${String(item.index).padStart(3, '0')}` === source.collectionId);
  const defaultLevel = session?.index === 7 ? 'N2'
    : (/\bN1\b/i.test(source.content.slice(0, 500)) || session?.category === 'JLPT 시험 어휘' ? 'N1' : null);
  const context = { year: null, level: defaultLevel, section: null };

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index].replace(/^\s*\d+\t/, '');
    const line = normalizeText(raw);
    if (!line || headerState(line, context)) continue;
    const record = parseSingleLine(line, context, index + 1);
    if (record) {
      records.push(record);
      continue;
    }
    if (/[。！？]$/.test(line) && records.length) {
      let nextIndex = index + 1;
      while (nextIndex < lines.length && !normalizeText(lines[nextIndex].replace(/^\s*\d+\t/, ''))) nextIndex += 1;
      const translation = normalizeText((lines[nextIndex] ?? '').replace(/^\s*\d+\t/, ''));
      if (translation && hasKorean(translation)) {
        records.at(-1).examples.push({ ja: line, ko: translation });
        index = nextIndex;
      }
      continue;
    }
    if (isJapaneseOnlyCandidate(line)) {
      const next = normalizeText(lines[index + 1] ?? '');
      if (next && hasKorean(next) && !hasJapanese(next.replace(/[가-힣]/g, ''))) {
        const paired = makeRecord(line, next, context, { line: index + 1 });
        if (paired) records.push(paired);
        index += 1;
      } else {
        const incomplete = makeRecord(line, null, context, { line: index + 1 });
        if (incomplete) records.push(incomplete);
      }
      continue;
    }
    if (hasJapanese(line) && hasKorean(line) && unparsed.length < 1000) {
      unparsed.push({ collectionId: source.collectionId, sourceFile: source.sourceFile, line: index + 1, text: line.slice(0, 300) });
    }
  }
  return records;
}

function recordsFromJsonArray(source, words) {
  return words.map((word, index) => {
    const term = word.jp ?? word.term ?? word.word;
    const meaning = word.kr ?? word.meaning ?? word.ko;
    if (!term) return null;
    const record = makeRecord(term, meaning, {}, {
      reading: word.rd ?? word.reading ?? '',
      nuance: word.nuance ?? word.context ?? null,
      level: word.jlpt ?? word.level ?? null,
      partOfSpeech: word.pos ?? word.partOfSpeech ?? null,
      line: index + 1,
    });
    if (record && (word.exJa || word.exampleJa || word.example)) {
      record.examples.push({ ja: word.exJa ?? word.exampleJa ?? word.example, ko: word.exKr ?? word.exampleKo ?? null });
    }
    return record;
  }).filter(Boolean);
}

const parsedSources = [];
const inputRecords = [];
for (const source of candidates) {
  let records;
  if (source.sourceType === 'html-artifact') {
    const words = JSON.parse(source.content);
    records = recordsFromJsonArray(source, words);
  } else {
    const embeddedArrays = extractJsonWordArrays(source.content);
    records = embeddedArrays.length
      ? embeddedArrays.flatMap((words) => recordsFromJsonArray(source, words))
      : parsePlainText(source);
  }
  if (!records.length) continue;
  parsedSources.push({ ...source, recordCount: records.length });
  for (const record of records) inputRecords.push({ ...record, source });
}

function normalizedKeyPart(value) {
  return normalizeText(value).toLocaleLowerCase('ja-JP');
}

function buildWordbook(session) {
  const id = `session-${String(session.index).padStart(3, '0')}`;
  const sourceRecords = inputRecords.filter((record) => record.source.collectionId === id);

  // 읽기 보완과 중복 정리는 현재 단어장 안에서만 수행한다.
  const readingsByTerm = new Map();
  for (const record of sourceRecords) {
    if (!record.reading) continue;
    const key = `${normalizedKeyPart(record.term)}\u0000${normalizedKeyPart(record.nuance ?? '')}`;
    if (!readingsByTerm.has(key)) readingsByTerm.set(key, new Set());
    readingsByTerm.get(key).add(normalizedKeyPart(record.reading));
  }
  for (const record of sourceRecords) {
    if (record.reading) continue;
    const key = `${normalizedKeyPart(record.term)}\u0000${normalizedKeyPart(record.nuance ?? '')}`;
    const readings = [...(readingsByTerm.get(key) ?? [])];
    if (readings.length === 1) record.reading = readings[0];
  }

  const groups = new Map();
  for (const record of sourceRecords) {
    const key = [record.term, record.reading ?? '', record.nuance ?? ''].map(normalizedKeyPart).join('\u0000');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  const words = [];
  for (const [key, records] of groups) {
    const first = records[0];
    const meanings = unique(records.map((record) => record.meaning));
    const sources = [];
    const sourceKeys = new Set();
    for (const record of records) {
      const item = {
        collectionId: id,
        sourceType: record.source.sourceType,
        sourceFile: record.source.sourceFile,
        line: record.line,
        year: record.year,
        section: record.section,
      };
      const sourceKey = JSON.stringify(item);
      if (!sourceKeys.has(sourceKey)) {
        sourceKeys.add(sourceKey);
        sources.push(item);
      }
    }
    const reading = first.reading || null;
    const ready = meanings.length > 0 && (reading || !HAN.test(first.term));
    words.push({
      id: stableId(key),
      term: first.term,
      reading,
      meanings,
      primaryMeaning: meanings[0] ?? null,
      nuance: first.nuance || null,
      partOfSpeech: unique(records.flatMap((record) => record.partOfSpeech)).sort(),
      jlptLevels: unique(records.map((record) => record.level).filter((level) => /^N[1-5]$/.test(level ?? ''))).sort(),
      years: unique(records.map((record) => record.year).filter(Number.isInteger)).sort((a, b) => a - b),
      categories: unique([session.category]),
      collectionIds: [id],
      relatedTerms: unique(records.flatMap((record) => record.relatedTerms)).sort(collator.compare),
      examples: unique(records.flatMap((record) => record.examples).map(JSON.stringify)).map(JSON.parse),
      sources,
      status: ready ? 'ready' : 'needs-review',
    });
  }

  const sourceFiles = parsedSources
    .filter((source) => source.collectionId === id)
    .map((source) => ({
      type: source.sourceType,
      path: source.sourceFile,
      label: source.label,
      sha256: source.contentHash,
      recordCount: source.recordCount,
    }));

  const dataFile = `wordbooks/${id}.json`;
  const csvFile = `wordbooks/${id}.csv`;
  const document = {
    schemaVersion: '1.0.0',
    generatedAt: catalog.generatedAt ?? new Date().toISOString(),
    id,
    title: session.name,
    category: session.category,
    createdAt: session.createdAt,
    sourceSession: session.folder,
    sourceFiles,
    sourceRecordCount: sourceRecords.length,
    total: words.length,
    words,
  };
  return {
    index: {
      id,
      title: session.name,
      category: session.category,
      createdAt: session.createdAt,
      dataFile,
      csvFile,
      wordCount: words.length,
      sourceRecordCount: sourceRecords.length,
    },
    document,
  };
}

const wordbooks = catalog.sessions.map(buildWordbook).filter((wordbook) => wordbook.document.total > 0);
const collections = wordbooks.map((wordbook) => wordbook.index);
const allWordEntries = wordbooks.flatMap((wordbook) => wordbook.document.words);
const readyCount = allWordEntries.filter((word) => word.status === 'ready').length;
const reviewItems = wordbooks.flatMap((wordbook) => wordbook.document.words
  .filter((word) => word.status === 'needs-review')
  .map((word) => ({
    id: word.id,
    collectionId: wordbook.document.id,
    term: word.term,
    reading: word.reading,
    primaryMeaning: word.primaryMeaning,
    issues: [
      ...(word.meanings.length ? [] : ['missing-meaning']),
      ...(!word.reading && HAN.test(word.term) ? ['missing-reading'] : []),
    ],
  })));

const generatedAt = catalog.generatedAt ?? new Date().toISOString();
const collectionsDocument = { schemaVersion: '1.0.0', generatedAt, total: collections.length, collections };
const stats = {
  schemaVersion: '1.0.0',
  generatedAt,
  sourceSessions: collections.length,
  sourceFiles: parsedSources.length,
  recoveredRecords: inputRecords.length,
  wordbookFiles: wordbooks.length,
  wordEntries: allWordEntries.length,
  uniqueAcrossWordbooks: new Set(allWordEntries.map((word) => word.id)).size,
  readyEntries: readyCount,
  needsReviewEntries: allWordEntries.length - readyCount,
  deduplicatedWithinWordbooks: inputRecords.length - allWordEntries.length,
  unparsedCandidateLines: unparsed.length,
  byCategory: Object.fromEntries([...new Set(collections.map((item) => item.category))].sort().map((category) => [
    category,
    collections.filter((item) => item.category === category).reduce((sum, item) => sum + item.wordCount, 0),
  ])),
  byJlptLevel: Object.fromEntries(['N1', 'N2', 'N3', 'N4', 'N5'].map((level) => [level, allWordEntries.filter((word) => word.jlptLevels.includes(level)).length])),
};
const review = {
  schemaVersion: '1.0.0',
  generatedAt,
  total: reviewItems.length,
  items: reviewItems,
  unparsedLines: unparsed,
};

const categoryRows = Object.entries(stats.byCategory).map(([category, count]) => `| ${category} | ${count.toLocaleString('ko-KR')} |`).join('\n');
const collectionRows = collections.map((collection) => `| ${collection.id} | ${collection.title.replace(/\|/g, '\\|')} | ${collection.category} | ${collection.wordCount.toLocaleString('ko-KR')} | ${collection.sourceRecordCount.toLocaleString('ko-KR')} | \`${collection.dataFile}\` |`).join('\n');
const importReport = `# 가져오기 보고서

생성 시각: ${generatedAt}

## 요약

| 항목 | 수량 |
|---|---:|
| 원본 세션 | ${catalog.sessions.length.toLocaleString('ko-KR')} |
| 단어가 회수된 세션 | ${collections.length.toLocaleString('ko-KR')} |
| 사용한 소스 파일 | ${parsedSources.length.toLocaleString('ko-KR')} |
| 회수 레코드 | ${inputRecords.length.toLocaleString('ko-KR')} |
| 단어장별 단어 항목 | ${allWordEntries.length.toLocaleString('ko-KR')} |
| 단어장 사이 중복 제외 고유 표현 | ${stats.uniqueAcrossWordbooks.toLocaleString('ko-KR')} |
| 바로 사용 가능 | ${readyCount.toLocaleString('ko-KR')} |
| 검수 필요 | ${(allWordEntries.length - readyCount).toLocaleString('ko-KR')} |
| 단어장 내부에서 정리한 중복 | ${stats.deduplicatedWithinWordbooks.toLocaleString('ko-KR')} |
| 미해석 후보 줄 | ${unparsed.length.toLocaleString('ko-KR')} |

원래 단어장 하나당 JSON·CSV 파일을 하나씩 생성합니다. 서로 다른 단어장에 같은 표현이 있어도 합치지 않으며, 각 파일에는 해당 단어장의 뜻과 출처만 들어 있습니다. 읽기와 뜻이 모두 확보된 항목만 \`ready\`입니다. 한자가 포함됐지만 읽기가 없거나, 일본어 표제어만 회수된 항목은 \`needs-review\`에 남겼습니다.

## 분류별 단어 항목

| 분류 | 단어 수 |
|---|---:|
${categoryRows}

## 컬렉션

| ID | 제목 | 분류 | 단어 | 회수 레코드 | 파일 |
|---|---|---|---:|---:|---|
${collectionRows}

## 공개 전 주의

교재, 강의, 신문 사설, 시험 자료에서 정리된 항목이 섞여 있습니다. 공개 GitHub 저장소에 올리기 전 각 원자료의 이용 조건을 확인하세요. 원본 Claude 대화와 계정 정보는 이 폴더에 포함하지 않았습니다.
`;

function csvCell(value) {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return `"${text.replace(/\r?\n/g, ' ').replace(/"/g, '""')}"`;
}

const csvHeader = ['id', 'term', 'reading', 'primaryMeaning', 'meanings', 'nuance', 'partOfSpeech', 'jlptLevels', 'years', 'categories', 'collectionIds', 'status'];
function csvFor(words) {
  return [csvHeader.map(csvCell).join(','), ...words.map((word) => csvHeader.map((field) => csvCell(word[field])).join(','))].join('\n') + '\n';
}

await mkdir(dataDir, { recursive: true });
const wordbooksDir = path.join(dataDir, 'wordbooks');
await rm(wordbooksDir, { recursive: true, force: true });
await mkdir(wordbooksDir, { recursive: true });
await Promise.all([
  rm(path.join(dataDir, 'words.json'), { force: true }),
  rm(path.join(dataDir, 'words.csv'), { force: true }),
]);
await Promise.all([
  ...wordbooks.flatMap((wordbook) => [
    writeFile(path.join(dataDir, wordbook.index.dataFile), `${JSON.stringify(wordbook.document, null, 2)}\n`),
    writeFile(path.join(dataDir, wordbook.index.csvFile), csvFor(wordbook.document.words)),
  ]),
  writeFile(path.join(dataDir, 'collections.json'), `${JSON.stringify(collectionsDocument, null, 2)}\n`),
  writeFile(path.join(dataDir, 'stats.json'), `${JSON.stringify(stats, null, 2)}\n`),
  writeFile(path.join(dataDir, 'review.json'), `${JSON.stringify(review, null, 2)}\n`),
  writeFile(path.join(repoRoot, 'docs', 'IMPORT_REPORT.md'), importReport),
]);

console.log(`소스 ${parsedSources.length}개에서 ${inputRecords.length}개 레코드를 회수했습니다.`);
console.log(`단어장 ${wordbooks.length}개 파일로 ${allWordEntries.length}개 항목을 분리했습니다.`);
console.log(`ready ${readyCount}개, needs-review ${allWordEntries.length - readyCount}개, 추가 검토 후보 줄 ${unparsed.length}개`);
