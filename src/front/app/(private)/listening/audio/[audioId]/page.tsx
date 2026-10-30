import type { Metadata } from "next";
import { ListeningPlayerPage } from "@/components/listening/listening-player-page";

export const metadata: Metadata = { title: "청해 플레이어" };

export default async function ListeningAudioPage({ params }: PageProps<"/listening/audio/[audioId]">) {
  const { audioId } = await params;
  return <ListeningPlayerPage audioId={audioId} />;
}
