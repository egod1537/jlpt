import type { Metadata } from "next";
import { GrammarPage } from "@/components/grammar/grammar-page";

export const metadata: Metadata = { title: "문법" };

export default function GrammarRoute() { return <GrammarPage />; }
