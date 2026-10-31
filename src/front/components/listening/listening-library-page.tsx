"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, ChevronDown, ChevronRight, Clock3, FileAudio, Folder, LoaderCircle, MoreVertical, Plus, RotateCcw, Search, Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ListeningFolder = { id: string; parentId: string | null; name: string; sortIndex: number; favorite: boolean; revision: number };
type ListeningSet = { id: string; folderId: string | null; title: string; description: string; favorite: boolean; revision: number; audioCount: number; durationMs: number; lastPlayedAt: string | null };
type ListeningAudio = { id: string; setId: string; originalName: string; mimeType: string; sizeBytes: number; durationMs: number | null; status: string; scriptVersionId: string | null; favorite: boolean; revision: number; streamUrl: string };
type SetDetail = ListeningSet & { audio: ListeningAudio[] };
type Filter = "all" | "recent" | "favorites" | "unfiled";

const filters: Array<[Filter, string]> = [["all", "전체"], ["recent", "최근"], ["favorites", "즐겨찾기"], ["unfiled", "미분류"]];
const statusLabel: Record<string, string> = { uploaded: "업로드됨", queued: "대기 중", transcribing: "전사 중", transcribed: "전사 완료", correcting: "교정·번역 중", ready: "준비됨", failed: "처리 실패", missing: "파일 누락" };

