import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/data-state";
import { PrivateSearchPage } from "@/components/search/private-search-page";

export const metadata: Metadata = { title: "전체 검색" };
export default function GlobalSearchPage() { return <Suspense fallback={<LoadingState />}><PrivateSearchPage /></Suspense>; }
