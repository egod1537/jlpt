import { apiError } from "@/lib/server/api";
import { ListeningFailure } from "@back/lib/listening/repository";
import { AudioStorageFailure } from "@back/lib/listening/storage";

export function listeningErrorResponse(error: unknown) {
  if (error instanceof ListeningFailure) return apiError(error.status, error.code, error.message);
  if (error instanceof AudioStorageFailure) {
    const code = error.status === 413 ? "TOO_LARGE" : error.status >= 500 ? "INTERNAL" : "VALIDATION";
    return apiError(error.status, code, error.message);
  }
  if (error instanceof SyntaxError) return apiError(400, "VALIDATION", "JSON 본문이 올바르지 않습니다.");
  return apiError(500, "INTERNAL", "요청을 처리하지 못했습니다.");
}

export function audioDto(audio: {
  id: string; setId: string; originalName: string; mimeType: string; sizeBytes: number; sha256: string;
  durationMs: number | null; sampleRate: number | null; channels: number | null; codecName: string | null;
  status: string; scriptVersionId: string | null; favorite: boolean; lastPlayedAt: string | null;
  revision: number; createdAt: string; updatedAt: string;
}) {
  return {
    id: audio.id,
    setId: audio.setId,
    originalName: audio.originalName,
    mimeType: audio.mimeType,
    sizeBytes: audio.sizeBytes,
    sha256: audio.sha256,
    durationMs: audio.durationMs,
    sampleRate: audio.sampleRate,
    channels: audio.channels,
    codecName: audio.codecName,
    status: audio.status,
    scriptVersionId: audio.scriptVersionId,
    favorite: audio.favorite,
    lastPlayedAt: audio.lastPlayedAt,
    revision: audio.revision,
    createdAt: audio.createdAt,
    updatedAt: audio.updatedAt,
    streamUrl: `/api/listening/audio/${encodeURIComponent(audio.id)}/stream`,
  };
}

