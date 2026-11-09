import { Fragment, type ReactNode } from "react";

type MarkdownDocumentProps = {
  markdown: string;
  compact?: boolean;
  sectionIds?: string[];
};

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));
    const token = match[0];
    if (token.startsWith("`")) nodes.push(<code key={`${index}-${token}`} className="rounded bg-app-bg px-1.5 py-0.5 font-mono text-[0.92em] text-app-accent">{token.slice(1, -1)}</code>);
    else nodes.push(<strong key={`${index}-${token}`} className="font-black text-app-text">{token.slice(2, -2)}</strong>);
    cursor = index + token.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function tableCells(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

export function MarkdownDocument({ markdown, compact = false, sectionIds = [] }: MarkdownDocumentProps) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let sectionIndex = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    if (!line.trim()) { index += 1; continue; }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={`hr-${index}`} className="my-8 border-app-border" />);
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      if (level === 1) blocks.push(<h2 key={`h1-${index}`} className={`${compact ? "mt-6 text-xl" : "mt-10 text-3xl"} first:mt-0 font-black leading-tight`}>{inline(text)}</h2>);
      else if (level === 2) {
        const id = sectionIds[sectionIndex];
        sectionIndex += 1;
        blocks.push(<h3 id={id} key={`h2-${index}`} className={`${compact ? "mt-7 text-lg" : "mt-12 scroll-mt-24 border-t border-app-border pt-8 text-2xl"} first:mt-0 first:border-t-0 first:pt-0 font-black leading-tight text-app-accent`}>{inline(text)}</h3>);
      } else blocks.push(<h4 key={`h3-${index}`} className={`${compact ? "mt-5 text-base" : "mt-8 text-lg"} font-black leading-tight text-app-text`}>{inline(text)}</h4>);
      index += 1;
      continue;
    }

    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trimStart().startsWith(">")) {
        quote.push(lines[index].trimStart().replace(/^>\s?/, "").replace(/\s{2}$/, ""));
        index += 1;
      }
      blocks.push(<blockquote key={`quote-${index}`} className="my-5 rounded-r-xl border-l-4 border-app-accent bg-app-raised px-4 py-3 text-sm leading-7 text-app-muted">{quote.map((item, quoteIndex) => <Fragment key={`${quoteIndex}-${item}`}>{inline(item)}{quoteIndex < quote.length - 1 ? <br /> : null}</Fragment>)}</blockquote>);
      continue;
    }

    if (line.trimStart().startsWith("|") && /^\s*\|?\s*:?-+/.test(lines[index + 1] ?? "")) {
      const rows: string[][] = [tableCells(line)];
      index += 2;
      while (index < lines.length && lines[index].trimStart().startsWith("|")) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      blocks.push(<div key={`table-${index}`} className="my-5 overflow-x-auto rounded-xl border border-app-border"><table className="w-full min-w-[420px] border-collapse text-left text-sm"><thead className="bg-app-raised"><tr>{rows[0].map((cell) => <th key={cell} className="border-b border-app-border px-3 py-2 font-black">{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex} className="border-b border-app-border last:border-0">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2 align-top leading-6 text-app-muted">{inline(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }

    const unordered = line.match(/^\s*-\s+(.+)$/);
    if (unordered) {
      const items: string[] = [];
      while (index < lines.length) {
        const match = lines[index].match(/^\s*-\s+(.+)$/);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }
      blocks.push(<ul key={`ul-${index}`} className="my-4 list-disc space-y-2 pl-5 text-sm leading-7 text-app-muted">{items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`}>{inline(item)}</li>)}</ul>);
      continue;
    }

    const ordered = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (ordered) {
      const start = Number(ordered[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const match = lines[index].match(/^\s*\d+\.\s+(.+)$/);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }
      blocks.push(<ol start={start} key={`ol-${index}`} className="my-4 list-decimal space-y-2 pl-6 text-sm leading-7">{items.map((item, itemIndex) => <li key={`${itemIndex}-${item}`} className="jp pl-1">{inline(item)}</li>)}</ol>);
      continue;
    }

    const paragraph: string[] = [line.replace(/\s{2}$/, "")];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s|^---+$|^>|^\s*[-*]\s+|^\s*\d+\.\s+|^\s*\|/.test(lines[index])) {
      paragraph.push(lines[index].trimEnd().replace(/\s{2}$/, ""));
      index += 1;
    }
    blocks.push(<p key={`p-${index}`} className={`${compact ? "my-3" : "my-4"} text-sm leading-7 text-app-muted`}>{paragraph.map((item, paragraphIndex) => <Fragment key={`${paragraphIndex}-${item}`}>{inline(item)}{paragraphIndex < paragraph.length - 1 ? <br /> : null}</Fragment>)}</p>);
  }

  return <div className="min-w-0">{blocks}</div>;
}
