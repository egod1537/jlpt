import type { Metadata } from "next";
import { BookDirectory } from "@/components/books/book-directory";
import { PageHeading } from "@/components/layout/page-heading";

export const metadata: Metadata = { title: "단어장" };
export default function BooksPage() { return <><PageHeading eyebrow="원본 컬렉션" title="단어장" description="모든 원본 단어장을 빠짐없이 표시합니다. 제목이 같아도 세션 ID와 생성일이 다른 단어장은 따로 유지됩니다." /><BookDirectory /></>; }
