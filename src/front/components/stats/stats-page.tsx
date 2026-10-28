"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Select } from "@/components/ui/select";

type Overview = { studiedUnique: number; totalReviewEvents: number; reviewGoodRate: number; cumulativeStudiedUnique: number; masteredUnique: number; masteryRate: number; dueNow: number; streakDays: number; legacyImportedCount: number };
type Daily = { date: string; uniqueWords: number; attempts: number; newWords: number; againCount: number };
type Progress = { folderId?: string; bookId?: string; name?: string; title?: string; uniqueTotal: number; studied: number; mastered: number; progressRate: number };
type Weak = { wordId: string; term: string; reading: string | null; reviewAttempts: number; againCount: number; lapses: number; latestRating: string; bookIds: string[] };
type ScopeFolder = { id: string; name: string };
type ScopeBook = { id: string; title: string };

function kstToday() { return new Date(Date.now() + 9 * 60 * 60 * 1_000).toISOString().slice(0, 10); }
function fromDays(days: number) { const today = new Date(`${kstToday()}T00:00:00+09:00`); return new Date(today.getTime() - (days - 1) * 86_400_000 + 9 * 60 * 60 * 1_000).toISOString().slice(0, 10); }

export function StatsPage() {
  const [days, setDays] = useState(7); const [overview, setOverview] = useState<Overview | null>(null); const [daily, setDaily] = useState<Daily[]>([]);
  const [dailyMetric, setDailyMetric] = useState<"attempts" | "uniqueWords">("attempts");
  const [folders, setFolders] = useState<Progress[]>([]); const [books, setBooks] = useState<Progress[]>([]); const [weak, setWeak] = useState<Weak[]>([]); const [error, setError] = useState("");
  const [scope, setScope] = useState(""); const [scopeFolders, setScopeFolders] = useState<ScopeFolder[]>([]); const [scopeBooks, setScopeBooks] = useState<ScopeBook[]>([]);
  const load = useCallback(async () => {
    const selected = scope.startsWith("folder:") ? `&folderId=${encodeURIComponent(scope.slice(7))}` : scope.startsWith("book:") ? `&bookId=${encodeURIComponent(scope.slice(5))}` : "";
    const query = `from=${fromDays(days)}&to=${kstToday()}${selected}`;
    try {
      const responses = await Promise.all(["overview", "daily", "folders", "books", "weak-words"].map((path) => fetch(`/api/stats/${path}?${query}`, { cache: "no-store" })));
      if (responses.some((response) => !response.ok)) throw new Error("통계를 불러오지 못했습니다.");
      const [overviewValue, dailyValue, folderValue, bookValue, weakValue] = await Promise.all(responses.map((response) => response.json()));
      setOverview(overviewValue); setDaily(dailyValue); setFolders(folderValue); setBooks(bookValue); setWeak(weakValue); setError("");
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "통계를 불러오지 못했습니다."); }
  }, [days, scope]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); const changed = () => void load(); window.addEventListener("jlpt-data-changed", changed); return () => { window.clearTimeout(timer); window.removeEventListener("jlpt-data-changed", changed); }; }, [load]);
  useEffect(() => { const timer = window.setTimeout(() => { void Promise.all([fetch("/api/folders", { cache: "no-store" }), fetch("/api/books?limit=500&sort=name", { cache: "no-store" })]).then(async ([folderResponse, bookResponse]) => { if (folderResponse.ok) setScopeFolders((await folderResponse.json()).folders); if (bookResponse.ok) setScopeBooks((await bookResponse.json()).books); }); }, 0); return () => window.clearTimeout(timer); }, []);
  const maxDaily = Math.max(...daily.map((item) => item[dailyMetric]), 1);
  return <div className="mx-auto max-w-3xl"><h1 className="text-2xl font-black">통계</h1><p className="mt-1 text-sm text-app-muted">실제 평가 이벤트 기준 · Asia/Seoul</p>
    <div className="mt-5 grid grid-cols-4 rounded-xl bg-app-border p-1">{[7,30,90,3650].map((value) => <button key={value} onClick={() => setDays(value)} className={`min-h-11 rounded-lg text-sm font-bold ${days === value ? "bg-app-surface text-app-accent shadow-sm" : "text-app-muted"}`}>{value === 3650 ? "전체" : `${value}일`}</button>)}</div>
    <label className="mt-3 block text-sm font-bold"><span className="sr-only">통계 범위</span><Select value={scope} onChange={(event) => setScope(event.target.value)} className="w-full"><option value="">전체 범위</option>{scopeFolders.length ? <optgroup label="폴더">{scopeFolders.map((folder) => <option key={folder.id} value={`folder:${folder.id}`}>{folder.name}</option>)}</optgroup> : null}{scopeBooks.length ? <optgroup label="세트">{scopeBooks.map((book) => <option key={book.id} value={`book:${book.id}`}>{book.title}</option>)}</optgroup> : null}</Select></label>
    {error ? <div role="alert" className="mt-5 rounded-xl bg-red-950 p-4 text-sm text-red-200">{error}<button onClick={() => void load()} className="ml-3 font-bold underline">다시 시도</button></div> : null}
    <section className="mt-6 grid grid-cols-2 gap-3" aria-label="학습 요약">{[
      ["학습한 단어", overview?.studiedUnique || 0, "기간 내 고유 단어"], ["평가 횟수", overview?.totalReviewEvents || 0, `성공 ${Math.round((overview?.reviewGoodRate || 0) * 100)}%`],
      ["숙련 단어 비율", `${Math.round((overview?.masteryRate || 0) * 100)}%`, `${overview?.masteredUnique || 0}개`], ["복습 대기", overview?.dueNow || 0, `연속 ${overview?.streakDays || 0}일`],
    ].map(([label,value,detail]) => <div key={label} className="rounded-2xl border border-app-border bg-app-surface p-4"><p className="text-xs font-bold text-app-muted">{label}</p><p className="mt-2 text-2xl font-black tabular-nums">{value}</p><p className="mt-1 text-xs text-app-muted">{detail}</p></div>)}</section>
    <section className="mt-7 rounded-2xl border border-app-border bg-app-surface p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-black">일별 평가</h2><div className="flex rounded-lg bg-app-raised p-1" aria-label="일별 차트 지표">{[["attempts","평가"],["uniqueWords","고유 단어"]].map(([value,label]) => <button key={value} type="button" aria-pressed={dailyMetric === value} onClick={() => setDailyMetric(value as typeof dailyMetric)} className={`min-h-11 rounded-md px-3 text-xs font-bold ${dailyMetric === value ? "bg-app-surface text-app-accent shadow-sm" : "text-app-muted"}`}>{label}</button>)}</div></div>{daily.some((item) => item.attempts) ? <><div className="mt-5 grid h-36 items-end gap-[2px]" style={{ gridTemplateColumns: `repeat(${daily.length}, minmax(2px, 1fr))` }}>{daily.map((item) => <div key={item.date} className="group relative h-full" title={`${item.date}: ${item.attempts}회, ${item.uniqueWords}단어`}><div className="absolute inset-x-0 bottom-0 min-h-[2px] rounded-t-sm bg-emerald-600 group-focus-within:bg-emerald-800" style={{ height: `${item[dailyMetric] / maxDaily * 100}%` }} /></div>)}</div><div className="mt-2 flex justify-between text-[10px] text-app-muted"><span>{daily[0]?.date.slice(5)}</span><span>{daily.at(-1)?.date.slice(5)}</span></div><table className="sr-only"><caption>일별 평가 표</caption><thead><tr><th>날짜</th><th>고유 단어</th><th>평가</th><th>다시</th></tr></thead><tbody>{daily.map((item) => <tr key={item.date}><td>{item.date}</td><td>{item.uniqueWords}</td><td>{item.attempts}</td><td>{item.againCount}</td></tr>)}</tbody></table></> : <p className="mt-5 rounded-xl bg-app-raised px-4 py-8 text-center text-sm text-app-muted">이 기간의 평가 기록이 없습니다.<br />이전 로컬 진도의 과거 날짜별 기록은 복원되지 않습니다.</p>}</section>
    <ProgressSection title="폴더별 진도" items={folders.slice(0, 8)} />
    <ProgressSection title="세트별 진도" items={books.slice(0, 10)} />
    <section className="mt-7 rounded-2xl border border-app-border bg-app-surface p-5"><h2 className="font-black">취약 단어</h2><p className="mt-1 text-xs text-app-muted">기간 내 2회 이상 평가한 단어의 다시 비율과 누적 실수 기준</p>{weak.length ? <ul className="mt-4 divide-y divide-slate-100">{weak.map((item) => <li key={item.wordId}><Link href={`/books/${encodeURIComponent(item.bookIds[0])}?word=${encodeURIComponent(item.wordId)}`} className="flex min-h-16 items-center justify-between gap-3 py-2"><span><span className="jp block font-bold">{item.term}</span><span className="jp text-xs text-app-muted">{item.reading || "읽기 미확인"}</span></span><span className="text-right text-xs text-app-muted">다시 {item.againCount}/{item.reviewAttempts}<br />누적 실수 {item.lapses}</span></Link></li>)}</ul> : <p className="mt-4 text-sm text-app-muted">아직 취약 단어를 계산할 평가가 없습니다.</p>}</section>
    <details className="mt-7 rounded-2xl border border-app-border bg-app-surface p-5 text-sm text-app-muted"><summary className="flex min-h-11 cursor-pointer items-center font-black text-app-text">통계 기준</summary><div className="mt-3 space-y-2 leading-6"><p>평가 횟수는 실제 review event 행 수이며, 같은 단어를 두 번 평가하면 2회입니다.</p><p>숙련 단어는 최근 평가가 알겠음/쉬움이고 누적 성공 반복이 3회 이상인 앱 내부 판정입니다. 실제 기억 확률을 뜻하지 않습니다.</p><p>성공 비율은 기간 내 알겠음/쉬움 평가 수를 전체 평가 수로 나눈 값으로 숙련 비율과 다릅니다.</p>{overview?.legacyImportedCount ? <p>이전 진도 {overview.legacyImportedCount}개는 누적·복습 대기에는 포함되지만 과거 일별 그래프에는 포함되지 않습니다.</p> : null}</div></details>
  </div>;
}

function ProgressSection({ title, items }: { title: string; items: Progress[] }) {
  return <section className="mt-7 rounded-2xl border border-app-border bg-app-surface p-5"><h2 className="font-black">{title}</h2>{items.length ? <ul className="mt-4 space-y-4">{items.map((item) => <li key={item.folderId || item.bookId}><div className="flex justify-between gap-3 text-sm"><span className="truncate font-bold">{item.name || item.title}</span><span className="shrink-0 text-right text-app-muted">학습 {item.studied}/{item.uniqueTotal}<br />숙련 {item.mastered}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-app-raised" title={`숙련 ${item.mastered}/${item.uniqueTotal}`}><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.round(item.progressRate * 100)}%` }} /></div></li>)}</ul> : <p className="mt-4 text-sm text-app-muted">표시할 항목이 없습니다.</p>}</section>;
}
