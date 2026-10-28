"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { BookPlus, FileUp, FolderPlus } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSync } from "@/components/sync/sync-provider";

type Folder = { id: string; name: string };
type Mode = "folder" | "book" | "import";
type ImportPreview = {
  previewId: string; detectedFormat: "csv" | "json"; suggestedTitle: string; totalRows: number; validRows: number; invalidRows: number;
  columns: string[]; mapping: Record<string, string>; sample: Array<{ term: string; reading: string | null; meanings: string[] }>;
  warnings: Array<{ row: number; field: string; message: string }>;
  duplicates: { withinCount: number; existingCount: number; withinUpload: Array<{ index: number; term: string }>; existingDatabase: Array<{ index: number; term: string }> };
};
const mappingFields = [["term", "표제어 (필수)"], ["reading", "읽기"], ["meanings", "뜻"], ["primaryMeaning", "대표 뜻"], ["nuance", "뉘앙스"], ["partOfSpeech", "품사"], ["jlptLevels", "JLPT"], ["years", "연도"], ["categories", "분류"], ["relatedTerms", "관련어"], ["examples", "예문 JSON"], ["exampleJa", "일본어 예문"], ["exampleKo", "한국어 예문"], ["sources", "출처 JSON"], ["tags", "태그"], ["status", "상태"]] as const;

