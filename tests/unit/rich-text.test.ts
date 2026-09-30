import { describe, expect, it } from "vitest";
import { parseRichText } from "@/components/content/RichText";
import { DEFAULT_PAGES } from "@/lib/content/default-pages";

describe("parseRichText", () => {
  it("separates headings from the paragraph on the next line", () => {
    expect(parseRichText("## Title\nBody line one\nline two\n\nSecond para")).toEqual([
      { kind: "h2", text: "Title" },
      { kind: "p", lines: ["Body line one", "line two"] },
      { kind: "p", lines: ["Second para"] },
    ]);
  });

  it("groups bullets", () => {
    expect(parseRichText("- a\n- b\nafter")).toEqual([
      { kind: "ul", items: ["a", "b"] },
      { kind: "p", lines: ["after"] },
    ]);
  });

  it("parses every default page into headings and paragraphs", () => {
    for (const text of Object.values(DEFAULT_PAGES)) {
      const blocks = parseRichText(text);
      expect(blocks.some((b) => b.kind === "h2")).toBe(true);
      expect(blocks.every((b) => b.kind !== "h2" || !b.text.includes("."))).toBe(true);
    }
  });
});
