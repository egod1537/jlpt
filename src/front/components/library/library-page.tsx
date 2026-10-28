"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { BookOpen, CheckSquare, ChevronRight, Folder, FolderInput, MoreHorizontal, Search, Star, Trash2, X } from "lucide-react";
import { clientDatabase } from "@/lib/sync/client-db";
import { useSync } from "@/components/sync/sync-provider";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type FolderItem = { id: string; name: string; parentId: string | null; orderIndex: number; revision: number; bookCount: number; childCount: number };
type BookItem = { id: string; title: string; category: string | null; folderId: string | null; favorite: boolean; orderIndex: number; revision: number; entryCount: number; studiedCount: number; updatedAt: string };
type EditTarget = { kind: "folder"; item: FolderItem } | { kind: "book"; item: BookItem };

export function LibraryPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { queue } = useSync();
  const currentFolderId = params.get("folder");
  const quick = params.get("filter") || "all";
  const sort = params.get("sort") || "updated";
  const initialQuery = params.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);

  const setParams = useCallback((changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    router.push(`/books${next.size ? `?${next}` : ""}`);
  }, [params, router]);

  const load = useCallback(async () => {
    try {
      const bookQuery = new URLSearchParams({ sort, limit: "500" });
      if (currentFolderId) bookQuery.set("folderId", currentFolderId);
      else if (quick === "unfiled") bookQuery.set("folderId", "unfiled");
      if (quick === "favorites") bookQuery.set("favorite", "true");
      if (initialQuery) bookQuery.set("q", initialQuery);
      const [folderResponse, bookResponse] = await Promise.all([fetch("/api/folders", { cache: "no-store" }), fetch(`/api/books?${bookQuery}`, { cache: "no-store" })]);
      if (!folderResponse.ok || !bookResponse.ok) throw new Error();
      setFolders((await folderResponse.json()).folders);
      setBooks((await bookResponse.json()).books);
      setOffline(false);
    } catch {
      const db = await clientDatabase();
      const cachedFolders = await db.getAll("folders") as unknown as FolderItem[];
      let cachedBooks = await db.getAll("books") as unknown as BookItem[];
      if (currentFolderId) cachedBooks = cachedBooks.filter((book) => book.folderId === currentFolderId);
      if (quick === "unfiled") cachedBooks = cachedBooks.filter((book) => book.folderId === null);
      if (quick === "favorites") cachedBooks = cachedBooks.filter((book) => book.favorite);
      if (initialQuery) cachedBooks = cachedBooks.filter((book) => `${book.title} ${book.category || ""} ${book.id}`.normalize("NFKC").toLocaleLowerCase().includes(initialQuery.normalize("NFKC").toLocaleLowerCase()));
      setFolders(cachedFolders); setBooks(cachedBooks); setOffline(true);
    } finally { setLoading(false); }
  }, [currentFolderId, initialQuery, quick, sort]);

  useEffect(() => { const timer = window.setTimeout(() => { setLoading(true); void load(); }, 0); const changed = () => void load(); window.addEventListener("jlpt-data-changed", changed); return () => { window.clearTimeout(timer); window.removeEventListener("jlpt-data-changed", changed); }; }, [load]);
  const currentFolder = folders.find((folder) => folder.id === currentFolderId);
  const normalizedQuery = initialQuery.normalize("NFKC").toLocaleLowerCase();
  const visibleFolders = folders.filter((folder) => folder.parentId === (currentFolderId || null) && (!normalizedQuery || `${folder.name} ${folder.id}`.normalize("NFKC").toLocaleLowerCase().includes(normalizedQuery)));
  const breadcrumbs = useMemo(() => {
    const result: FolderItem[] = []; let cursor = currentFolder;
    while (cursor) { result.unshift(cursor); cursor = folders.find((folder) => folder.id === cursor?.parentId); }
    return result;
  }, [currentFolder, folders]);

  function search(event: FormEvent) { event.preventDefault(); setParams({ q: query.trim() || null }); }
  async function favorite(book: BookItem) { await queue({ type: "book.update", targetId: book.id, expectedRevision: book.revision, payload: { favorite: !book.favorite } }); }
  function toggleSelected(id: string) { setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }
  async function selectedFavorite(value: boolean) {
    for (const book of books.filter((item) => selected.includes(item.id))) await queue({ type: "book.update", targetId: book.id, expectedRevision: book.revision, payload: { favorite: value } });
    setSelected([]); setSelecting(false);
  }
  async function selectedDelete() {
    if (!selected.length || !confirm(`${selected.length}개 세트를 휴지통으로 이동할까요?`)) return;
    for (const book of books.filter((item) => selected.includes(item.id))) await queue({ type: "book.delete", targetId: book.id, expectedRevision: book.revision, payload: {} });
    setSelected([]); setSelecting(false);
  }
  async function selectedMove(folderId: string | null) {
    const chosen = books.filter((item) => selected.includes(item.id));
    if (!chosen.length) return;
    await queue({ type: "books.bulkMove", payload: { ids: chosen.map((book) => book.id), folderId, expectedRevisions: Object.fromEntries(chosen.map((book) => [book.id, book.revision])) } });
    setMoveOpen(false); setSelected([]); setSelecting(false);
  }

  return <div className="mx-auto max-w-3xl">
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-black tracking-tight">단어장</h1><p className="mt-1 text-sm text-slate-500">{books.length}개 세트{offline ? " · 오프라인 캐시" : ""}</p></div></div>
    <form onSubmit={search} className="relative mt-5"><label htmlFor="library-search" className="sr-only">폴더·세트 검색</label><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" /><Input id="library-search" className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="폴더·세트·단어 검색..." /></form>
    <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="빠른 필터">
      {[["all", "전체"], ["recent", "최근"], ["favorites", "즐겨찾기"], ["unfiled", "미분류"]].map(([value, label]) => <button key={value} onClick={() => setParams({ filter: value === "all" ? null : value, folder: null })} aria-pressed={quick === value} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${quick === value ? "bg-emerald-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>{label}</button>)}
    </div>
    {breadcrumbs.length ? <nav aria-label="폴더 경로" className="mt-5 flex flex-wrap items-center gap-1 text-sm"><button onClick={() => setParams({ folder: null })} className="min-h-11 rounded-lg px-2 font-semibold text-slate-600">전체</button>{breadcrumbs.map((folder) => <span key={folder.id} className="flex items-center"><ChevronRight className="h-4 w-4 text-slate-400" /><button onClick={() => setParams({ folder: folder.id })} className="min-h-11 rounded-lg px-2 font-semibold">{folder.name}</button></span>)}</nav> : null}
    {currentFolder ? <Button asChild className="mt-3 w-full sm:w-auto"><Link href={`/study?folder=${encodeURIComponent(currentFolder.id)}`}><BookOpen className="h-4 w-4" />이 폴더에서 학습</Link></Button> : null}
    {initialQuery ? <p className="mt-3 text-sm text-slate-600">현재 위치의 폴더·세트 결과입니다. <Link href={`/search?q=${encodeURIComponent(initialQuery)}&scope=words`} className="inline-flex min-h-11 items-center font-bold text-emerald-800">단어 결과 보기</Link></p> : null}

    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold text-[#9aa5b6]">폴더 <span className="font-normal">{visibleFolders.length}</span></h2></div>
      {visibleFolders.length ? <div className="divide-y divide-[#2a313d]">{visibleFolders.map((folder) => <div key={folder.id} className="flex min-h-12 items-center gap-2">
        <Link href={`/books?folder=${encodeURIComponent(folder.id)}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-2">
          <Folder className="h-4 w-4 shrink-0 text-[#9aa5b6]" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{folder.name}</span>
          <span className="shrink-0 text-xs text-[#9aa5b6]">{folder.bookCount || 0}</span>
        </Link>
        <button onClick={() => setEdit({ kind: "folder", item: folder })} aria-label={`${folder.name} 메뉴`} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#9aa5b6]"><MoreHorizontal className="h-4 w-4" /></button>
      </div>)}</div> : <p className="py-4 text-sm text-[#9aa5b6]">이 위치에 폴더가 없습니다.</p>}
    </section>

    <section className="mt-8"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-base font-black">세트 <span className="font-normal text-slate-400">{books.length}</span></h2><div className="flex items-center gap-2"><button onClick={() => { setSelecting((value) => !value); setSelected([]); }} className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200">{selecting ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}{selecting ? "취소" : "선택"}</button><Select value={sort} onChange={(event) => setParams({ sort: event.target.value === "updated" ? null : event.target.value })} className="h-11 w-auto text-sm"><option value="updated">최근 수정순</option><option value="name">이름순</option><option value="created">생성순</option><option value="studied">학습순</option><option value="custom">사용자순</option></Select></div></div>
      {loading ? <div className="space-y-3" aria-label="세트 목록 로딩 중">{[1,2,3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}</div> : books.length ? <div className="space-y-3">{books.map((book) => { const progress = book.entryCount ? Math.round((book.studiedCount || 0) / book.entryCount * 100) : 0; const checked = selected.includes(book.id); return <div key={book.id} className={`flex items-center gap-2 rounded-2xl border bg-white p-3 ${checked ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200"}`}>{selecting ? <button onClick={() => toggleSelected(book.id)} role="checkbox" aria-checked={checked} aria-label={`${book.title} 선택`} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${checked ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 text-transparent"}`}><span aria-hidden="true">✓</span></button> : null}<Link href={selecting ? "#" : `/books/${encodeURIComponent(book.id)}`} onClick={(event) => { if (selecting) { event.preventDefault(); toggleSelected(book.id); } }} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><BookOpen className="h-5 w-5" /></span><span className="min-w-0"><span className="block truncate font-bold">{book.title}</span><span className="mt-1 block truncate text-xs text-slate-500">{book.entryCount || 0}단어 · 학습 {progress}%{book.category ? ` · ${book.category}` : ""}</span></span></Link>{!selecting ? <><button onClick={() => void favorite(book)} aria-label={book.favorite ? "즐겨찾기 해제" : "즐겨찾기"} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><Star className={`h-5 w-5 ${book.favorite ? "fill-amber-400 text-amber-500" : ""}`} /></button><button onClick={() => setEdit({ kind: "book", item: book })} aria-label={`${book.title} 메뉴`} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></button></> : null}</div>; })}</div> : <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">조건에 맞는 세트가 없습니다. 상단 + 버튼으로 만들어 보세요.</p>}
    </section>
    {selecting ? <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-xl items-center gap-2 border border-slate-200 bg-white p-3 shadow-xl sm:rounded-2xl"><span className="mr-auto text-sm font-bold">{selected.length}개</span><Button variant="outline" size="icon" aria-label="즐겨찾기 추가" disabled={!selected.length} onClick={() => void selectedFavorite(true)}><Star className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label="즐겨찾기 해제" disabled={!selected.length} onClick={() => void selectedFavorite(false)}><X className="h-4 w-4" /></Button><Button variant="outline" disabled={!selected.length} onClick={() => setMoveOpen(true)}><FolderInput className="h-4 w-4" />이동</Button><Button variant="destructive" size="icon" aria-label="선택 세트 휴지통" disabled={!selected.length} onClick={() => void selectedDelete()}><Trash2 className="h-4 w-4" /></Button></div> : null}
    <EditDialog target={edit} folders={folders} close={() => setEdit(null)} />
    <Dialog open={moveOpen} onOpenChange={setMoveOpen}><DialogContent className="sm:max-w-md"><DialogTitle className="text-xl font-black">{selected.length}개 세트 이동</DialogTitle><DialogDescription className="mt-1 text-sm text-slate-500">이동할 폴더를 선택하세요.</DialogDescription><div className="mt-5 grid gap-2"><Button variant="outline" onClick={() => void selectedMove(null)}>미분류</Button>{folders.map((folder) => <Button key={folder.id} variant="outline" onClick={() => void selectedMove(folder.id)}>{folder.name}</Button>)}</div></DialogContent></Dialog>
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
  return <Dialog open={Boolean(target)} onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="sm:max-w-md"><DialogTitle className="pr-10 text-xl font-black">{target?.kind === "folder" ? "폴더 편집" : "세트 편집"}</DialogTitle><DialogDescription className="mt-1 text-sm text-slate-500">이름과 위치를 변경하거나 휴지통으로 이동합니다.</DialogDescription>{target ? <form onSubmit={save} className="mt-5 space-y-4"><label className="block text-sm font-bold">이름<Input className="mt-2" name={target.kind === "folder" ? "name" : "title"} defaultValue={target.kind === "folder" ? target.item.name : target.item.title} required /></label>{target.kind === "book" ? <label className="block text-sm font-bold">카테고리<Input className="mt-2" name="category" defaultValue={target.item.category || ""} /></label> : null}<label className="block text-sm font-bold">위치<Select className="mt-2 w-full" name="folderId" defaultValue={target.kind === "folder" ? target.item.parentId || "" : target.item.folderId || ""}><option value="">{target.kind === "folder" ? "최상위" : "미분류"}</option>{folders.filter((folder) => folder.id !== target.item.id).map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</Select></label>{target.kind === "folder" ? <label className="block text-sm font-bold">삭제할 때<Select className="mt-2 w-full" value={deletePolicy} onChange={(event) => setDeletePolicy(event.target.value as typeof deletePolicy)}><option value="unfile-books">폴더만 삭제 · 내용은 최상위/미분류로</option><option value="trash-contents">하위 폴더와 세트도 함께 휴지통으로</option></Select></label> : null}<div className="grid grid-cols-2 gap-3"><Button type="button" variant="destructive" onClick={() => void remove()}>휴지통</Button><Button type="submit">변경 저장</Button></div></form> : null}</DialogContent></Dialog>;
}