export function AddContentDialog({ children }: { children: ReactNode }) {
  const { queue } = useSync();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("folder");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importedBookId, setImportedBookId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  useEffect(() => { if (open) void fetch("/api/folders", { cache: "no-store" }).then((response) => response.ok ? response.json() : { folders: [] }).then((body) => setFolders(body.folders)); }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    if (mode === "folder") {
      await queue({ type: "folder.create", payload: { id: `folder-${crypto.randomUUID()}`, name: form.get("name"), parentId: form.get("folderId") || null, orderIndex: 0 } });
      setMessage("폴더를 저장했습니다. 오프라인이면 연결 후 동기화됩니다.");
      return;
    }
    if (mode === "book") {
      await queue({ type: "book.create", payload: { id: `book-${crypto.randomUUID()}`, title: form.get("title"), category: form.get("category") || null, folderId: form.get("folderId") || null, orderIndex: 0 } });
      setMessage("세트를 저장했습니다. 오프라인이면 연결 후 동기화됩니다.");
      return;
    }
    if (!file) { setMessage("파일을 선택해 주세요."); return; }
    try {
      if (!preview) {
        const upload = new FormData(); upload.set("file", file);
        const response = await fetch("/api/imports/preview", { method: "POST", body: upload });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || "미리보기에 실패했습니다.");
        setPreview(body); setMapping(body.mapping || {}); setMessage(`정상 ${body.validRows}행, 오류 ${body.invalidRows}행을 확인했습니다.`);
      } else {
        const response = await fetch(`/api/imports/${preview.previewId}/commit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title") || preview.suggestedTitle, category: form.get("category") || null, folderId: form.get("folderId") || null, mapping, validRowsOnly: form.get("validRowsOnly") === "on", duplicatePolicy: "keep-separate" }) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || "가져오기에 실패했습니다.");
        setImportedBookId(body.bookId); setMessage(`${body.insertedEntries}개 단어를 가져왔습니다.`); window.dispatchEvent(new CustomEvent("jlpt-data-changed"));
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "가져오기에 실패했습니다."); }
  }

  return <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) { setPreview(null); setMapping({}); setFile(null); setImportedBookId(""); setMessage(""); } }}>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent className="sm:max-w-lg">
      <DialogTitle className="pr-10 text-xl font-black">새로 추가</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-app-muted">폴더와 세트를 만들거나 파일에서 가져옵니다.</DialogDescription>
      <div className="mt-5 grid grid-cols-3 gap-2" role="tablist">
        {([ ["folder", FolderPlus, "폴더"], ["book", BookPlus, "세트"], ["import", FileUp, "가져오기"] ] as const).map(([value, Icon, label]) => <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => { setMode(value); setPreview(null); setMessage(""); }} className={`min-h-12 rounded-xl px-2 text-sm font-bold ${mode === value ? "bg-emerald-700 text-white" : "bg-app-raised text-app-muted"}`}><Icon className="mx-auto mb-1 h-4 w-4" />{label}</button>)}
      </div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === "folder" ? <label className="block text-sm font-bold">폴더 이름<Input className="mt-2" name="name" required maxLength={80} /></label> : null}
        {mode === "book" || (mode === "import" && preview) ? <label className="block text-sm font-bold">세트 제목<Input className="mt-2" name="title" required defaultValue={preview?.suggestedTitle} maxLength={160} /></label> : null}
        {mode === "book" || (mode === "import" && preview) ? <label className="block text-sm font-bold">카테고리<Input className="mt-2" name="category" maxLength={100} /></label> : null}
        {mode !== "import" || preview ? <label className="block text-sm font-bold">위치<Select className="mt-2 w-full" name="folderId"><option value="">미분류</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</Select></label> : null}
        {mode === "import" && !preview ? <label className="block text-sm font-bold">CSV 또는 JSON 파일<Input className="mt-2 h-auto py-3" type="file" accept=".csv,.json,text/csv,application/json" required onChange={(event) => setFile(event.target.files?.[0] || null)} /></label> : null}
        {mode === "import" && preview?.detectedFormat === "csv" ? <details open={!mapping.term} className="rounded-xl border border-app-border p-4"><summary className="min-h-11 cursor-pointer py-2 font-bold">CSV 열 매핑</summary><p className="mb-3 text-xs text-app-muted">자동 매핑을 확인하고 필요하면 바꾸세요. 다중 값은 | 또는 ; 로 구분합니다.</p><div className="space-y-3">{mappingFields.map(([field, label]) => <label key={field} className="block text-sm font-bold">{label}<Select className="mt-1 w-full" value={mapping[field] || ""} onChange={(event) => setMapping((current) => ({ ...current, [field]: event.target.value }))}><option value="">사용하지 않음</option>{preview.columns.map((column) => <option key={column} value={column}>{column}</option>)}</Select></label>)}</div></details> : null}
        {mode === "import" && preview ? <div className="rounded-xl bg-app-raised p-4 text-sm"><p className="font-bold">총 {preview.totalRows}행 · 정상 {preview.validRows} · 오류 {preview.invalidRows}</p><p className="mt-1 text-app-muted">업로드 내부 중복 {preview.duplicates.withinCount} · 기존 DB 후보 {preview.duplicates.existingCount}</p>{preview.sample.length ? <div className="mt-3 max-h-32 overflow-auto rounded-lg bg-app-surface p-2"><ul className="divide-y divide-slate-100">{preview.sample.slice(0, 5).map((item, index) => <li key={`${item.term}-${index}`} className="py-2"><span className="jp font-bold">{item.term}</span><span className="ml-2 text-xs text-app-muted">{item.reading || "읽기 없음"} · {item.meanings[0] || "뜻 없음"}</span></li>)}</ul></div> : null}{preview.warnings.length ? <ul className="mt-3 max-h-24 overflow-auto text-xs text-red-800">{preview.warnings.slice(0, 10).map((warning, index) => <li key={`${warning.row}-${index}`}>{warning.row}행: {warning.message}</li>)}</ul> : null}<p className="mt-3 text-xs text-app-muted">중복 후보도 자동 병합하지 않고 별도 항목으로 유지합니다.</p></div> : null}
        {mode === "import" && preview?.invalidRows ? <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="validRowsOnly" className="h-5 w-5" />오류 행을 제외하고 정상 행만 가져오기</label> : null}
        {message ? <p role="status" className="rounded-xl bg-app-raised px-4 py-3 text-sm text-app-muted">{message}</p> : null}
        {importedBookId ? <Button asChild className="w-full"><Link href={`/books/${encodeURIComponent(importedBookId)}`} onClick={() => setOpen(false)}>가져온 세트 열기</Link></Button> : <Button type="submit" className="w-full" disabled={mode === "import" && Boolean(preview) && !mapping.term && preview?.detectedFormat === "csv"}>{mode === "import" ? (preview ? "가져오기 확정" : "파일 검사") : "저장"}</Button>}
      </form>
    </DialogContent>
  </Dialog>;
}
