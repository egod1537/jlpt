import type { NextRequest } from "next/server";
import { Readable } from "node:stream";
import { getDatabase } from "@back/lib/db/database";
import { getListeningAudio } from "@back/lib/listening/repository";
import { parseByteRange } from "@back/lib/listening/range";
import { createAudioReadStream, openStoredAudio } from "@back/lib/listening/storage";
import { authorize } from "@/lib/server/authorize";
import { listeningErrorResponse } from "@/lib/server/listening-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/stream">) {
  return streamAudio(request, context, false);
}

export async function HEAD(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/stream">) {
  return streamAudio(request, context, true);
}

async function streamAudio(request: NextRequest, context: RouteContext<"/api/listening/audio/[audioId]/stream">, head: boolean) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response;
  try {
    const { audioId } = await context.params;
    const audio = getListeningAudio(getDatabase(), audioId);
    const file = await openStoredAudio(audio.storedKey);
    const range = parseByteRange(request.headers.get("range"), file.size);
    const commonHeaders = {
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Type": audio.mimeType,
      ETag: `"${audio.sha256}"`,
      "X-Content-Type-Options": "nosniff",
    };
    if (range === "invalid") {
      return new Response(null, { status: 416, headers: { ...commonHeaders, "Content-Range": `bytes */${file.size}` } });
    }
    const headers = range
      ? { ...commonHeaders, "Content-Length": String(range.end - range.start + 1), "Content-Range": `bytes ${range.start}-${range.end}/${file.size}` }
      : { ...commonHeaders, "Content-Length": String(file.size) };
    if (head) return new Response(null, { status: range ? 206 : 200, headers });
    const nodeStream = createAudioReadStream(file.absolutePath, range || undefined);
    const body = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
    return new Response(body, { status: range ? 206 : 200, headers });
  } catch (error) {
    return listeningErrorResponse(error);
  }
}

