import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const mime = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".txt": "text/plain" };

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    const decoded = decodeURIComponent(url.pathname);
    const candidate = path.resolve(root, `.${decoded}`);
    if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) throw new Error("invalid path");
    let filePath = candidate;
    const fileStat = await stat(filePath).catch(() => null);
    if (fileStat?.isDirectory()) filePath = path.join(filePath, "index.html");
    else if (!fileStat) filePath = path.join(candidate, "index.html");
    const finalStat = await stat(filePath).catch(() => null);
    if (!finalStat?.isFile()) filePath = path.join(root, "404.html");
    response.writeHead(filePath.endsWith("404.html") ? 404 : 200, { "Content-Type": `${mime[path.extname(filePath)] ?? "application/octet-stream"}; charset=utf-8` });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(400).end("Bad request");
  }
}).listen(4173, "127.0.0.1", () => console.log("Static test server: http://127.0.0.1:4173"));
