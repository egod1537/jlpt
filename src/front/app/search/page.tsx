import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeading } from "@/components/layout/page-heading";
import { SearchPage } from "@/components/search/search-page";
import { LoadingState } from "@/components/data-state";

export const metadata: Metadata = { title: "전체 검색" };
export default function GlobalSearchPage() { return <><PageHeading eyebrow="5천여 고유 표현" title="전체 검색" description="모든 원본 단어장을 검색합니다. 같은 단어 ID는 하나로 묶고, 단어장마다 다른 뜻과 상태는 그대로 보여 줍니다." /><Suspense fallback={<LoadingState />}><SearchPage /></Suspense></>; }
