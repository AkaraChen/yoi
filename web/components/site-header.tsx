import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="bg-primary text-primary-foreground">
        <div className="container flex h-9 items-center justify-center gap-2 text-xs font-medium">
          <Terminal className="size-3.5" aria-hidden />
          <span>Yoi Skill 现已发布 — 装进 Agent，部署一句话的事</span>
          <Link
            href="/#packs"
            className="hidden items-center gap-1 underline-offset-4 hover:underline sm:inline-flex"
          >
            立即了解
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      </div>
      <div className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            Yoi<span className="text-accent">.</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/shop"
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
            >
              全部 Pack
            </Link>
            <Link
              href="/#top"
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85"
            >
              安装 Skill
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
