import { describe, expect, it } from "vitest";
import { resolveStudyTitle } from "@/lib/study-title";

const books = [
  { id: "book-a", title: "첫 세트" },
  { id: "book-b", title: "둘째 세트" },
];
const folders = [{ id: "folder-a", name: "독해" }];

describe("study title", () => {
  it("keeps the requested book or folder title as the session title", () => {
    expect(resolveStudyTitle({ scope: "book-a", bookIds: ["book-a"], mode: "all", books, folders })).toBe("첫 세트");
    expect(resolveStudyTitle({ scope: "folder:folder-a", bookIds: ["book-a", "book-b"], mode: "all", books, folders })).toBe("독해");
  });

  it("uses a stable summary when resuming a session without its original URL scope", () => {
    expect(resolveStudyTitle({ scope: "", bookIds: ["book-a"], mode: "all", books, folders })).toBe("첫 세트");
    expect(resolveStudyTitle({ scope: "", bookIds: ["book-a", "book-b"], mode: "all", books, folders })).toBe("2개 세트 학습");
    expect(resolveStudyTitle({ scope: "", bookIds: [], mode: "due", books, folders })).toBe("복습 카드");
  });
});
