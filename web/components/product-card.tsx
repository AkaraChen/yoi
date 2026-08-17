import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PackCover } from "@/components/pack-cover";

export type Product = {
  slug: string;
  excerpt: string;
  cover: string | null;
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/${product.slug}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-colors duration-200 hover:bg-secondary/60"
    >
      <div className="relative">
        {product.cover ? (
          <img
            src={product.cover}
            alt={product.slug}
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <PackCover slug={product.slug} className="aspect-[16/10] w-full" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
          免费
        </span>
      </div>
      <div className="space-y-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-medium tracking-tight text-card-foreground">
            {product.slug}
          </h3>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {product.excerpt}
        </p>
      </div>
    </Link>
  );
}
