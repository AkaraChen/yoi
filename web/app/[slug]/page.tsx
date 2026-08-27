import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Github,
  Globe,
  TerminalSquare,
} from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { PackCover } from "@/components/pack-cover";
import { MdxContent } from "@/components/mdx-content";
import { packLinks } from "@/lib/mdx";
import {
  excerptFromMdx,
  findPackCover,
  listPackNames,
  readPackFile,
} from "@/lib/packs";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const names = await listPackNames();
  return names.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const raw = (await readPackFile(slug, "page.mdx")).toString("utf8");
    return { title: `${slug} · Yoi`, description: excerptFromMdx(raw) };
  } catch {
    return { title: "Yoi" };
  }
}

const LINK_ICONS: Record<string, typeof Globe> = {
  website: Globe,
  docs: BookOpen,
  github: Github,
};

const LINK_LABELS: Record<string, string> = {
  website: "官网",
  docs: "文档",
  github: "GitHub",
};

function CommandBlock({ command }: { command: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-terminal p-3 pl-4">
      <code className="overflow-x-auto whitespace-nowrap font-mono text-xs text-terminal-foreground">
        {command}
      </code>
      <CopyButton text={command} className="shrink-0" />
    </div>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    notFound();
  }
  let raw: string;
  try {
    raw = (await readPackFile(slug, "page.mdx")).toString("utf8");
  } catch {
    notFound();
  }
  const installSkill = "npx skills add AkaraChen/yoi --skill yoi -g";
  const askAgent = `用 yoi 安装 ${slug}`;
  const cover = await findPackCover(slug);
  const links = packLinks(raw);

  return (
    <div className="container space-y-8 py-10 sm:py-14">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/shop"
          className="transition-colors hover:text-foreground"
        >
          全部 Pack
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground">{slug}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          {cover ? (
            <img
              src={cover}
              alt={slug}
              className="aspect-[16/9] w-full rounded-lg border object-cover shadow-sm"
            />
          ) : (
            <PackCover
              slug={slug}
              className="aspect-[16/9] w-full rounded-lg border shadow-sm"
            />
          )}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-display text-4xl sm:text-5xl">
                {slug}
              </h1>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                免费
              </span>
              {links.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  {links.map((link) => {
                    const Icon = LINK_ICONS[link.type] ?? Globe;
                    const label = LINK_LABELS[link.type] ?? link.type;
                    return (
                      <a
                        key={link.type}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        title={label}
                        className="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Icon className="size-4" aria-hidden />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4 text-base leading-8 text-foreground/90">
            <MdxContent src={raw} />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32">
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-foreground">
                <TerminalSquare className="size-4" aria-hidden />
              </span>
              <h2 className="text-lg font-medium">安装此 Pack</h2>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                1. 安装 yoi skill（只需一次）
              </p>
              <CommandBlock command={installSkill} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                2. 跟你的 Agent 说
              </p>
              <CommandBlock command={askAgent} />
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              安装脚本会打印将要做的事并等你输入 yes，绝不静默执行。
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
