import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookDetail } from "@/components/books/book-detail";
import { getBuildCollections } from "@/lib/server-data";

export const dynamicParams = false;

export async function generateStaticParams() {
  const index = await getBuildCollections();
  return index.collections.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = (await getBuildCollections()).collections.find((entry) => entry.id === id);
  return item ? { title: item.title, description: `${item.title}의 JLPT 어휘 ${item.wordCount}개` } : { title: "단어장을 찾을 수 없음" };
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = await getBuildCollections();
  if (!index.collections.some((item) => item.id === id)) notFound();
  return <BookDetail collectionId={id} />;
}
