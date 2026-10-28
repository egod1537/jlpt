import type { Metadata } from "next";
import { LibraryPage } from "@/components/library/library-page";

export const metadata: Metadata = { title: "단어장" };
export default function BooksPage() { return <LibraryPage />; }
