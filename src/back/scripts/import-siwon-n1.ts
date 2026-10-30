import { createHash, randomUUID } from "node:crypto";
import { access, chmod, mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase } from "@back/lib/db/database";
import * as repository from "@back/lib/listening/repository";
import * as storage from "@back/lib/listening/storage";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
process.env.JLPT_DB_PATH ||= path.join(repositoryRoot, "var", "jlpt.sqlite");
process.env.JLPT_AUDIO_DIR ||= path.join(repositoryRoot, "var", "listening", "audio");
process.env.JLPT_AUDIO_TMP_DIR ||= path.join(repositoryRoot, "var", "listening", "tmp");
process.env.JLPT_MIGRATIONS_DIR ||= path.join(repositoryRoot, "src", "back", "db", "migrations");

const sourcePage = "https://www.siwonschool.com/books/pattern/?qr=2322";
const sourceBase = "https://www-ndrm.siwonschool.com/qr/japan/250624_n1test";
const audioDirectory = process.env.JLPT_AUDIO_DIR;
const temporaryDirectory = process.env.JLPT_AUDIO_TMP_DIR;
const maximumBytes = Number(process.env.JLPT_MAX_AUDIO_BYTES || 209_715_200);
const variants = ["기본", "배속", "시험장"] as const;

type SourceAudio = {
  number: number;
  setKey: string;
  label: string;
  originalName: string;
  sourceUrl: string;
};

function sourceAudio(number: number): SourceAudio {
  const variant = variants[(number - 1) % variants.length];
  const prefix = String(number).padStart(3, "0");
  if (number <= 15) {
    const problem = Math.floor((number - 1) / 3) + 1;
    const label = `N1_연습문제${problem}_${variant}`;
    return { number, setKey: `practice:${problem}`, label, originalName: `${prefix}_${label}.mp3`, sourceUrl: `${sourceBase}/${number}.mp3` };
  }
  if (number <= 75) {
    const offset = number - 16;
    const test = Math.floor(offset / 12) + 1;
    const part = Math.floor((offset % 12) / 3) + 1;
    const label = `N1_실전테스트${test}-${part}_${variant}`;
    return { number, setKey: `practical:${test}`, label, originalName: `${prefix}_${label}.mp3`, sourceUrl: `${sourceBase}/${number}.mp3` };
  }
  const offset = number - 76;
  const exam = Math.floor(offset / 15) + 1;
  const problem = Math.floor((offset % 15) / 3) + 1;
  const sourceNote = number >= 136 ? "_출판사제목미표기" : "";
  const shortSourceNote = number >= 121 ? "_원본약10초" : "";
  const label = `N1_모의고사${exam}_문제${problem}_${variant}`;
  return {
    number,
    setKey: `mock:${exam}`,
    label,
    originalName: `${prefix}_${label}${sourceNote}${shortSourceNote}.mp3`,
    sourceUrl: `${sourceBase}/${number}.mp3`,
  };
}

function ensureFolder(db: ReturnType<typeof openDatabase>, name: string, parentId: string | null, sortIndex: number) {
  const existing = db.prepare("SELECT id FROM listening_folders WHERE name=? AND parent_id IS ? AND deleted_at IS NULL ORDER BY created_at LIMIT 1")
    .get(name, parentId) as { id: string } | undefined;
  return existing?.id || repository.createListeningFolder(db, { name, parentId, sortIndex }).id;
}

function ensureSet(db: ReturnType<typeof openDatabase>, title: string, folderId: string, sortIndex: number, description: string) {
  const existing = db.prepare("SELECT id FROM listening_sets WHERE title=? AND folder_id=? AND deleted_at IS NULL ORDER BY created_at LIMIT 1")
    .get(title, folderId) as { id: string } | undefined;
  return existing?.id || repository.createListeningSet(db, { title, folderId, sortIndex, description }).id;
}

