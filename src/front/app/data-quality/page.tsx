import type { Metadata } from "next";
import { DataQualityPage } from "@/components/data-quality/data-quality-page";
import { PageHeading } from "@/components/layout/page-heading";

export const metadata: Metadata = { title: "데이터 검수 필요" };
export default function DataQualityRoute() { return <><PageHeading eyebrow="읽기 전용" title="데이터 검수 필요" description="읽기나 뜻을 추가로 확인해야 하는 원본 항목입니다. 확인되지 않은 내용을 임의로 보완하지 않습니다." /><DataQualityPage /></>; }
