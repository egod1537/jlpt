import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { closeDatabase, getDatabase } from "@back/lib/db/database";
import { databasePath } from "@back/lib/db/config";
import { runListeningWorkerLoop } from "@back/lib/listening/worker";

const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => controller.abort(new Error(signal)));
}

const heartbeatPath = process.env.JLPT_WORKER_HEARTBEAT_PATH?.trim()
  || path.join(path.dirname(databasePath()), "listening", "worker-heartbeat");

async function heartbeat() {
  await mkdir(path.dirname(heartbeatPath), { recursive: true, mode: 0o700 });
  await writeFile(heartbeatPath, `${new Date().toISOString()}\n`, { mode: 0o600 });
}

try {
  getDatabase();
  await heartbeat();
  const timer = setInterval(() => void heartbeat().catch((error: unknown) => {
    console.error(JSON.stringify({ component: "listening-worker", event: "heartbeat-failed", code: error instanceof Error ? error.name : "UNKNOWN" }));
  }), 5_000);
  console.log(JSON.stringify({ component: "listening-worker", event: "started", concurrency: Number(process.env.JLPT_LISTENING_WORKER_CONCURRENCY || 1) }));
  try {
    await runListeningWorkerLoop({ signal: controller.signal, onIdle: heartbeat });
  } finally {
    clearInterval(timer);
  }
} finally {
  closeDatabase();
  console.log(JSON.stringify({ component: "listening-worker", event: "stopped" }));
}
