import "server-only";

import type { AppDatabase } from "@back/lib/db/database";
import { seedGrammarCatalog } from "@back/lib/grammar/repository";
import { grammarPointById, grammarSets } from "@/lib/grammar";

const builtinGrammarVersion = "2026-11-09-grammar-v1";

export function ensureGrammarSeeded(db: AppDatabase) {
  seedGrammarCatalog(db, builtinGrammarVersion, grammarSets.map((set) => ({
    id: set.id,
    title: set.title,
    description: set.description,
    level: set.level,
    type: set.type,
    markdown: set.markdown ?? null,
    sourceFile: set.sourceFile ?? null,
    sortOrder: set.sortOrder ?? 0,
    sourceKind: "builtin" as const,
    notes: set.pointIds.flatMap((pointId, position) => {
      const point = grammarPointById.get(pointId);
      return point ? [{
        id: point.id,
        position,
        pattern: point.pattern,
        reading: point.reading,
        meaning: point.meaning,
        connection: point.connection,
        explanation: point.explanation,
        caution: point.caution ?? null,
        examples: point.examples,
        keywords: point.keywords,
        notesMarkdown: point.notesMarkdown ?? null,
        sourceFile: point.sourceFile ?? null,
      }] : [];
    }),
  })));
}
