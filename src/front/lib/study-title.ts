export type StudyTitleMode = "all" | "unseen" | "due" | "weak";

type BookReference = { id: string; title: string };
type FolderReference = { id: string; name: string };

export function resolveStudyTitle({ scope, bookIds, mode, books, folders }: {
  scope: string;
  bookIds: string[];
  mode: StudyTitleMode;
  books: BookReference[];
  folders: FolderReference[];
}) {
  if (scope.startsWith("folder:")) return folders.find((folder) => folder.id === scope.slice(7))?.name || "폴더 학습";
  if (scope) return books.find((book) => book.id === scope)?.title || "세트 학습";
  if (bookIds.length === 1) return books.find((book) => book.id === bookIds[0])?.title || "세트 학습";
  if (bookIds.length > 1) return `${bookIds.length}개 세트 학습`;
  if (mode === "due") return "복습 카드";
  if (mode === "weak") return "취약 카드";
  if (mode === "unseen") return "미학습 카드";
  return "학습 카드";
}
