import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">
          商品
        </Link>
      </p>
      <div className="grid items-start gap-8 md:grid-cols-[1fr_18rem]">
        <div className="space-y-4 text-base leading-7">
          <h1 className="text-3xl font-bold tracking-tight">{slug}</h1>
          {renderMdx(raw)}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">安装</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
              <code>npx skills add AkaraChen/yoi --skill yoi -g</code>
            </pre>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
              <code>{`用 yoi 安装 ${slug}`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
