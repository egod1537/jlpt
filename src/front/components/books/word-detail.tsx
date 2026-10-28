import { Badge } from "@/components/ui/badge";
import { DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Word, WordBook } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-5"><h3 className="text-sm font-bold text-slate-500">{title}</h3><div className="mt-2 leading-7 text-slate-800">{children}</div></section>; }

export function WordDetail({ word, book }: { word: Word; book: WordBook }) {
  return <DialogContent aria-describedby={`description-${word.id}`}>
    <div className="pr-10"><div className="flex flex-wrap gap-2">{word.status === "needs-review" && <Badge variant="warning">데이터 검수 필요</Badge>}{word.jlptLevels.map((level) => <Badge key={level}>{level}</Badge>)}</div><DialogTitle className="jp mt-3 text-3xl font-black">{word.term}</DialogTitle>{word.nuance && <p className="mt-2 font-semibold text-emerald-800">문맥: {word.nuance}</p>}<DialogDescription id={`description-${word.id}`} className="jp mt-2 text-base text-slate-600">{word.reading ?? "읽기 미확인"}</DialogDescription></div>
    <Section title="뜻">{word.meanings.length ? <ul className="list-disc space-y-1 pl-5">{word.meanings.map((meaning, index) => <li key={`${meaning}-${index}`}>{meaning}</li>)}</ul> : <p>뜻 미확인</p>}</Section>
    {!!word.partOfSpeech.length && <Section title="품사"><div className="flex flex-wrap gap-2">{word.partOfSpeech.map((item) => <Badge variant="muted" key={item}>{item}</Badge>)}</div></Section>}
    {!!word.relatedTerms.length && <Section title="관련 표현"><p className="jp">{word.relatedTerms.join(" · ")}</p></Section>}
    {!!word.examples.length && <Section title="예문"><div className="space-y-3">{word.examples.map((example, index) => <blockquote key={`${example.ja}-${index}`} className="border-l-2 border-emerald-300 pl-3"><p className="jp">{example.ja}</p>{example.ko && <p className="mt-1 text-sm text-slate-600">{example.ko}</p>}</blockquote>)}</div></Section>}
    {!!word.years.length && <Section title="원자료 연도"><p>{word.years.join(", ")}</p></Section>}
    <Section title="출처 단어장"><p>{book.title} <span className="text-slate-500">({book.id})</span></p>{word.sources.some((source) => source.year || source.section) && <ul className="mt-2 text-sm text-slate-600">{word.sources.map((source, index) => <li key={index}>{source.sourceType}{source.year ? ` · ${source.year}` : ""}{source.section ? ` · ${source.section}` : ""}</li>)}</ul>}</Section>
  </DialogContent>;
}
