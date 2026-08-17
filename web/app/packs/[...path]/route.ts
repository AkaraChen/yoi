import path from "path";
import { NextResponse } from "next/server";

import { listPackFiles, readPackFile } from "@/lib/packs";

export const dynamic = "force-static";

function contentType(rel: string) {
  switch (path.extname(rel).toLowerCase()) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".json":
      return "application/json; charset=utf-8";
    case ".md":
    case ".mdx":
      return "text/markdown; charset=utf-8";
    default:
      return "text/plain; charset=utf-8";
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const segments = (await ctx.params).path;
  if (segments.length === 0) {
    return new NextResponse("not found", { status: 404 });
  }
  const name = segments[0];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    return new NextResponse("not found", { status: 404 });
  }

  try {
    if (segments.length === 1 || (segments.length === 2 && segments[1] === "index.json")) {
      try {
        const raw = await readPackFile(name, "index.json");
        return new NextResponse(raw, {
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      } catch {
        const files = await listPackFiles(name);
        return NextResponse.json({ files });
      }
    }

    const rel = segments.slice(1).join("/");
    const body = await readPackFile(name, rel);
    return new NextResponse(body, {
      headers: { "Content-Type": contentType(rel) },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
