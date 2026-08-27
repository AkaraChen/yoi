"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { ProductCard, type Product } from "@/components/product-card";
import { filterProducts, normalizeShopQuery } from "@/lib/shop-filter";

function readQueryFromLocation(): string {
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

function replaceShopQuery(raw: string) {
  const q = normalizeShopQuery(raw);
  const url = new URL(window.location.href);
  if (q === "") {
    url.searchParams.delete("q");
  } else {
    url.searchParams.set("q", q);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(window.history.state, "", next);
  }
}

export function ShopShelf({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = readQueryFromLocation();
    setQuery(initial);
    replaceShopQuery(initial);
    setHydrated(true);
  }, []);

  const activeQuery = hydrated ? query : "";
  const visible = filterProducts(products, activeQuery);
  const hasQuery = normalizeShopQuery(activeQuery) !== "";

  function onQueryChange(next: string) {
    setQuery(next);
    replaceShopQuery(next);
  }

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <h1 className="text-display text-4xl sm:text-5xl">全部 Pack</h1>
            <p className="max-w-xl text-muted-foreground">
              每个 Pack 内含 agent 能直接用的 skill，挑一个，跟 Agent 说「用 yoi
              安装 &lt;名字&gt;」。
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {hasQuery
              ? `${visible.length} 个匹配`
              : `共 ${products.length} 个 Pack`}
          </p>
        </div>
        <div role="search" className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索 Pack"
            autoComplete="off"
            spellCheck={false}
            aria-label="搜索 Pack"
            className="h-10 w-full rounded-full border bg-background pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      {hasQuery && visible.length === 0 ? (
        <p className="text-muted-foreground">没有匹配的 Pack</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
