import { ImageResponse } from "next/og";
import { FEATURED_BOOK } from "@/lib/content/featured-book";

export const alt = "Aarohi Lava Publications: books for TSLPRB, TGPSC and competitive exams";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview built from text (no cover photo). */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#10214d", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", background: "#c8102e", padding: "22px 64px", fontSize: 30, fontWeight: 700 }}>
          For {FEATURED_BOOK.exams.join(" | ")} and other competitive exams
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", padding: "0 64px" }}>
          <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>PREPARE SMARTER.</div>
          <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>SCORE BETTER.</div>
          <div style={{ display: "flex", marginTop: 36, fontSize: 36, color: "#c9d3ea" }}>
            {FEATURED_BOOK.brand}: {FEATURED_BOOK.title}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 64px 40px", fontSize: 30 }}>
          <span style={{ fontWeight: 700 }}>{FEATURED_BOOK.publisher}</span>
          <span style={{ display: "flex", background: "#f2b705", color: "#0b1733", padding: "8px 20px", borderRadius: 999, fontWeight: 800 }}>
            {FEATURED_BOOK.edition}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
