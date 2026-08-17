import { promises as fs } from "fs";
import path from "path";

const COVER_CANDIDATES = [
  "images/cover.png",
  "images/cover.webp",
  "images/cover.jpg",
  "cover.png",
  "cover.webp",
  "cover.jpg",
];

export function packsRoot() {
  return [
    path.join(process.cwd(), "..", "packs"),
    path.join(process.cwd(), "packs"),
    path.join(process.cwd(), "public", "packs"),
  ];
}

export async function resolvePacksRoot() {
  for (const dir of packsRoot()) {
    try {
      const st = await fs.stat(dir);
      if (st.isDirectory()) {
        return dir;
      }
    } catch {
      // try next
    }
  }
  throw new Error("packs directory not found");
}

export async function listPackNames() {
  const root = await resolvePacksRoot();
  const entries = await fs.readdir(root, { withFileTypes: true });
  const names: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    try {
      await fs.access(path.join(root, entry.name, "page.mdx"));
      names.push(entry.name);
    } catch {
      // skip
    }
  }
  return names.sort();
}

export async function readPackFile(name: string, rel: string) {
  const root = await resolvePacksRoot();
  const target = path.resolve(root, name, rel);
  const packDir = path.resolve(root, name);
  if (!target.startsWith(packDir + path.sep) && target !== packDir) {
    throw new Error("bad path");
  }
  return fs.readFile(target);
}

export async function listPackFiles(name: string, dir = "") {
  const root = await resolvePacksRoot();
  const base = path.join(root, name, dir);
  const entries = await fs.readdir(base, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listPackFiles(name, rel)));
    } else {
      files.push(rel);
    }
  }
  return files;
}

export async function packCover(name: string) {
  for (const rel of COVER_CANDIDATES) {
    try {
      await readPackFile(name, rel);
      return `/packs/${name}/${rel}`;
    } catch {
      // try next
    }
  }
  return "";
}

export function excerptFromMdx(src: string) {
  const line = src
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item && !item.startsWith("!") && !item.startsWith("#"));
  return line ?? "";
}
