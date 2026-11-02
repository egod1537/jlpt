import { describe, expect, it } from "vitest";
import { formatNuance } from "@/lib/format-nuance";

describe("formatNuance", () => {
  it("renders nuance text inside Japanese corner brackets", () => {
    expect(formatNuance("타고난 바탕")).toBe("「타고난 바탕」");
    expect(formatNuance("  「이미 감싼 문맥」  ")).toBe("「이미 감싼 문맥」");
    expect(formatNuance("   ")).toBe("");
  });
});
