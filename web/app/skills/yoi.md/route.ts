import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const candidates = [
    path.join(process.cwd(), "..", "skills", "yoi", "SKILL.md"),
    path.join(process.cwd(), "skills", "yoi", "SKILL.md"),
  ];
  for (const file of candidates) {
    try {
      const body = await fs.readFile(file);
      return new NextResponse(body, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    } catch {
      // try next
    }
  }
  return new NextResponse("not found", { status: 404 });
}
