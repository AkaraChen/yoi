import type { ReactNode } from "react";
import { createElement } from "react";

const IMAGE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

function imageSrc(src: string, pack?: string) {
  if (/^https?:\/\//.test(src) || src.startsWith("/")) {
    return src;
  }
  if (!pack) {
    return src;
  }
  return `/packs/${pack}/${src}`;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    if (match[1] && match[2]) {
      nodes.push(
        createElement(
          "a",
          {
            key: `${keyPrefix}-a-${i}`,
            href: match[2],
            className: "underline underline-offset-4",
          },
          match[1],
        ),
      );
    } else if (match[3]) {
      nodes.push(
        createElement(
          "code",
          { key: `${keyPrefix}-c-${i}`, className: "rounded bg-muted px-1 py-0.5 text-sm" },
          match[3],
        ),
      );
    }
    last = match.index + match[0].length;
    i += 1;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes;
}

export function renderMdx(src: string, pack?: string): ReactNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    const img = line.trim().match(IMAGE);
    if (img) {
      out.push(
        createElement("img", {
          key: k++,
          src: imageSrc(img[2], pack),
          alt: img[1],
          className: "my-4 w-full rounded-lg",
        }),
      );
      i += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        i += 1;
      }
      out.push(
        createElement(
          "pre",
          { key: k++, className: "overflow-x-auto rounded-md bg-muted p-4 text-sm" },
          createElement("code", null, buf.join("\n")),
        ),
      );
      continue;
    }
    if (line.startsWith("### ")) {
      out.push(
        createElement(
          "h3",
          { key: k++, className: "text-lg font-semibold tracking-tight" },
          line.slice(4),
        ),
      );
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(
        createElement(
          "h2",
          { key: k++, className: "text-xl font-semibold tracking-tight" },
          line.slice(3),
        ),
      );
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      out.push(
        createElement(
          "h1",
          { key: k++, className: "text-3xl font-bold tracking-tight" },
          line.slice(2),
        ),
      );
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(createElement("li", { key: items.length }, renderInline(lines[i].slice(2), `ul${k}`)));
        i += 1;
      }
      out.push(createElement("ul", { key: k++, className: "list-disc space-y-1 pl-5" }, items));
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(
          createElement("li", { key: items.length }, renderInline(lines[i].replace(/^\d+\. /, ""), `ol${k}`)),
        );
        i += 1;
      }
      out.push(createElement("ol", { key: k++, className: "list-decimal space-y-1 pl-5" }, items));
      continue;
    }
    out.push(createElement("p", { key: k++ }, renderInline(line, `p${k}`)));
    i += 1;
  }
  return out;
}
