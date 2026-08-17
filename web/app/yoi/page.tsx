import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "yoi · Yoi",
};

export default function YoiPage() {
  return (
    <article className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            文章
          </Link>
        </p>
        <h1 className="text-3xl font-bold tracking-tight">yoi</h1>
        <time dateTime="2026-08-17" className="block text-sm text-muted-foreground">
          2026-08-17
        </time>
      </div>
      <div className="space-y-4 text-base leading-7">
        <p>把 yoi skill 交给自己的 agent。</p>
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
          <code>https://yoi-sigma.vercel.app/skills/yoi.md</code>
        </pre>
      </div>
    </article>
  );
}
