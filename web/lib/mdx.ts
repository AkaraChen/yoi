export type PackLink = { type: string; url: string };

export function splitFrontmatter(src: string): {
  data: Record<string, string>;
  body: string;
} {
  const text = src.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) {
    return { data: {}, body: text };
  }
  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    return { data: {}, body: text };
  }
  const data: Record<string, string> = {};
  for (const line of text.slice(4, end).split("\n")) {
    const match = /^([a-z][a-z0-9-]*):\s*(\S+)\s*$/.exec(line.trim());
    if (match) {
      data[match[1]] = match[2];
    }
  }
  return { data, body: text.slice(end + 4).replace(/^\n+/, "") };
}

export function packLinks(src: string): PackLink[] {
  const { data } = splitFrontmatter(src);
  return Object.entries(data)
    .filter(([, url]) => /^https?:\/\//.test(url))
    .map(([type, url]) => ({ type, url }));
}
