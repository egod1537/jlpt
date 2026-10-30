import type { Metadata } from "next";
import { ListeningLibraryPage } from "@/components/listening/listening-library-page";

export const metadata: Metadata = { title: "청해" };

export default function ListeningPage() { return <ListeningLibraryPage />; }
