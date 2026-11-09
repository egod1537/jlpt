import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GrammarPage } from "@/components/grammar/grammar-page";
import { GrammarSetPage } from "@/components/grammar/grammar-set-page";
import { grammarChapters, grammarPoints, grammarSets } from "@/lib/grammar";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });

afterEach(cleanup);

describe("grammar content", () => {
  it("keeps every grammar point unique and assigned to one chapter", () => {
    const ids = grammarPoints.map((point) => point.id);
    const coreIds = ids.filter((id) => !id.startsWith("imported-"));
    const assigned = grammarChapters.flatMap((chapter) => chapter.pointIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(assigned).size).toBe(assigned.length);
    expect(assigned.sort()).toEqual(coreIds.sort());
    expect(grammarPoints.every((point) => point.connection.length >= 1)).toBe(true);

    const setIds = grammarSets.map((set) => set.id);
    expect(new Set(setIds).size).toBe(setIds.length);
    expect(grammarSets.every((set) => set.pointIds.length > 0 && set.pointIds.every((id) => ids.includes(id)))).toBe(true);
    expect(new Set(grammarSets.map((set) => set.type))).toEqual(new Set(["flashcard", "book"]));

    const importedPoints = grammarPoints.filter((point) => point.id.startsWith("imported-"));
    const importedSets = grammarSets.filter((set) => set.id.startsWith("imported-"));
    expect(importedPoints).toHaveLength(89);
    expect(importedPoints.every((point) => point.notesMarkdown && point.sourceFile)).toBe(true);
    expect(importedPoints.every((point) => point.examples.length >= 5)).toBe(true);
    expect(importedSets).toHaveLength(14);
    expect(new Set(importedSets.map((set) => set.sourceFile)).size).toBe(7);
    expect(importedSets.every((set) => /^0[1-7]\. /.test(set.title))).toBe(true);
    expect(importedSets.filter((set) => set.type === "book").every((set) => set.markdown)).toBe(true);
  });
});

describe("grammar page", () => {
  it("lists sets and filters them by their single content type", async () => {
    const user = userEvent.setup();
    render(<GrammarPage />);

    expect(screen.getByRole("heading", { name: "시작과 범위" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "N1 핵심 문형 노트" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "책" }));
    expect(screen.getByRole("heading", { name: "N1 핵심 문형 노트" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "시작과 범위" })).not.toBeInTheDocument();
  });

  it("reveals a flash card and advances to the next pattern", async () => {
    const user = userEvent.setup();
    render(<GrammarSetPage setId="n1-range-cards" />);

    expect(screen.getByText("～を皮切りに")).toBeVisible();
    expect(screen.getByText("～을 시작으로, ～을 필두로")).toHaveClass("invisible");

    await user.click(screen.getByRole("button", { name: /한국어/ }));
    expect(screen.getByText("～을 시작으로, ～을 필두로")).not.toHaveClass("invisible");

    await user.click(screen.getByRole("button", { name: /알고있음/ }));
    expect(screen.getByText("～をもって")).toBeVisible();
  });

  it("opens a book set and filters it by Korean meaning", async () => {
    const user = userEvent.setup();
    render(<GrammarSetPage setId="n1-core-book" />);

    expect(screen.getAllByRole("heading", { name: "N1 핵심 문형 노트" })).toHaveLength(2);

    await user.type(screen.getByRole("textbox", { name: "문법 책 검색" }), "불가피");
    expect(screen.getByRole("status")).toHaveTextContent("1개 문형을 찾았습니다.");
    expect(screen.getAllByRole("heading", { name: "～を余儀なくされる" })).toHaveLength(2);
    expect(screen.queryByRole("heading", { name: "～を皮切りに" })).not.toBeInTheDocument();
  });

  it("turns an imported Markdown document into card and book sets", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<GrammarSetPage setId="imported-01-cards" />);

    expect(screen.getByText("～(ら)れる")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /접속/ }));
    expect(screen.getByText(/동사 미연형/)).toBeVisible();
    expect(screen.queryByText(/この曲を聴くと/)).not.toBeInTheDocument();

    unmount();
    render(<GrammarSetPage setId="imported-01-book" />);
    expect(screen.getAllByText("01_기본 문형_판단 및 전달.md").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "01. 기본 문형 판단 및 전달" })).toBeVisible();
    expect(screen.getAllByRole("heading", { name: "～(ら)れる" })).toHaveLength(2);
    const mobilePage = screen.getByRole("article", { name: "문법 책 현재 페이지" });
    expect(within(mobilePage).queryByText(/この曲を聴くと/)).not.toBeInTheDocument();
    expect(within(mobilePage).getByText("설명 1/2")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /예문 보기/ }));
    expect(within(mobilePage).getByText(/この曲を聴くと/)).toBeVisible();
    expect(within(mobilePage).getByText("예문 2/2")).toBeVisible();
    expect(within(mobilePage).getByText(/古いアルバムを開くと/)).toBeVisible();
    expect(within(mobilePage).getByText(/この香りをかぐと/)).toBeVisible();
    expect(screen.getByLabelText("문법 책 페이지")).toHaveTextContent(/^이전2\/\d+다음$/);
  });
});
