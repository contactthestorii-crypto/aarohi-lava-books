import type { ReactNode } from "react";

/**
 * Renders admin-edited plain text safely (no HTML): blank line = paragraph, "## " = heading,
 * lines starting with "- " = bullet list.
 */
export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out: ReactNode[] = [];
  blocks.forEach((block, index) => {
    if (block.startsWith("## ")) {
      out.push(
        <h2 key={index} className="mt-8 font-display text-xl font-extrabold first:mt-0">
          {block.slice(3)}
        </h2>,
      );
      return;
    }
    const lines = block.split("\n");
    if (lines.every((line) => line.startsWith("- "))) {
      out.push(
        <ul key={index} className="mt-3 list-disc space-y-1 pl-5">
          {lines.map((line, i) => (
            <li key={i}>{line.slice(2)}</li>
          ))}
        </ul>,
      );
      return;
    }
    out.push(
      <p key={index} className="mt-3 whitespace-pre-line">
        {block}
      </p>,
    );
  });
  return <div className="max-w-[70ch] text-[15px] leading-relaxed text-ink/90">{out}</div>;
}