export function ListeningLibraryPage() {
  const router = useRouter();
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState<Filter>("all");
  const [folders, setFolders] = useState<ListeningFolder[]>([]); const [sets, setSets] = useState<ListeningSet[]>([]);
  const [details, setDetails] = useState<Record<string, SetDetail>>({});
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set()); const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true); const [loadingMore, setLoadingMore] = useState(false); const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null); const [addOpen, setAddOpen] = useState(false); const [menu, setMenu] = useState<string | null>(null);
  const [failedCount, setFailedCount] = useState(0); const [retryingFailed, setRetryingFailed] = useState(false); const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null); const setCountRef = useRef(0);
  useEffect(() => { setCountRef.current = sets.length; }, [sets.length]);

  const loadLibrary = useCallback(async (append = false) => {
    requestRef.current?.abort(); const controller = new AbortController(); requestRef.current = controller;
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params = new URLSearchParams({ filter, limit: "50", offset: append ? String(setCountRef.current) : "0" });
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/listening/sets?${params}`, { cache: "no-store", signal: controller.signal });
      const body = await response.json() as { folders?: ListeningFolder[]; sets?: ListeningSet[]; page?: { hasMore?: boolean }; failedCount?: number; error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message || "청해 목록을 불러오지 못했습니다.");
      setFolders(body.folders || []);
      setSets((current) => append ? uniqueById([...current, ...(body.sets || [])]) : body.sets || []);
      setHasMore(Boolean(body.page?.hasMore));
      if (typeof body.failedCount === "number") setFailedCount(body.failedCount);
      setExpandedFolders((current) => current.size ? current : new Set((body.folders || []).map((folder) => folder.id)));
      setError(null);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "청해 목록을 불러오지 못했습니다.");
    } finally { if (!controller.signal.aborted) { setLoading(false); setLoadingMore(false); } }
  }, [filter, query]);

  useEffect(() => { const timer = setTimeout(() => { setCountRef.current = 0; void loadLibrary(false); }, 220); return () => { clearTimeout(timer); requestRef.current?.abort(); }; }, [loadLibrary]);

  useEffect(() => {
    let stopped = false;
    const refreshFailedCount = async () => {
      try {
        const response = await fetch("/api/listening/jobs/retry-failed", { cache: "no-store" });
        const body = await response.json() as { failedCount?: number };
        if (!stopped && response.ok && typeof body.failedCount === "number") setFailedCount(body.failedCount);
      } catch { /* the library request still reports actionable errors */ }
    };
    void refreshFailedCount();
    const timer = setInterval(() => void refreshFailedCount(), 5_000);
    return () => { stopped = true; clearInterval(timer); };
  }, []);

  const loadSet = useCallback(async (setId: string) => {
    const response = await fetch(`/api/listening/sets/${encodeURIComponent(setId)}`, { cache: "no-store" });
    const body = await response.json() as { set?: SetDetail; error?: { message?: string } };
    if (!response.ok || !body.set) throw new Error(body.error?.message || "세트를 불러오지 못했습니다.");
    setDetails((current) => ({ ...current, [setId]: body.set! })); return body.set;
  }, []);

  useEffect(() => {
    const pending = Object.values(details).filter((detail) => detail.audio.some((audio) => ["queued", "transcribing", "transcribed", "correcting"].includes(audio.status))).map((detail) => detail.id);
    if (!pending.length) return;
    const timer = setInterval(() => pending.forEach((setId) => void loadSet(setId)), 3_000); return () => clearInterval(timer);
  }, [details, loadSet]);

  const toggleSet = async (setId: string) => {
    const opening = !expandedSets.has(setId); setExpandedSets((current) => toggleInSet(current, setId));
    if (opening && !details[setId]) try { await loadSet(setId); } catch (reason) { setError(reason instanceof Error ? reason.message : "세트를 불러오지 못했습니다."); }
  };
  const tree = useMemo(() => buildFolderTree(folders, sets), [folders, sets]);
  const unfiled = sets.filter((set) => set.folderId === null || !folders.some((folder) => folder.id === set.folderId));

  const mutate = async (url: string, method: "PATCH" | "DELETE", body?: unknown, refreshSetId?: string) => {
    try {
      const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
      if (!response.ok) throw new Error(await responseMessage(response));
      setMenu(null); await loadLibrary(false); if (refreshSetId) await loadSet(refreshSetId);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "변경하지 못했습니다."); }
  };
  const renameFolder = async (folder: ListeningFolder) => { const name = window.prompt("폴더 이름", folder.name); if (name && name.trim() !== folder.name) await mutate(`/api/listening/folders/${folder.id}`, "PATCH", { revision: folder.revision, name }); };
  const moveFolder = async (folder: ListeningFolder) => { const parentId = chooseFolder(folders.filter((item) => item.id !== folder.id), "상위 폴더", folder.parentId); if (parentId !== undefined) await mutate(`/api/listening/folders/${folder.id}`, "PATCH", { revision: folder.revision, parentId }); };
  const deleteFolder = async (folder: ListeningFolder) => { if (window.confirm(`'${folder.name}' 폴더를 삭제할까요? 하위 폴더와 세트는 미분류로 이동합니다.`)) await mutate(`/api/listening/folders/${folder.id}?revision=${folder.revision}`, "DELETE"); };
  const renameSet = async (set: ListeningSet) => { const title = window.prompt("세트 제목", set.title); if (title && title.trim() !== set.title) await mutate(`/api/listening/sets/${set.id}`, "PATCH", { revision: set.revision, title }); };
  const moveSet = async (set: ListeningSet) => { const folderId = chooseFolder(folders, "이동할 폴더", set.folderId); if (folderId !== undefined) await mutate(`/api/listening/sets/${set.id}`, "PATCH", { revision: set.revision, folderId }); };
  const deleteSet = async (set: ListeningSet) => { if (window.confirm(`'${set.title}' 세트와 음원을 삭제할까요?`)) await mutate(`/api/listening/sets/${set.id}?revision=${set.revision}`, "DELETE"); };
  const audioAction = async (action: "favorite" | "rename" | "move" | "delete" | "retry", audio: ListeningAudio) => {
    if (action === "favorite") return mutate(`/api/listening/audio/${audio.id}`, "PATCH", { revision: audio.revision, favorite: !audio.favorite }, audio.setId);
    if (action === "rename") { const originalName = window.prompt("음원 제목", audio.originalName); if (originalName?.trim() && originalName.trim() !== audio.originalName) await mutate(`/api/listening/audio/${audio.id}`, "PATCH", { revision: audio.revision, originalName }, audio.setId); return; }
    if (action === "move") { const setId = chooseSet(sets, audio.setId); if (setId && setId !== audio.setId) { await mutate(`/api/listening/audio/${audio.id}`, "PATCH", { revision: audio.revision, setId }, audio.setId); await loadSet(setId); } return; }
    if (action === "delete") { if (window.confirm(`'${audio.originalName}' 음원을 삭제할까요?`)) await mutate(`/api/listening/audio/${audio.id}?revision=${audio.revision}`, "DELETE", undefined, audio.setId); return; }
    try { const response = await fetch(`/api/listening/audio/${audio.id}/${audio.scriptVersionId ? "reprocess" : "transcribe"}`, { method: "POST", headers: { "Idempotency-Key": `library:${audio.id}:${Date.now()}` } }); if (!response.ok) throw new Error(await responseMessage(response)); setMenu(null); await loadSet(audio.setId); } catch (reason) { setError(reason instanceof Error ? reason.message : "다시 처리하지 못했습니다."); }
  };
  const retryAllFailed = async () => {
    if (!failedCount || retryingFailed || !window.confirm(`처리 실패한 ${failedCount}개 음원을 모두 다시 시도할까요?`)) return;
    setRetryingFailed(true); setBatchMessage(null); setError(null);
    try {
      const response = await fetch("/api/listening/jobs/retry-failed", { method: "POST" });
      const body = await response.json() as { queuedCount?: number; remainingFailedCount?: number; error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message || "실패한 작업을 다시 대기시키지 못했습니다.");
      const queuedCount = Number(body.queuedCount || 0);
      setFailedCount(Number(body.remainingFailedCount || 0));
      setBatchMessage(queuedCount ? `${queuedCount}개 작업을 다시 처리합니다.` : "다시 시도할 실패 작업이 없습니다.");
      await loadLibrary(false);
      await Promise.allSettled(Object.keys(details).map((setId) => loadSet(setId)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "실패한 작업을 다시 대기시키지 못했습니다.");
    } finally { setRetryingFailed(false); }
  };

  return <div className="mx-auto max-w-3xl">
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-black tracking-tight">청해</h1><p className="mt-1 text-sm text-app-muted">{folders.length}개 폴더 · {sets.length}개 세트{hasMore ? "+" : ""}</p></div><Button size="icon" aria-label="청해 추가" onClick={() => setAddOpen(true)}><Plus aria-hidden="true" className="h-5 w-5" /></Button></div>
    <div className="relative mt-5"><label htmlFor="listening-search" className="sr-only">청해 폴더·세트 검색</label><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-app-muted" /><Input id="listening-search" className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="폴더·세트 검색..." /></div>
    <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="청해 빠른 필터">{filters.map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${filter === value ? "bg-app-accent-surface text-app-text" : "bg-app-surface text-app-muted ring-1 ring-app-border"}`}>{label}</button>)}</div>
    <div className={`mt-3 flex min-h-14 items-center justify-between gap-3 rounded-xl border px-3 py-2 ${failedCount ? "border-red-900/70 bg-red-950/30" : "border-app-border bg-app-surface"}`}><div className="min-w-0"><p className={`text-sm font-bold ${failedCount ? "text-red-200" : "text-app-muted"}`}>{failedCount ? `처리 실패 ${failedCount}개` : "처리 실패 없음"}</p>{batchMessage ? <p className="mt-0.5 truncate text-xs text-app-muted" aria-live="polite">{batchMessage}</p> : null}</div><Button type="button" variant="outline" className="min-h-11 shrink-0" disabled={!failedCount || retryingFailed} onClick={() => void retryAllFailed()}>{retryingFailed ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <RotateCcw aria-hidden="true" className="h-4 w-4" />}모두 다시 시도</Button></div>
    <section className="mt-6 rounded-xl border border-app-border bg-app-surface p-2" aria-labelledby="listening-tree-heading">
      <div className="flex items-center justify-between px-2 py-2"><h2 id="listening-tree-heading" className="text-xs font-black uppercase tracking-wider text-app-muted">모든 청해</h2>{loading ? <LoaderCircle aria-label="불러오는 중" className="h-4 w-4 animate-spin text-app-accent" /> : null}</div>
      {error ? <div className="rounded-lg bg-red-950/40 px-3 py-3 text-sm text-red-200">{error}<button className="ml-2 underline" onClick={() => void loadLibrary(false)}>다시 시도</button></div> : null}
      {!loading && !sets.length && !folders.length ? <div className="px-4 py-12 text-center"><AudioLines aria-hidden="true" className="mx-auto h-9 w-9 text-app-muted" /><p className="mt-3 text-sm text-app-muted">아직 저장된 청해가 없습니다.</p><Button className="mt-4" onClick={() => setAddOpen(true)}>첫 음원 추가</Button></div> : null}
      {tree.map((node) => <FolderBranch key={node.folder.id} node={node} depth={0} query={query} details={details} expandedFolders={expandedFolders} expandedSets={expandedSets} menu={menu} onFolderToggle={(id) => setExpandedFolders((current) => toggleInSet(current, id))} onSetToggle={(id) => void toggleSet(id)} onMenu={setMenu} onFolderFavorite={(folder) => void mutate(`/api/listening/folders/${folder.id}`, "PATCH", { revision: folder.revision, favorite: !folder.favorite })} onFolderRename={(folder) => void renameFolder(folder)} onFolderMove={(folder) => void moveFolder(folder)} onFolderDelete={(folder) => void deleteFolder(folder)} onSetFavorite={(set) => void mutate(`/api/listening/sets/${set.id}`, "PATCH", { revision: set.revision, favorite: !set.favorite })} onSetRename={(set) => void renameSet(set)} onSetMove={(set) => void moveSet(set)} onSetDelete={(set) => void deleteSet(set)} onAudioAction={(action, audio) => void audioAction(action, audio)} />)}
      {unfiled.length ? <div className="mt-1 border-t border-app-border pt-1"><div className="flex min-h-11 items-center gap-2 px-2 text-sm font-bold text-app-muted"><Folder aria-hidden="true" className="h-4 w-4" />미분류<span className="ml-auto text-xs">{unfiled.length}</span></div>{unfiled.map((set) => <SetRow key={set.id} set={set} detail={details[set.id]} depth={0} open={expandedSets.has(set.id)} menu={menu} onMenu={setMenu} onToggle={() => void toggleSet(set.id)} onFavorite={() => void mutate(`/api/listening/sets/${set.id}`, "PATCH", { revision: set.revision, favorite: !set.favorite })} onRename={() => void renameSet(set)} onMove={() => void moveSet(set)} onDelete={() => void deleteSet(set)} onAudioAction={(action, audio) => void audioAction(action, audio)} />)}</div> : null}
      {hasMore ? <Button variant="outline" className="mt-2 w-full" disabled={loadingMore} onClick={() => void loadLibrary(true)}>{loadingMore ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}더 보기</Button> : null}
    </section>
    <CreateListeningDialog open={addOpen} onOpenChange={setAddOpen} folders={folders} sets={sets} onCreated={async (setId, audioId) => { await loadLibrary(false); if (audioId) { router.push(`/listening/audio/${audioId}`); return; } if (setId) { setExpandedSets((current) => new Set(current).add(setId)); await loadSet(setId); } }} />
  </div>;
}

