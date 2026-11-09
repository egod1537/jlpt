import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GrammarSetPage } from "@/components/grammar/grammar-set-page";
import { grammarSetById } from "@/lib/grammar";

export const metadata: Metadata = { title: "문법 세트" };

export default async function GrammarSetRoute({ params }: PageProps<"/grammar/[id]">) {
  const { id } = await params;
  if (!grammarSetById.has(id)) notFound();
  return <GrammarSetPage setId={id} />;
}
