import type { AppDatabase } from "@back/lib/db/database";
import { getBook, listEntries } from "@back/lib/catalog/queries";

function csvCell(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportBookJson(db: AppDatabase, id: string) {
  const book = getBook(db, id);
  if (!book) return null;
  const entries = listEntries(db, id, -1, 200).entries;
  const remaining = [];
  let cursor = entries.at(-1)?.position ?? -1;
  while (entries.length + remaining.length < (book.entryCount ?? 0)) {
    const page = listEntries(db, id, cursor, 200).entries;
    if (!page.length) break;
    remaining.push(...page);
    cursor = page.at(-1)!.position;
  }
  return { schemaVersion: "jlpt-book-export-v1", exportedAt: new Date().toISOString(), id: book.id, title: book.title, category: book.category, book, words: [...entries, ...remaining] };
}

export function exportBookCsv(db: AppDatabase, id: string) {
  const exported = exportBookJson(db, id);
  if (!exported) return null;
  const columns = ["entryId", "wordId", "position", "term", "reading", "meanings", "primaryMeaning", "nuance", "partOfSpeech", "jlptLevels", "years", "categories", "relatedTerms", "examples", "sources", "status", "tags"] as const;
  const lines = [columns.join(",")];
  for (const entry of exported.words) lines.push(columns.map((column) => csvCell(entry[column] ?? "")).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