type FolderNode = { folder: ListeningFolder; sets: ListeningSet[]; children: FolderNode[] };
type BranchProps = { node: FolderNode; depth: number; query: string; details: Record<string, SetDetail>; expandedFolders: Set<string>; expandedSets: Set<string>; menu: string | null; onFolderToggle: (id: string) => void; onSetToggle: (id: string) => void; onMenu: (id: string | null) => void; onFolderFavorite: (folder: ListeningFolder) => void; onFolderRename: (folder: ListeningFolder) => void; onFolderMove: (folder: ListeningFolder) => void; onFolderDelete: (folder: ListeningFolder) => void; onSetFavorite: (set: ListeningSet) => void; onSetRename: (set: ListeningSet) => void; onSetMove: (set: ListeningSet) => void; onSetDelete: (set: ListeningSet) => void; onAudioAction: (action: AudioAction, audio: ListeningAudio) => void };
function FolderBranch(props: BranchProps) {
  const { node, depth } = props; const open = props.expandedFolders.has(node.folder.id) || Boolean(props.query.trim());
  return <div className="relative" style={{ marginLeft: `${Math.min(depth, 5) * 12}px` }}><div className="flex items-center"><button type="button" onClick={() => props.onFolderToggle(node.folder.id)} aria-expanded={open} className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left hover:bg-app-raised">{open ? <ChevronDown className="h-4 w-4 shrink-0 text-app-muted" /> : <ChevronRight className="h-4 w-4 shrink-0 text-app-muted" />}<Folder className="h-4 w-4 shrink-0 text-app-accent" /><span className="truncate text-sm font-bold">{node.folder.name}</span>{node.folder.favorite ? <Star className="h-3 w-3 fill-app-warning text-app-warning" /> : null}<span className="ml-auto text-[11px] text-app-muted">{node.sets.length + node.children.length}</span></button><button className="h-11 w-11 shrink-0 rounded-lg text-app-muted" aria-label={`${node.folder.name} 메뉴`} onClick={() => props.onMenu(props.menu === `f:${node.folder.id}` ? null : `f:${node.folder.id}`)}><MoreVertical className="mx-auto h-4 w-4" /></button></div>
    {props.menu === `f:${node.folder.id}` ? <RowMenu><button onClick={() => props.onFolderFavorite(node.folder)}>{node.folder.favorite ? "즐겨찾기 해제" : "즐겨찾기"}</button><button onClick={() => props.onFolderRename(node.folder)}>이름 변경</button><button onClick={() => props.onFolderMove(node.folder)}>폴더 이동</button><button onClick={() => props.onFolderDelete(node.folder)}>삭제</button></RowMenu> : null}
    {open ? <>{node.children.map((child) => <FolderBranch key={child.folder.id} {...props} node={child} depth={depth + 1} />)}{node.sets.map((set) => <SetRow key={set.id} set={set} detail={props.details[set.id]} depth={depth} open={props.expandedSets.has(set.id)} menu={props.menu} onMenu={props.onMenu} onToggle={() => props.onSetToggle(set.id)} onFavorite={() => props.onSetFavorite(set)} onRename={() => props.onSetRename(set)} onMove={() => props.onSetMove(set)} onDelete={() => props.onSetDelete(set)} onAudioAction={props.onAudioAction} />)}</> : null}
  </div>;
}

