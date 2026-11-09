import type { Metadata } from "next";
import { getDatabase } from "@back/lib/db/database";
import { listGrammarBooks } from "@back/lib/grammar/repository";
import { GrammarPage } from "@/components/grammar/grammar-page";
import { ensureGrammarSeeded } from "@/lib/server/grammar-seed";

export const metadata: Metadata = { title: "문법" };

export default function GrammarRoute() {
  const db = getDatabase();
  ensureGrammarSeeded(db);
  return <GrammarPage books={listGrammarBooks(db, { limit: 500 }).books} />;
}
