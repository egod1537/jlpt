"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, Download, MoreHorizontal, Plus, Search, Sparkles, Star } from "lucide-react";
import { cachedEntries, clientDatabase } from "@/lib/sync/client-db";
import { fetchAndCacheEntries } from "@/lib/sync/engine";
import { useSync } from "@/components/sync/sync-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Book = { id: string; title: string; category: string | null; folderId: string | null; favorite: boolean; revision: number; entryCount: number; studiedCount: number };
type Entry = {
  entryId: string; bookId: string; wordId: string; position: number; term: string; reading: string | null; meanings: string[]; primaryMeaning: string | null; nuance: string | null;
  partOfSpeech: string[]; jlptLevels: string[]; years: number[]; categories: string[]; relatedTerms: string[]; examples: Array<{ ja: string; ko?: string | null }>;
  sources: Array<Record<string, unknown>>; status: "ready" | "needs-review"; tags: string[]; revision: number;
};
type ReviewState = { wordId: string; dueAt: string | null; lastReviewedAt: string | null; isDue?: boolean };

function reviewMap(states: ReviewState[]) {
  const now = Date.now();
  return Object.fromEntries(states.map((state) => [state.wordId, { ...state, isDue: Boolean(state.dueAt) && Date.parse(state.dueAt as string) <= now }]));
}