type AudioAction = "favorite" | "rename" | "move" | "delete" | "retry";
function SetRow({ set, detail, depth, open, menu, onMenu, onToggle, onFavorite, onRename, onMove, onDelete, onAudioAction }: { set: ListeningSet; detail?: SetDetail; depth: number; open: boolean; menu: string | null; onMenu: (id: string | null) => void; onToggle: () => void; onFavorite: () => void; onRename: () => void; onMove: () => void; onDelete: () => void; onAudioAction: (action: AudioAction, audio: ListeningAudio) => void }) {
  return <div className="relative ml-4 sm:ml-6" style={{ marginLeft: `${16 + Math.min(depth, 5) * 4}px` }}><div className="flex items-center rounded-lg hover:bg-app-raised"><button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-raised text-app-accent"><AudioLines className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{set.title}</span><span className="mt-1 flex items-center gap-1 text-[11px] text-app-muted">음원 {set.audioCount}개 · <Clock3 className="h-3 w-3" />{formatDuration(set.durationMs)}</span></span>{set.favorite ? <Star className="h-4 w-4 shrink-0 fill-app-warning text-app-warning" /> : null}{open ? <ChevronDown className="h-4 w-4 text-app-muted" /> : <ChevronRight className="h-4 w-4 text-app-muted" />}</button><button type="button" aria-label={`${set.title} 메뉴`} onClick={() => onMenu(menu === `s:${set.id}` ? null : `s:${set.id}`)} className="h-11 w-11 shrink-0 rounded-lg text-app-muted"><MoreVertical className="mx-auto h-4 w-4" /></button></div>
    {menu === `s:${set.id}` ? <RowMenu><button onClick={onFavorite}>{set.favorite ? "즐겨찾기 해제" : "즐겨찾기"}</button><button onClick={onRename}>이름 변경</button><button onClick={onMove}>폴더 이동</button><button onClick={onDelete}>삭제</button></RowMenu> : null}
    {open ? <div className="ml-5 border-l border-app-border pl-2">{!detail ? <p className="py-3 text-xs text-app-muted">음원을 불러오는 중...</p> : detail.audio.length ? detail.audio.map((audio) => <div key={audio.id} className="relative flex items-center rounded-lg hover:bg-app-raised"><Link href={`/listening/audio/${audio.id}`} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-2 py-2"><FileAudio className="h-4 w-4 shrink-0 text-app-accent" /><span className="min-w-0 flex-1"><span className="block truncate text-sm">{audio.originalName}</span><span className={`text-[11px] ${audio.status === "failed" ? "text-red-300" : "text-app-muted"}`}>{statusLabel[audio.status] || audio.status}{audio.durationMs !== null ? ` · ${formatDuration(audio.durationMs)}` : ""}</span></span>{audio.favorite ? <Star className="h-3 w-3 fill-app-warning text-app-warning" /> : null}<ChevronRight className="h-4 w-4 text-app-muted" /></Link><button type="button" className="h-11 w-11 shrink-0 text-app-muted" aria-label={`${audio.originalName} 메뉴`} onClick={() => onMenu(menu === `a:${audio.id}` ? null : `a:${audio.id}`)}><MoreVertical className="mx-auto h-4 w-4" /></button>{menu === `a:${audio.id}` ? <RowMenu><button onClick={() => onAudioAction("favorite", audio)}>{audio.favorite ? "즐겨찾기 해제" : "즐겨찾기"}</button><button onClick={() => onAudioAction("rename", audio)}>이름 변경</button><button onClick={() => onAudioAction("move", audio)}>세트 이동</button><button onClick={() => onAudioAction("retry", audio)}>GPT/Whisper 다시 처리</button><button onClick={() => onAudioAction("delete", audio)}>삭제</button></RowMenu> : null}</div>) : <p className="py-3 text-xs text-app-muted">이 세트에는 아직 음원이 없습니다.</p>}</div> : null}
  </div>;
}

function RowMenu({ children }: { children: React.ReactNode }) { return <div role="dialog" aria-label="항목 메뉴" className="absolute right-2 top-12 z-30 flex min-w-44 flex-col rounded-xl border border-app-border bg-app-raised p-1 shadow-xl [&>button]:min-h-11 [&>button]:rounded-lg [&>button]:px-3 [&>button]:text-left [&>button]:text-sm [&>button]:hover:bg-app-surface">{children}</div>; }

function CreateListeningDialog({ open, onOpenChange, folders, sets, onCreated }: { open: boolean; onOpenChange: (value: boolean) => void; folders: ListeningFolder[]; sets: ListeningSet[]; onCreated: (setId?: string, audioId?: string) => Promise<void> }) {
  const [mode, setMode] = useState<"upload" | "set" | "folder">("upload"); const [name, setName] = useState(""); const [folderId, setFolderId] = useState(""); const [setId, setSetId] = useState("");
  const [files, setFiles] = useState<File[]>([]); const [progress, setProgress] = useState<Record<string, number>>({}); const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false); const uploadRef = useRef<XMLHttpRequest | null>(null);
  const submit = async () => {
    setBusy(true); setMessage(null);
    try {
      if (mode === "folder") { await jsonRequest("/api/listening/folders", "POST", { name, parentId: folderId || null }); setMessage("폴더를 만들었습니다."); setName(""); await onCreated(); return; }
      if (mode === "set") { const body = await jsonRequest<{ set: ListeningSet }>("/api/listening/sets", "POST", { title: name, folderId: folderId || null }); setMessage("세트를 만들었습니다."); setName(""); await onCreated(body.set.id); return; }
      if (!files.length) throw new Error("업로드할 음원을 선택해 주세요.");
      let targetSetId = setId;
      if (!targetSetId) { const body = await jsonRequest<{ set: ListeningSet }>("/api/listening/sets", "POST", { title: name || files[0].name.replace(/\.[^.]+$/, "") || "새 청해", folderId: folderId || null }); targetSetId = body.set.id; }
      else {
        const current = await jsonRequest<{ set: SetDetail }>(`/api/listening/sets/${encodeURIComponent(targetSetId)}`, "GET");
        const duplicates = files.filter((file) => current.set.audio.some((audio) => audio.originalName === file.name && audio.sizeBytes === file.size));
        if (duplicates.length && !window.confirm(`${duplicates.map((file) => file.name).join(", ")} 파일이 이 세트에 이미 있습니다. 그래도 복제할까요?`)) return;
      }
      let firstAudioId: string | undefined;
      for (const file of files) {
        const uploaded = await uploadFile(targetSetId, file, (percent) => setProgress((current) => ({ ...current, [fileKey(file)]: percent })), (request) => { uploadRef.current = request; });
        for (const audio of uploaded.audio) firstAudioId ||= audio.id;
      }
      setMessage(`${files.length}개 음원을 업로드하고 전사를 시작했습니다.`); setFiles([]); setProgress({}); await onCreated(targetSetId, firstAudioId);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "저장하지 못했습니다."); }
    finally { uploadRef.current = null; setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}><DialogContent><DialogTitle className="pr-12 text-xl font-black">청해 추가</DialogTitle><DialogDescription className="mt-1 text-sm text-app-muted">폴더와 세트를 만들거나 음원을 업로드합니다.</DialogDescription>
    <div className="mt-5 grid grid-cols-3 gap-2" role="tablist" aria-label="추가 방식">{(["upload", "set", "folder"] as const).map((value) => <button key={value} role="tab" aria-selected={mode === value} className={`min-h-11 rounded-xl text-sm font-bold ${mode === value ? "bg-app-accent-surface" : "bg-app-raised text-app-muted"}`} onClick={() => setMode(value)}>{value === "upload" ? "음원" : value === "set" ? "세트" : "폴더"}</button>)}</div>
    {mode === "upload" ? <div className="mt-5 space-y-4"><label className="block text-sm font-bold">대상 세트<select className="mt-2 min-h-11 w-full rounded-xl border border-app-border bg-app-bg px-3" value={setId} onChange={(event) => setSetId(event.target.value)}><option value="">새 세트 만들기</option>{sets.map((set) => <option key={set.id} value={set.id}>{set.title}</option>)}</select></label>{!setId ? <><label className="block text-sm font-bold">새 세트 제목<Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="파일 이름을 사용하려면 비워두세요" /></label><FolderSelect folders={folders} value={folderId} onChange={setFolderId} /></> : null}<label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFiles(Array.from(event.dataTransfer.files)); }} className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-app-border bg-app-bg p-4 text-center"><Upload className="h-6 w-6 text-app-accent" /><span className="mt-2 text-sm font-bold">음원을 놓거나 눌러 선택</span><span className="mt-1 text-xs text-app-muted">MP3, M4A, WAV, OGG, WEBM · 최대 200MB</span><input className="sr-only" type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm,.mp3,.m4a,.wav,.ogg,.webm" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} /></label>{files.map((file) => <div key={fileKey(file)} className="rounded-lg bg-app-raised p-3 text-sm"><div className="flex justify-between gap-2"><span className="truncate">{file.name}</span><span>{progress[fileKey(file)] ?? 0}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded bg-app-border"><div className="h-full bg-app-accent" style={{ width: `${progress[fileKey(file)] ?? 0}%` }} /></div></div>)}</div> : <div className="mt-5 space-y-4"><label className="block text-sm font-bold">{mode === "folder" ? "폴더 이름" : "세트 제목"}<Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} /></label><FolderSelect folders={folders} value={folderId} onChange={setFolderId} label={mode === "folder" ? "상위 폴더" : "위치"} /></div>}
    {message ? <p role="status" className={`mt-4 text-sm ${message.includes("못") || message.includes("선택") || message.includes("끊") ? "text-red-300" : "text-app-accent"}`}>{message}</p> : null}<div className="mt-5 flex gap-2">{busy && mode === "upload" ? <Button variant="outline" onClick={() => uploadRef.current?.abort()}>업로드 취소</Button> : null}<Button className="flex-1" disabled={busy || (mode !== "upload" && !name.trim())} onClick={() => void submit()}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}{mode === "upload" ? "업로드" : "저장"}</Button></div>
  </DialogContent></Dialog>;
}

function FolderSelect({ folders, value, onChange, label = "위치" }: { folders: ListeningFolder[]; value: string; onChange: (value: string) => void; label?: string }) { return <label className="block text-sm font-bold">{label}<select className="mt-2 min-h-11 w-full rounded-xl border border-app-border bg-app-bg px-3" value={value} onChange={(event) => onChange(event.target.value)}><option value="">미분류</option>{folderOptions(folders).map(({ folder, depth }) => <option key={folder.id} value={folder.id}>{"　".repeat(depth)}{folder.name}</option>)}</select></label>; }
async function jsonRequest<T = unknown>(url: string, method: string, body?: unknown, extraHeaders: Record<string, string> = {}) { const response = await fetch(url, { method, headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...extraHeaders }, body: body === undefined ? undefined : JSON.stringify(body) }); const payload = response.status === 204 ? null : await response.json().catch(() => null) as T & { error?: { message?: string } }; if (!response.ok) throw new Error(payload?.error?.message || "요청을 처리하지 못했습니다."); return payload as T; }
function uploadFile(setId: string, file: File, onProgress: (percent: number) => void, onRequest: (request: XMLHttpRequest) => void) { return new Promise<{ audio: ListeningAudio[] }>((resolve, reject) => { const form = new FormData(); form.append("file", file); const request = new XMLHttpRequest(); onRequest(request); request.open("POST", `/api/listening/sets/${encodeURIComponent(setId)}/audio`); request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); }; request.onerror = () => reject(new Error("업로드 연결이 끊겼습니다.")); request.onabort = () => reject(new Error("업로드가 취소되었습니다.")); request.onload = () => { let payload: { audio?: ListeningAudio[]; error?: { message?: string } } = {}; try { payload = JSON.parse(request.responseText) as typeof payload; } catch { /* handled below */ } if (request.status >= 200 && request.status < 300 && payload.audio) { onProgress(100); resolve({ audio: payload.audio }); } else reject(new Error(payload.error?.message || "음원을 업로드하지 못했습니다.")); }; request.send(form); }); }