async function importAudio(db: ReturnType<typeof openDatabase>, setId: string, item: SourceAudio) {
  const existing = db.prepare("SELECT stored_key FROM listening_audio WHERE set_id=? AND original_name=? AND deleted_at IS NULL ORDER BY created_at LIMIT 1")
    .get(setId, item.originalName) as { stored_key: string } | undefined;
  if (existing) {
    await access(path.join(audioDirectory, ...existing.stored_key.split("/")));
    return "skipped" as const;
  }

  const temporaryPath = path.join(temporaryDirectory, `siwon-n1-${String(item.number).padStart(3, "0")}-${randomUUID()}.part`);
  let finalPath = "";
  try {
    const response = await fetch(item.sourceUrl, { redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const declaredBytes = Number(response.headers.get("content-length") || 0);
    if (declaredBytes > maximumBytes) throw new Error(`파일 크기 제한 초과: ${declaredBytes}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > maximumBytes) throw new Error(`올바르지 않은 파일 크기: ${bytes.length}`);
    await writeFile(temporaryPath, bytes, { flag: "wx", mode: 0o600 });

    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const metadata = await storage.probeAudioFile(temporaryPath, "mp3");
    const storedKey = path.posix.join(sha256.slice(0, 2), sha256.slice(2, 4), `siwon-n1-${String(item.number).padStart(3, "0")}-${randomUUID()}.mp3`);
    finalPath = path.join(audioDirectory, ...storedKey.split("/"));
    await mkdir(path.dirname(finalPath), { recursive: true, mode: 0o700 });
    await rename(temporaryPath, finalPath);
    await chmod(finalPath, 0o600);

    try {
      repository.registerListeningAudio(db, {
        setId,
        originalName: item.originalName,
        storedKey,
        mimeType: metadata.mimeType,
        sizeBytes: bytes.length,
        sha256,
        durationMs: metadata.durationMs,
        sampleRate: metadata.sampleRate,
        channels: metadata.channels,
        codecName: metadata.codecName,
      });
    } catch (error) {
      await rm(finalPath, { force: true });
      throw error;
    }
    console.log(JSON.stringify({ event: "imported", number: item.number, name: item.originalName, bytes: bytes.length, durationMs: metadata.durationMs }));
    return "imported" as const;
  } catch (error) {
    await rm(temporaryPath, { force: true });
    if (finalPath) await rm(finalPath, { force: true });
    throw new Error(`${item.number}번 음원 가져오기 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  await Promise.all([
    mkdir(audioDirectory, { recursive: true, mode: 0o700 }),
    mkdir(temporaryDirectory, { recursive: true, mode: 0o700 }),
  ]);

  const db = openDatabase();
  let imported = 0;
  let skipped = 0;
  let totalBytes = 0;
  try {
    const rootFolder = ensureFolder(db, "시원스쿨 진짜 한 권으로 끝내는 JLPT N1", null, 0);
    const practiceFolder = ensureFolder(db, "연습 문제", rootFolder, 0);
    const practicalFolder = ensureFolder(db, "실전 테스트", rootFolder, 1);
    const mockFolder = ensureFolder(db, "모의고사", rootFolder, 2);
    const setIds = new Map<string, string>();
    for (let index = 1; index <= 5; index += 1) {
      setIds.set(`practice:${index}`, ensureSet(db, `연습 문제 ${index}`, practiceFolder, index - 1, `시원스쿨 공식 QR 음원 · 기본/배속/시험장 · ${sourcePage}`));
      setIds.set(`practical:${index}`, ensureSet(db, `실전 테스트 ${index}`, practicalFolder, index - 1, `시원스쿨 공식 QR 음원 · 4개 파트별 기본/배속/시험장 · ${sourcePage}`));
      const note = index === 4
        ? "공식 QR의 121–135번은 현재 각 약 10초 길이입니다."
        : index === 5
          ? "공식 QR의 136–150번은 제목이 비어 있어 연속 번호를 기준으로 분류했으며 현재 각 약 10초 길이입니다."
          : "문제별 기본/배속/시험장";
      setIds.set(`mock:${index}`, ensureSet(db, `모의고사 ${index}`, mockFolder, index - 1, `시원스쿨 공식 QR 음원 · ${note} · ${sourcePage}`));
    }

    for (let number = 1; number <= 150; number += 1) {
      const item = sourceAudio(number);
      const setId = setIds.get(item.setKey);
      if (!setId) throw new Error(`${item.setKey} 세트를 찾을 수 없습니다.`);
      const result = await importAudio(db, setId, item);
      if (result === "imported") imported += 1;
      else skipped += 1;
    }
    const summary = db.prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(size_bytes),0) AS bytes, COALESCE(SUM(duration_ms),0) AS duration_ms
      FROM listening_audio WHERE deleted_at IS NULL AND original_name GLOB '[0-9][0-9][0-9]_N1_*'`).get() as { count: number; bytes: number; duration_ms: number };
    totalBytes = summary.bytes;
    console.log(JSON.stringify({ event: "complete", imported, skipped, registered: summary.count, bytes: summary.bytes, durationMs: summary.duration_ms }));
  } finally {
    db.close();
  }

  if (imported + skipped !== 150 || totalBytes < 1) throw new Error("가져오기 결과가 예상 수량과 일치하지 않습니다.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
