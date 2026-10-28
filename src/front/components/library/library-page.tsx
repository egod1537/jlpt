"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { BookOpen, CheckSquare, ChevronDown, ChevronRight, Folder, FolderInput, MoreHorizontal, Pin, Search, Star, Trash2, X } from "lucide-react";
import { clientDatabase } from "@/lib/sync/client-db";
import { useSync } from "@/components/sync/sync-provider";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type FolderItem = { id: string; name: string; parentId: string | null; pinned: boolean; orderIndex: number; revision: number; bookCount: number; childCount: number };
type BookItem = { id: string; title: string; category: string | null; folderId: string | null; favorite: boolean; orderIndex: number; revision: number; entryCount: number; studiedCount: number; updatedAt: string };
type EditTarget = { kind: "folder"; item: FolderItem } | { kind: "book"; item: BookItem };

const expandedStorageKey = "jlpt-library-expanded-v1";

function normalized(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase();
}

export function LibraryPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { queue } = useSync();
  const quick = params.get("filter") || "all";
  const sort = params.get("sort") || "custom";
  const [query, setQuery] = useState(params.get("q") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const loadGeneration = useRef(0);

  const setParams = useCallback((changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.replace("/books" + (next.size ? "?" + next : ""), { scroll: false });
  }, [params, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      sessionStorage.setItem("jlpt-library-query-v1", query.trim());
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async (signal?: AbortSignal) => {
    const generation = ++loadGeneration.current;
    const db = await clientDatabase();
    const [cachedFolders, cachedBooks] = await Promise.all([db.getAll("folders"), db.getAll("books")]);
    if (!signal?.aborted && generation === loadGeneration.current && (cachedFolders.length || cachedBooks.length)) {
      setFolders(cachedFolders as unknown as FolderItem[]);
      setBooks(cachedBooks as unknown as BookItem[]);
      setLoading(false);
    }
    try {
      const [folderResponse, bookResponse] = await Promise.all([
        fetch("/api/folders", { cache: "no-store", signal }),
        fetch("/api/books?sort=custom&limit=500", { cache: "no-store", signal }),
      ]);
      if (!folderResponse.ok || !bookResponse.ok) throw new Error();
      const nextFolders = (await folderResponse.json()).folders as FolderItem[];
      const nextBooks = (await bookResponse.json()).books as BookItem[];
      if (signal?.aborted || generation !== loadGeneration.current) return;
      setFolders(nextFolders);
      setBooks(nextBooks);
      setOffline(false);
      if (!sessionStorage.getItem(expandedStorageKey)) {
        const shallow = new Set(nextFolders.filter((folder) => folder.parentId === null || nextFolders.find((parent) => parent.id === folder.parentId)?.parentId === null).map((folder) => folder.id));
        setExpanded(shallow);
      }
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
      setOffline(true);
    } finally {
      if (!signal?.aborted && generation === loadGeneration.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    try { setExpanded(new Set(JSON.parse(sessionStorage.getItem(expandedStorageKey) || "[]") as string[])); } catch { /* invalid local preference */ }
    const controller = new AbortController();
    void load(controller.signal);
    const changed = (event: Event) => {
      const entities = (event as CustomEvent<{ entities?: string[] }>).detail?.entities || [];
      if (!entities.length || entities.some((entity) => ["bootstrap", "folder", "book"].includes(entity))) void load();
    };
    window.addEventListener("jlpt-data-changed", changed);
    return () => { controller.abort(); window.removeEventListener("jlpt-data-changed", changed); };
  }, [load]);

  const folderById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, FolderItem[]>();
    for (const folder of folders) map.set(folder.parentId, [...(map.get(folder.parentId) || []), folder]);
    for (const children of map.values()) children.sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name));
    return map;
  }, [folders]);
  const booksByFolder = useMemo(() => {
    const map = new Map<string | null, BookItem[]>();
    let source = [...books];
    if (quick === "favorites") source = source.filter((book) => book.favorite);
    if (quick === "unfiled") source = source.filter((book) => book.folderId === null);
    if (quick === "recent") source = source.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 20);
    const compare = sort === "name" ? (a: BookItem, b: BookItem) => a.title.localeCompare(b.title) : sort === "updated" ? (a: BookItem, b: BookItem) => b.updatedAt.localeCompare(a.updatedAt) : (a: BookItem, b: BookItem) => a.orderIndex - b.orderIndex || a.title.localeCompare(b.title);
    for (const book of source) map.set(book.folderId, [...(map.get(book.folderId) || []), book]);
    for (const items of map.values()) items.sort(compare);
    return map;
  }, [books, quick, sort]);

  const needle = normalized(debouncedQuery);
  const matchesBook = useCallback((book: BookItem) => !needle || normalized(book.title + " " + (book.category || "") + " " + book.id).includes(needle), [needle]);
  const folderVisible = useCallback(function visible(folder: FolderItem): boolean {
    if (!needle) return true;
    if (normalized(folder.name + " " + folder.id).includes(needle)) return true;
    if ((booksByFolder.get(folder.id) || []).some(matchesBook)) return true;
    return (childrenByParent.get(folder.id) || []).some(visible);
  }, [booksByFolder, childrenByParent, matchesBook, needle]);

  useEffect(() => {
    if (!needle) return;
    setExpanded((current) => {
      const next = new Set(current);
      for (const folder of folders) if (folderVisible(folder)) {
        let cursor: FolderItem | undefined = folder;
        while (cursor) { next.add(cursor.id); cursor = cursor.parentId ? folderById.get(cursor.parentId) : undefined; }
      }
      return next;
    });
  }, [needle, folders, folderById, folderVisible]);

  function toggleFolder(id: string) {
    performance.mark("library-expand-start");
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      sessionStorage.setItem(expandedStorageKey, JSON.stringify([...next]));
      return next;
    });
    requestAnimationFrame(() => { performance.mark("library-expand-end"); performance.measure("library-expand", "library-expand-start", "library-expand-end"); });
  }
  async function pinFolder(folder: FolderItem) {
    await queue({ type: "folder.pin", targetId: folder.id, expectedRevision: folder.revision, payload: { pinned: !folder.pinned } });
  }
  async function favorite(book: BookItem) {
    await queue({ type: "book.update", targetId: book.id, expectedRevision: book.revision, payload: { favorite: !book.favorite } });
  }
  function toggleSelected(id: string) { setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }
  async function selectedFavorite(value: boolean) {
    for (const book of books.filter((item) => selected.includes(item.id))) await queue({ type: "book.update", targetId: book.id, expectedRevision: book.revision, payload: { favorite: value } });
    setSelected([]); setSelecting(false);
  }
  async function selectedDelete() {
    if (!selected.length || !confirm(String(selected.length) + "개 세트를 휴지통으로 이동할까요?")) return;
    for (const book of books.filter((item) => selected.includes(item.id))) await queue({ type: "book.delete", targetId: book.id, expectedRevision: book.revision, payload: {} });
    setSelected([]); setSelecting(false);
  }
  async function selectedMove(folderId: string | null) {
    const chosen = books.filter((item) => selected.includes(item.id));
    if (!chosen.length) return;
    await queue({ type: "books.bulkMove", payload: { ids: chosen.map((book) => book.id), folderId, expectedRevisions: Object.fromEntries(chosen.map((book) => [book.id, book.revision])) } });
    setMoveOpen(false); setSelected([]); setSelecting(false);
  }

  const renderBook = (book: BookItem, depth: number) => {
    if (!matchesBook(book)) return null;
    const progress = book.entryCount ? Math.round((book.studiedCount || 0) / book.entryCount * 100) : 0;
    const checked = selected.includes(book.id);
    return <div key={book.id} className={"group flex min-h-12 items-center gap-1 rounded-lg border border-transparent pr-1 hover:border-app-border hover:bg-app-raised " + (checked ? "border-app-accent bg-app-accent-surface" : "")} style={{ marginLeft: Math.min(depth, 2) * 16 }}>
      {selecting ? <button onClick={() => toggleSelected(book.id)} role="checkbox" aria-checked={checked} aria-label={book.title + " 선택"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-accent">{checked ? "✓" : "○"}</button> : <span className="flex h-11 w-8 shrink-0 items-center justify-center text-app-accent"><BookOpen className="h-4 w-4" /></span>}
      <Link href={selecting ? "#" : "/study?books=" + encodeURIComponent(book.id) + "&start=1"} onClick={(event) => { if (selecting) { event.preventDefault(); toggleSelected(book.id); } }} className="flex min-h-11 min-w-0 flex-1 items-center py-1.5" aria-label={book.title + " 바로 학습"}>
        <span className="min-w-0"><span className="block truncate text-sm font-semibold">{book.title}</span><span className="block truncate text-[11px] text-app-muted">{book.entryCount || 0}단어 · 학습 {progress}%</span></span>
      </Link>
      {!selecting ? <><button onClick={() => void favorite(book)} aria-label={book.favorite ? "즐겨찾기 해제" : "즐겨찾기"} className="flex h-11 w-11 items-center justify-center rounded-lg text-app-muted hover:bg-app-surface"><Star className={"h-4 w-4 " + (book.favorite ? "fill-app-warning text-app-warning" : "")} /></button><button onClick={() => setEdit({ kind: "book", item: book })} aria-label={book.title + " 메뉴"} className="flex h-11 w-11 items-center justify-center rounded-lg text-app-muted hover:bg-app-surface"><MoreHorizontal className="h-4 w-4" /></button></> : null}
    </div>;
  };

  const renderFolder = (folder: FolderItem, depth: number): React.ReactNode => {
    if (!folderVisible(folder)) return null;
    const open = needle ? true : expanded.has(folder.id);
    const childFolders = childrenByParent.get(folder.id) || [];
    const childBooks = (booksByFolder.get(folder.id) || []).filter(matchesBook);
    const visibleBooks = showAll.has(folder.id) || needle ? childBooks : childBooks.slice(0, 8);
    return <div key={folder.id}>
      <div className="flex min-h-12 items-center gap-1 rounded-lg hover:bg-app-raised" style={{ marginLeft: Math.min(depth, 2) * 16 }}>
        <button onClick={() => toggleFolder(folder.id)} aria-expanded={open} className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-left">
          {open ? <ChevronDown className="h-4 w-4 shrink-0 text-app-muted" /> : <ChevronRight className="h-4 w-4 shrink-0 text-app-muted" />}<Folder className="h-4 w-4 shrink-0 text-app-accent" /><span className="truncate text-sm font-bold">{folder.name}</span><span className="ml-auto text-[11px] text-app-muted">{childBooks.length}</span>
        </button>
        <button onClick={() => void pinFolder(folder)} aria-label={folder.name + (folder.pinned ? " 고정 해제" : " 고정")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-muted hover:bg-app-surface"><Pin className={"h-4 w-4 " + (folder.pinned ? "fill-app-warning text-app-warning" : "")} /></button>
        <button onClick={() => setEdit({ kind: "folder", item: folder })} aria-label={folder.name + " 메뉴"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-muted hover:bg-app-surface"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
      {open ? <div>{childFolders.map((child) => renderFolder(child, depth + 1))}{visibleBooks.map((book) => renderBook(book, depth + 1))}{childBooks.length > visibleBooks.length ? <button onClick={() => setShowAll((current) => new Set(current).add(folder.id))} className="min-h-11 w-full rounded-lg text-xs font-bold text-app-accent">전체 {childBooks.length}개 보기</button> : null}</div> : null}
    </div>;
  };

  const rootBooks = (booksByFolder.get(null) || []).filter(matchesBook);
  const pinnedFolders = folders.filter((folder) => folder.pinned && folderVisible(folder));
  const favoriteBooks = books.filter((book) => book.favorite && matchesBook(book));

  return <div className="mx-auto max-w-3xl">
    <div className="flex items-end justify-between gap-3"><div><h1 className="text-2xl font-black tracking-tight">단어장</h1><p className="mt-1 text-sm text-app-muted">{books.length}개 세트{offline ? " · 오프라인 캐시" : ""}</p></div><button onClick={() => { setSelecting((value) => !value); setSelected([]); }} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-app-border px-3 text-sm font-bold text-app-muted">{selecting ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}{selecting ? "취소" : "선택"}</button></div>
    <div className="relative mt-5"><label htmlFor="library-search" className="sr-only">폴더·세트 검색</label><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-app-muted" /><Input id="library-search" className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="폴더·세트 검색..." /></div>
    <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="빠른 필터">{[["all", "전체"], ["recent", "최근"], ["favorites", "즐겨찾기"], ["unfiled", "미분류"]].map(([value, label]) => <button key={value} onClick={() => setParams({ filter: value === "all" ? null : value })} aria-pressed={quick === value} className={"min-h-11 shrink-0 rounded-full px-4 text-sm font-bold " + (quick === value ? "bg-app-accent-surface text-app-text" : "bg-app-surface text-app-muted ring-1 ring-app-border")}>{label}</button>)}</div>

    {(pinnedFolders.length || favoriteBooks.length) ? <section className="mt-6 rounded-xl border border-app-border bg-app-surface p-2" aria-labelledby="pinned-heading"><h2 id="pinned-heading" className="px-2 py-2 text-xs font-black uppercase tracking-wider text-app-warning">고정</h2>{pinnedFolders.map((folder) => <button key={folder.id} onClick={() => { setExpanded((current) => new Set(current).add(folder.id)); document.getElementById("folder-" + folder.id)?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-app-raised"><Pin className="h-4 w-4 fill-app-warning text-app-warning" /><span className="truncate text-sm font-semibold">{folder.name}</span><span className="ml-auto text-xs text-app-muted">폴더</span></button>)}{favoriteBooks.slice(0, 8).map((book) => <Link key={book.id} href={"/study?books=" + encodeURIComponent(book.id) + "&start=1"} aria-label={book.title + " 바로 학습"} className="flex min-h-11 items-center gap-2 rounded-lg px-2 hover:bg-app-raised"><Star className="h-4 w-4 fill-app-warning text-app-warning" /><span className="truncate text-sm font-semibold">{book.title}</span></Link>)}</section> : null}

    <section className="mt-6 rounded-xl border border-app-border bg-app-surface p-2" aria-labelledby="tree-heading"><div className="flex items-center justify-between px-2 py-2"><h2 id="tree-heading" className="text-xs font-black uppercase tracking-wider text-app-muted">모든 단어장</h2><Select aria-label="단어장 정렬" value={sort} onChange={(event) => setParams({ sort: event.target.value === "custom" ? null : event.target.value })} className="h-11 text-xs"><option value="custom">사용자순</option><option value="updated">최근 수정순</option><option value="name">이름순</option></Select></div>
      {loading ? <div className="space-y-2 p-2" aria-label="단어장 트리 로딩 중">{[1,2,3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-app-border" />)}</div> : <div>{(childrenByParent.get(null) || []).map((folder) => <div id={"folder-" + folder.id} key={folder.id}>{renderFolder(folder, 0)}</div>)}{rootBooks.length ? <div className="mt-1 border-t border-app-border pt-1"><div className="flex min-h-11 items-center gap-2 px-2 text-sm font-bold text-app-muted"><Folder className="h-4 w-4" />미분류 <span className="ml-auto text-xs">{rootBooks.length}</span></div>{rootBooks.slice(0, showAll.has("unfiled") || needle ? rootBooks.length : 8).map((book) => renderBook(book, 1))}{rootBooks.length > 8 && !showAll.has("unfiled") && !needle ? <button onClick={() => setShowAll((current) => new Set(current).add("unfiled"))} className="min-h-11 w-full text-xs font-bold text-app-accent">전체 {rootBooks.length}개 보기</button> : null}</div> : null}{!(childrenByParent.get(null)?.length || rootBooks.length) ? <p className="px-4 py-10 text-center text-sm text-app-muted">조건에 맞는 단어장이 없습니다.</p> : null}</div>}
    </section>

    {selecting ? <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-xl items-center gap-2 border border-app-border bg-app-surface p-3 shadow-xl sm:rounded-2xl"><span className="mr-auto text-sm font-bold">{selected.length}개</span><Button variant="outline" size="icon" aria-label="즐겨찾기 추가" disabled={!selected.length} onClick={() => void selectedFavorite(true)}><Star className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label="즐겨찾기 해제" disabled={!selected.length} onClick={() => void selectedFavorite(false)}><X className="h-4 w-4" /></Button><Button variant="outline" disabled={!selected.length} onClick={() => setMoveOpen(true)}><FolderInput className="h-4 w-4" />이동</Button><Button variant="destructive" size="icon" aria-label="선택 세트 휴지통" disabled={!selected.length} onClick={() => void selectedDelete()}><Trash2 className="h-4 w-4" /></Button></div> : null}
    <EditDialog target={edit} folders={folders} close={() => setEdit(null)} />
    <Dialog open={moveOpen} onOpenChange={setMoveOpen}><DialogContent className="sm:max-w-md"><DialogTitle className="text-xl font-black">{selected.length}개 세트 이동</DialogTitle><DialogDescription className="mt-1 text-sm text-app-muted">이동할 폴더를 선택하세요.</DialogDescription><div className="mt-5 grid gap-2"><Button variant="outline" onClick={() => void selectedMove(null)}>미분류</Button>{folders.map((folder) => <Button key={folder.id} variant="outline" onClick={() => void selectedMove(folder.id)}>{folder.name}</Button>)}</div></DialogContent></Dialog>
  </div>;
}

function EditDialog({ target, folders, close }: { target: EditTarget | null; folders: FolderItem[]; close: () => void }) {
  const { queue } = useSync();
  const [deletePolicy, setDeletePolicy] = useState<"unfile-books" | "trash-contents">("unfile-books");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!target) return;
    const form = new FormData(event.currentTarget);
    if (target.kind === "folder") {
      const name = String(form.get("name")); const parentId = String(form.get("folderId") || "") || null;
      if (name !== target.item.name) await queue({ type: "folder.rename", targetId: target.item.id, expectedRevision: target.item.revision, payload: { name } });
      if (parentId !== target.item.parentId) await queue({ type: "folder.move", targetId: target.item.id, expectedRevision: target.item.revision + (name !== target.item.name ? 1 : 0), payload: { parentId, orderIndex: target.item.orderIndex } });
    } else {
      const title = String(form.get("title")); const category = String(form.get("category") || "") || null; const folderId = String(form.get("folderId") || "") || null;
      if (title !== target.item.title || category !== target.item.category) await queue({ type: "book.update", targetId: target.item.id, expectedRevision: target.item.revision, payload: { title, category } });
      if (folderId !== target.item.folderId) await queue({ type: "book.move", targetId: target.item.id, expectedRevision: target.item.revision + (title !== target.item.title || category !== target.item.category ? 1 : 0), payload: { folderId, orderIndex: target.item.orderIndex } });
    }
    close();
  }
  async function remove() {
    if (!target || !confirm("휴지통으로 이동할까요?")) return;
    await queue({ type: target.kind === "folder" ? "folder.delete" : "book.delete", targetId: target.item.id, expectedRevision: target.item.revision, payload: target.kind === "folder" ? { policy: deletePolicy } : {} }); close();
  }
  return <Dialog open={Boolean(target)} onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="sm:max-w-md"><DialogTitle className="pr-10 text-xl font-black">{target?.kind === "folder" ? "폴더 편집" : "세트 편집"}</DialogTitle><DialogDescription className="mt-1 text-sm text-app-muted">이름과 위치를 변경하거나 휴지통으로 이동합니다.</DialogDescription>{target?.kind === "book" ? <Button asChild variant="outline" className="mt-4 w-full"><Link href={"/books/" + encodeURIComponent(target.item.id)} onClick={close}>단어 목록·편집</Link></Button> : null}{target ? <form onSubmit={save} className="mt-5 space-y-4"><label className="block text-sm font-bold">이름<Input className="mt-2" name={target.kind === "folder" ? "name" : "title"} defaultValue={target.kind === "folder" ? target.item.name : target.item.title} required /></label>{target.kind === "book" ? <label className="block text-sm font-bold">카테고리<Input className="mt-2" name="category" defaultValue={target.item.category || ""} /></label> : null}<label className="block text-sm font-bold">위치<Select className="mt-2 w-full" name="folderId" defaultValue={target.kind === "folder" ? target.item.parentId || "" : target.item.folderId || ""}><option value="">{target.kind === "folder" ? "최상위" : "미분류"}</option>{folders.filter((folder) => folder.id !== target.item.id).map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</Select></label>{target.kind === "folder" ? <label className="block text-sm font-bold">삭제할 때<Select className="mt-2 w-full" value={deletePolicy} onChange={(event) => setDeletePolicy(event.target.value as typeof deletePolicy)}><option value="unfile-books">폴더만 삭제 · 내용은 최상위/미분류로</option><option value="trash-contents">하위 폴더와 세트도 함께 휴지통으로</option></Select></label> : null}<div className="grid grid-cols-2 gap-3"><Button type="button" variant="destructive" onClick={() => void remove()}>휴지통</Button><Button type="submit">변경 저장</Button></div></form> : null}</DialogContent></Dialog>;
}