function buildFolderTree(folders: ListeningFolder[], sets: ListeningSet[]) { const children = new Map<string | null, ListeningFolder[]>(); for (const folder of folders) { const parent = folder.parentId && folders.some((item) => item.id === folder.parentId) ? folder.parentId : null; children.set(parent, [...(children.get(parent) || []), folder]); } const build = (folder: ListeningFolder): FolderNode => ({ folder, sets: sets.filter((set) => set.folderId === folder.id), children: (children.get(folder.id) || []).map(build) }); return (children.get(null) || []).map(build); }
function folderOptions(folders: ListeningFolder[]) { const result: Array<{ folder: ListeningFolder; depth: number }> = []; const tree = buildFolderTree(folders, []); const visit = (node: FolderNode, depth: number) => { result.push({ folder: node.folder, depth }); node.children.forEach((child) => visit(child, depth + 1)); }; tree.forEach((node) => visit(node, 0)); return result; }
function chooseFolder(folders: ListeningFolder[], label: string, current: string | null) { const choices = folderOptions(folders); const answer = window.prompt(`${label} 이름을 입력하세요. 비우면 미분류입니다.\n${choices.map(({ folder, depth }) => `${"  ".repeat(depth)}${folder.name}`).join("\n")}`, current ? folders.find((folder) => folder.id === current)?.name || "" : ""); if (answer === null) return undefined; if (!answer.trim()) return null; const match = folders.find((folder) => folder.name === answer.trim()); if (!match) { window.alert("해당 폴더를 찾지 못했습니다."); return undefined; } return match.id; }
function chooseSet(sets: ListeningSet[], current: string) { const answer = window.prompt(`이동할 세트 제목을 입력하세요.\n${sets.map((set) => set.title).join("\n")}`, sets.find((set) => set.id === current)?.title || ""); if (answer === null) return undefined; const match = sets.find((set) => set.title === answer.trim()); if (!match) { window.alert("해당 세트를 찾지 못했습니다."); return undefined; } return match.id; }
function uniqueById<T extends { id: string }>(items: T[]) { return [...new Map(items.map((item) => [item.id, item])).values()]; }
function toggleInSet(current: Set<string>, value: string) { const next = new Set(current); if (next.has(value)) next.delete(value); else next.add(value); return next; }
function formatDuration(milliseconds: number) { const seconds = Math.max(0, Math.round(milliseconds / 1_000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function fileKey(file: File) { return `${file.name}:${file.size}:${file.lastModified}`; }
async function responseMessage(response: Response) { const body = await response.json().catch(() => null) as { error?: { message?: string } } | null; return body?.error?.message || `요청에 실패했습니다 (${response.status}).`; }
