import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDatabase } from "@back/lib/db/database";
import { getGrammarBook, GrammarFailure } from "@back/lib/grammar/repository";
import type { GrammarBookDetail } from "@back/lib/grammar/types";
import { GrammarSetPage } from "@/components/grammar/grammar-set-page";
import { ensureGrammarSeeded } from "@/lib/server/grammar-seed";

export const metadata: Metadata = { title: "문법 세트" };

export default async function GrammarSetRoute({ params }: PageProps<"/grammar/[id]">) {
  const { id } = await params;
  const db = getDatabase();
  ensureGrammarSeeded(db);
  let book: GrammarBookDetail;
  try {
    book = getGrammarBook(db, id);
  } catch (error) {
    if (error instanceof GrammarFailure && error.status === 404) notFound();
    throw error;
  }
  return <GrammarSetPage setId={id} book={book} />;
}
