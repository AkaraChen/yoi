import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { excerptFromMdx, listPackNames, readPackFile } from "@/lib/packs";

export default async function HomePage() {
  const names = await listPackNames();
  const products = await Promise.all(
    names.map(async (slug) => {
      const raw = (await readPackFile(slug, "page.mdx")).toString("utf8");
      return { slug, excerpt: excerptFromMdx(raw) };
    }),
  );
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">商品</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product) => (
          <Link key={product.slug} href={`/${product.slug}`} className="block">
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader>
                <CardTitle>{product.slug}</CardTitle>
                <CardDescription>{product.excerpt}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
