import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCollectionIndex } from "@/lib/data";

export async function getBuildCollections() {
  const filePath = path.resolve(process.cwd(), "..", "..", "dataset", "data", "collections.json");
  return parseCollectionIndex(JSON.parse(await readFile(filePath, "utf8")) as unknown);
}
