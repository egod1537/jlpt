import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookDetailPage } from "@/components/library/book-detail-page";
import { getDatabase } from "@back/lib/db/database";
import { getBook } from "@back/lib/catalog/queries";

export const metadata: Metadata = { title: "세트 상세" };
export const dynamic = "force-dynamic";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getBook(getDatabase(), id)) notFound();
  return <BookDetailPage bookId={id} />;
}
