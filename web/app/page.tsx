import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { excerptFromMdx, listPackNames, packCover, readPackFile } from "@/lib/packs";

export default async function HomePage() {
  const names = await listPackNames();
  const products = await Promise.all(
    names.map(async (slug) => {
      const raw = (await readPackFile(slug, "page.mdx")).toString("utf8");
      return { slug, excerpt: excerptFromMdx(raw), cover: await packCover(slug) };
    }),
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Link key={product.slug} href={`/${product.slug}`} className="block">
          <Card className="h-full overflow-hidden transition-colors hover:bg-accent/40">
            {product.cover ? (
              <img
                src={product.cover}
                alt=""
                className="aspect-video w-full object-cover"
              />
            ) : null}
            <CardHeader>
              <CardTitle>{product.slug}</CardTitle>
              <CardDescription>{product.excerpt}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
