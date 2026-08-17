import { NextResponse } from "next/server";

import { listPackFiles, readPackFile } from "@/lib/packs";

export const dynamic = "force-static";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
  json: "application/json; charset=utf-8",
};

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
    const ext = rel.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME[ext] ?? "text/plain; charset=utf-8";
    return new NextResponse(new Uint8Array(body), {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
