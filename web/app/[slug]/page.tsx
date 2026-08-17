import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { renderMdx } from "@/lib/mdx";
import { excerptFromMdx, listPackNames, readPackFile } from "@/lib/packs";

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
  return (
    <article className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">
            商品
          </Link>
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{slug}</h1>
      </div>
      <div className="space-y-4 text-base leading-7">{renderMdx(raw)}</div>
      <div className="space-y-4 text-base leading-7">
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
          <code>npx skills add AkaraChen/yoi --skill yoi -g</code>
        </pre>
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
          <code>{`用 yoi 安装 ${slug}`}</code>
        </pre>
      </div>
    </article>
  );
}
