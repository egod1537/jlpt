export const defaultLibraryFolders = [
  { id: "folder-listening", name: "청해", orderIndex: 0 },
  { id: "folder-real-hankkeut", name: "진짜 한끝", orderIndex: 1 },
  { id: "folder-reading", name: "독해", orderIndex: 2 },
  { id: "folder-language-knowledge", name: "언지", orderIndex: 3 },
  { id: "folder-editorial", name: "사설", orderIndex: 4 },
  { id: "folder-hankkeut", name: "한끝", orderIndex: 5 },
] as const;

const placementEntries = [
  ["session-045", "folder-real-hankkeut", 0],
  ["session-040", "folder-real-hankkeut", 1],
  ["session-035", "folder-real-hankkeut", 2],
  ["session-034", "folder-real-hankkeut", 3],
  ["session-031", "folder-real-hankkeut", 4],
  ["session-030", "folder-real-hankkeut", 5],
  ["session-029", "folder-real-hankkeut", 6],
  ["session-028", "folder-real-hankkeut", 7],
  ["html-n1-yuui-79-84", "folder-real-hankkeut", 8],
  ["session-038", "folder-real-hankkeut", 9],
  ["session-041", "folder-real-hankkeut", 10],
  ["session-044", "folder-real-hankkeut", 11],

  ["session-027", "folder-reading", 0],
  ["session-017", "folder-reading", 1],
  ["session-022", "folder-reading", 2],
  ["session-010", "folder-reading", 3],

  ["session-020", "folder-language-knowledge", 0],
  ["session-018", "folder-language-knowledge", 1],
  ["session-016", "folder-language-knowledge", 2],

  ["session-032", "folder-editorial", 0],
  ["session-026", "folder-editorial", 1],
  ["session-019", "folder-editorial", 2],
  ["session-014", "folder-editorial", 3],
  ["session-008", "folder-editorial", 4],
  ["session-024", "folder-editorial", 5],

  ["session-025", "folder-hankkeut", 0],
  ["session-015", "folder-hankkeut", 1],
  ["session-013", "folder-hankkeut", 2],
] as const;

export const defaultBookPlacements = new Map<string, { folderId: string; orderIndex: number }>(
  placementEntries.map(([bookId, folderId, orderIndex]) => [bookId, { folderId, orderIndex }]),
);