export function BookDetailPage({ bookId }: { bookId: string }) {
  const { queue } = useSync();
  const searchParams = useSearchParams();
  const deepLinkWordId = searchParams.get("word");
  const openedDeepLink = useRef(false);
  const [book, setBook] = useState<Book | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Entry | "new" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const bookResponse = await fetch(`/api/books/${encodeURIComponent(bookId)}`, { cache: "no-store" });
      if (!bookResponse.ok) throw new Error("세트를 찾을 수 없습니다.");
      setBook((await bookResponse.json()).book);
      const loadedEntries = await fetchAndCacheEntries(bookId) as unknown as Entry[];
      setEntries(loadedEntries);
      if (!openedDeepLink.current && deepLinkWordId) { const match = loadedEntries.find((entry) => entry.wordId === deepLinkWordId); if (match) { openedDeepLink.current = true; setSelected(match); } }
      const states = await (await clientDatabase()).getAll("reviewStates") as unknown as ReviewState[];
      setReviews(reviewMap(states));
      setError("");
    } catch (loadError) {
      const db = await clientDatabase();
      const cachedBook = await db.get("books", bookId) as unknown as Book | undefined;
      const cached = await cachedEntries(bookId) as unknown as Entry[];
      const states = await db.getAll("reviewStates") as unknown as ReviewState[];
      setReviews(reviewMap(states));
      if (cachedBook) { setBook(cachedBook); setEntries(cached); if (!openedDeepLink.current && deepLinkWordId) { const match = cached.find((entry) => entry.wordId === deepLinkWordId); if (match) { openedDeepLink.current = true; setSelected(match); } } setError("오프라인 캐시를 표시합니다."); }
      else setError(loadError instanceof Error ? loadError.message : "세트를 불러오지 못했습니다.");
    } finally { setLoading(false); }
  }, [bookId, deepLinkWordId]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); const changed = () => void load(); window.addEventListener("jlpt-data-changed", changed); return () => { window.clearTimeout(timer); window.removeEventListener("jlpt-data-changed", changed); }; }, [load]);
  const visible = useMemo(() => {
    const needle = query.normalize("NFKC").toLocaleLowerCase();
    return entries.filter((entry) => {
      const matchesQuery = !needle || `${entry.term} ${entry.reading || ""} ${entry.meanings.join(" ")}`.normalize("NFKC").toLocaleLowerCase().includes(needle);
      const review = reviews[entry.wordId];
      const matchesFilter = filter === "all"
        || (filter === "review" && entry.status === "needs-review")
        || (filter === "unseen" && !review?.lastReviewedAt)
        || (filter === "due" && review?.isDue === true);
      return matchesQuery && matchesFilter;
    });
  }, [entries, filter, query, reviews]);
  async function moveEntry(entry: Entry, offset: number) {
    const nextPosition = Math.max(0, Math.min(entries.length - 1, entry.position + offset));
    if (nextPosition === entry.position) return;
    await queue({ type: "entry.move", targetId: entry.entryId, expectedRevision: entry.revision, payload: { position: nextPosition } });
    setEntries((current) => { const ordered = [...current].sort((a, b) => a.position - b.position).filter((item) => item.entryId !== entry.entryId); ordered.splice(nextPosition, 0, entry); return ordered.map((item, position) => ({ ...item, position })); });
    setSelected(null);
  }
  if (loading) return <div className="space-y-4" aria-label="세트 불러오는 중"><div className="h-24 animate-pulse rounded-2xl bg-app-border" /><div className="h-20 animate-pulse rounded-2xl bg-app-border" /></div>;
  if (!book) return <div className="rounded-2xl border border-red-200 bg-red-950 p-5 text-red-200"><p>{error}</p><Button className="mt-4" onClick={() => void load()}>다시 시도</Button></div>;
  const progress = book.entryCount ? Math.round((book.studiedCount || 0) / book.entryCount * 100) : 0;
  return <div className="mx-auto max-w-3xl">
    <Link href="/books" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-app-muted"><ChevronLeft className="h-4 w-4" />단어장</Link>
    <div className="mt-2 flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap gap-2">{book.category ? <Badge>{book.category}</Badge> : null}<Badge variant="muted">{book.entryCount}단어</Badge><Badge variant="outline">학습 {progress}%</Badge></div><h1 className="mt-3 break-words text-2xl font-black tracking-tight sm:text-3xl">{book.title}</h1></div><button onClick={() => void queue({ type: "book.update", targetId: book.id, expectedRevision: book.revision, payload: { favorite: !book.favorite } })} aria-label={book.favorite ? "즐겨찾기 해제" : "즐겨찾기"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-app-surface text-app-muted ring-1 ring-app-border"><Star className={`h-5 w-5 ${book.favorite ? "fill-amber-400 text-amber-500" : ""}`} /></button></div>
    <div className="mt-5 grid grid-cols-[1fr_auto] gap-2"><Button asChild><Link href={`/study?books=${encodeURIComponent(book.id)}`}><Sparkles className="h-4 w-4" />학습 시작</Link></Button><Button variant="outline" size="icon" onClick={() => setSelected("new")} aria-label="단어 추가"><Plus className="h-5 w-5" /></Button></div>
    <details className="mt-3 rounded-xl bg-app-surface px-4 py-2 ring-1 ring-app-border"><summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold"><MoreHorizontal className="h-4 w-4" />세트 작업</summary><div className="grid grid-cols-2 gap-2 pb-2"><Button asChild variant="outline" size="sm"><a href={`/api/books/${encodeURIComponent(book.id)}/export?format=json`}><Download className="h-4 w-4" />JSON</a></Button><Button asChild variant="outline" size="sm"><a href={`/api/books/${encodeURIComponent(book.id)}/export?format=csv`}><Download className="h-4 w-4" />CSV</a></Button></div></details>
    {error ? <p className="mt-4 rounded-xl bg-amber-950 px-4 py-3 text-sm text-amber-200">{error}</p> : null}
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 mt-6 border-y border-app-border bg-app-raised/95 px-4 py-3 backdrop-blur"><label className="relative block"><span className="sr-only">단어 검색</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-app-muted" /><Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="표제어, 읽기, 뜻 검색" /></label><div className="mt-2 flex gap-2 overflow-x-auto">{[["all","전체"],["unseen","미학습"],["due","복습"],["review","검수 필요"]].map(([value,label]) => <button key={value} onClick={() => setFilter(value)} className={`min-h-11 shrink-0 rounded-full px-3 text-xs font-bold ${filter === value ? "bg-emerald-700 text-white" : "bg-app-surface text-app-muted ring-1 ring-app-border"}`}>{label}</button>)}</div></div>
    <p className="my-4 text-sm text-app-muted">{visible.length}개 표시</p>
    <ol className="space-y-2">{visible.map((entry) => <li key={entry.entryId}><button onClick={() => setSelected(entry)} className="flex min-h-20 w-full items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-surface p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><span className="min-w-0"><span className="jp block truncate text-xl font-bold">{entry.term}</span><span className="jp mt-1 block truncate text-xs text-app-muted">{entry.reading || "읽기 미확인"}</span><span className="mt-1 block truncate text-sm text-app-muted">{entry.primaryMeaning || entry.meanings[0] || "뜻 미확인"}</span></span>{entry.status === "needs-review" ? <Badge variant="warning">검수</Badge> : null}</button></li>)}</ol>
    {!visible.length ? <p className="rounded-2xl border border-dashed border-app-border px-4 py-10 text-center text-sm text-app-muted">조건에 맞는 단어가 없습니다.</p> : null}
    <EntryDialog book={book} entry={selected} close={() => setSelected(null)} onMove={moveEntry} onLocalChange={(entry, remove) => setEntries((current) => remove ? current.filter((item) => item.entryId !== entry.entryId) : current.some((item) => item.entryId === entry.entryId) ? current.map((item) => item.entryId === entry.entryId ? entry : item) : [...current, entry])} />
  </div>;
}

function splitValues(value: FormDataEntryValue | null) { return String(value || "").split(/[\n,]/).map((item) => item.trim()).filter(Boolean); }

function EntryDialog({ book, entry, close, onLocalChange, onMove }: { book: Book; entry: Entry | "new" | null; close: () => void; onLocalChange: (entry: Entry, remove?: boolean) => void; onMove: (entry: Entry, offset: number) => Promise<void> }) {
  const { queue } = useSync(); const editing = entry !== "new" && entry !== null ? entry : null;
  const [formError, setFormError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(""); const form = new FormData(event.currentTarget);
    const term = String(form.get("term")).trim(); const reading = String(form.get("reading") || "").trim() || null;
    const meanings = String(form.get("meanings") || "").split("\n").map((value) => value.trim()).filter(Boolean);
    let sources: Array<Record<string, unknown>>;
    try { sources = JSON.parse(String(form.get("sources") || "[]")); if (!Array.isArray(sources)) throw new Error(); }
    catch { setFormError("출처는 JSON 배열 형식이어야 합니다."); return; }
    const examples = String(form.get("examples") || "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => { const [ja, ...ko] = line.split("|"); return { ja: ja.trim(), ...(ko.length ? { ko: ko.join("|").trim() || null } : {}) }; });
    const fields = { term, reading, meanings, primaryMeaning: String(form.get("primaryMeaning") || "").trim() || meanings[0] || null, nuance: String(form.get("nuance") || "").trim() || null, partOfSpeech: splitValues(form.get("partOfSpeech")), jlptLevels: splitValues(form.get("jlptLevels")), years: splitValues(form.get("years")).map(Number).filter(Number.isFinite), categories: splitValues(form.get("categories")), relatedTerms: splitValues(form.get("relatedTerms")), examples, sources, status: form.get("needsReview") === "on" ? "needs-review" : "ready", tags: splitValues(form.get("tags")) } as Entry;
    if (editing) {
      const identityPolicy = editing.term !== term || editing.reading !== reading ? String(form.get("identityPolicy") || "fork") as "fork" | "same" : "same";
      await queue({ type: "entry.update", targetId: editing.entryId, expectedRevision: editing.revision, payload: { fields, identityPolicy } });
      onLocalChange({ ...editing, ...fields });
    } else {
      const entryId = `entry-${crypto.randomUUID()}`;
      await queue({ type: "entry.create", payload: { entryId, bookId: book.id, position: book.entryCount, fields } });
      onLocalChange({ ...fields, entryId, bookId: book.id, wordId: `pending-${entryId}`, position: book.entryCount, revision: 0 });
    }
    close();
  }
  async function remove() { if (!editing || !confirm("이 단어를 휴지통으로 이동할까요?")) return; await queue({ type: "entry.delete", targetId: editing.entryId, expectedRevision: editing.revision, payload: {} }); onLocalChange(editing, true); close(); }
  return <Dialog open={entry !== null} onOpenChange={(open) => { if (!open) { setFormError(""); close(); } }}><DialogContent className="sm:max-w-lg"><DialogTitle className="pr-10 text-xl font-black">{editing ? "단어 편집" : "단어 추가"}</DialogTitle><DialogDescription className="mt-1 text-sm text-app-muted">현재 세트의 항목만 바뀝니다. 다른 어휘로 고치면 기본적으로 기존 진도와 분리합니다.</DialogDescription>{entry ? <form onSubmit={save} className="mt-5 space-y-4"><label className="block text-sm font-bold">표제어<Input className="jp mt-2" name="term" required defaultValue={editing?.term} maxLength={200} /></label><label className="block text-sm font-bold">읽기<Input className="jp mt-2" name="reading" defaultValue={editing?.reading || ""} maxLength={200} /></label>{editing ? <label className="block text-sm font-bold">표제어·읽기 변경 시<Select className="mt-2 w-full" name="identityPolicy" defaultValue="fork"><option value="fork">새 어휘로 분리 · 기존 진도 분리</option><option value="same">표기만 수정 · 기존 진도 유지</option></Select></label> : null}<label className="block text-sm font-bold">뜻 (한 줄에 하나)<textarea name="meanings" required={editing?.status !== "needs-review"} defaultValue={editing?.meanings.join("\n")} maxLength={20_000} className="mt-2 min-h-28 w-full rounded-xl border border-app-border p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" /></label><label className="block text-sm font-bold">대표 뜻<Input className="mt-2" name="primaryMeaning" defaultValue={editing?.primaryMeaning || ""} maxLength={1_000} /></label><label className="block text-sm font-bold">예문 (일본어 | 한국어, 한 줄에 하나)<textarea name="examples" defaultValue={editing?.examples.map((example) => `${example.ja}${example.ko ? ` | ${example.ko}` : ""}`).join("\n")} maxLength={40_000} className="jp mt-2 min-h-24 w-full rounded-xl border border-app-border p-3" /></label><details className="rounded-xl border border-app-border p-4"><summary className="min-h-11 cursor-pointer py-2 font-bold">고급 필드</summary><div className="mt-3 space-y-4"><label className="block text-sm font-bold">뉘앙스<textarea name="nuance" defaultValue={editing?.nuance || ""} maxLength={4_000} className="mt-2 min-h-20 w-full rounded-xl border border-app-border p-3" /></label><label className="block text-sm font-bold">품사<Input className="mt-2" name="partOfSpeech" defaultValue={editing?.partOfSpeech.join(", ")} placeholder="쉼표로 구분" /></label><label className="block text-sm font-bold">JLPT 등급<Input className="mt-2" name="jlptLevels" defaultValue={editing?.jlptLevels.join(", ")} placeholder="N1, N2" /></label><label className="block text-sm font-bold">연도<Input className="mt-2" name="years" defaultValue={editing?.years.join(", ")} placeholder="2024, 2025" /></label><label className="block text-sm font-bold">분류<Input className="mt-2" name="categories" defaultValue={editing?.categories.join(", ")} /></label><label className="block text-sm font-bold">관련어<Input className="mt-2" name="relatedTerms" defaultValue={editing?.relatedTerms.join(", ")} /></label><label className="block text-sm font-bold">태그<Input className="mt-2" name="tags" defaultValue={editing?.tags.join(", ")} placeholder="쉼표로 구분" /></label><label className="block text-sm font-bold">출처 JSON<textarea name="sources" defaultValue={JSON.stringify(editing?.sources || [], null, 2)} maxLength={40_000} className="mt-2 min-h-28 w-full rounded-xl border border-app-border p-3 font-mono text-xs" /></label></div></details><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="needsReview" defaultChecked={editing?.status === "needs-review"} className="h-5 w-5" />검수 필요로 표시</label>{editing ? <div className="grid grid-cols-2 gap-2"><Button type="button" variant="outline" disabled={editing.position <= 0} onClick={() => void onMove(editing, -1)}><ArrowUp className="h-4 w-4" />위로</Button><Button type="button" variant="outline" disabled={editing.position >= book.entryCount - 1} onClick={() => void onMove(editing, 1)}><ArrowDown className="h-4 w-4" />아래로</Button></div> : null}{formError ? <p role="alert" className="rounded-xl bg-red-950 p-3 text-sm text-red-200">{formError}</p> : null}<div className={`grid gap-3 ${editing ? "grid-cols-2" : ""}`}>{editing ? <Button type="button" variant="destructive" onClick={() => void remove()}>휴지통</Button> : null}<Button type="submit">저장</Button></div></form> : null}</DialogContent></Dialog>;
}
