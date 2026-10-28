import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() { return <div className="mx-auto max-w-xl py-24 text-center"><p className="text-sm font-bold text-app-accent">404</p><h1 className="mt-2 text-3xl font-black">페이지를 찾을 수 없습니다</h1><p className="mt-4 text-app-muted">주소가 잘못되었거나 존재하지 않는 단어장입니다.</p><Button asChild className="mt-8"><Link href="/books">단어장 목록으로</Link></Button></div>; }
