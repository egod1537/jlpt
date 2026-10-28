import type { Metadata } from "next";
import { PageHeading } from "@/components/layout/page-heading";
import { SettingsPage } from "@/components/settings/settings-page";

export const metadata: Metadata = { title: "설정과 백업" };
export default function SettingsRoute() { return <><PageHeading eyebrow="로컬 데이터 관리" title="설정과 백업" description="학습 진도를 내보내고, 검증된 백업으로 교체하거나 이 사이트의 저장값만 초기화할 수 있습니다." /><SettingsPage /></>; }
