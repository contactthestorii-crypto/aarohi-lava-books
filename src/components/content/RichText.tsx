import type { ReactNode } from "react";

type Block = { kind: "h2"; text: string } | { kind: "ul"; items: string[] } | { kind: "p"; lines: string[] };

/** Parses admin-edited plain text: "## " heading lines, "- " bullet lines, other lines as paragraphs (blank line = new paragraph). */
export function parseRichText(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const last = blocks.at(-1);
    if (!line) {
      if (last?.kind === "p" && last.lines.length > 0) blocks.push({ kind: "p", lines: [] });
      continue;
    }
    if (line.startsWith("## ")) blocks.push({ kind: "h2", text: line.slice(3).trim() });
    else if (line.startsWith("- ")) {
      if (last?.kind === "ul") last.items.push(line.slice(2).trim());
      else blocks.push({ kind: "ul", items: [line.slice(2).trim()] });
    } else if (last?.kind === "p") last.lines.push(line);
    else blocks.push({ kind: "p", lines: [line] });
  }
  return blocks.filter((b) => b.kind !== "p" || b.lines.length > 0);
}

/** Renders admin-edited text safely (React-escaped, no HTML). */
export function RichText({ text }: { text: string }) {
  const out: ReactNode[] = parseRichText(text).map((block, index) => {
    if (block.kind === "h2") {
      return (
        <h2 key={index} className="mt-8 font-display text-xl font-extrabold first:mt-0">
          {block.text}
        </h2>
      );
    }
    if (block.kind === "ul") {
      return (
        <ul key={index} className="mt-3 list-disc space-y-1 pl-5">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={index} className="mt-3">
        {block.lines.join(" ")}
      </p>
    );
  });
  return <div className="max-w-[70ch] text-[15px] leading-relaxed text-ink/90">{out}</div>;
}
