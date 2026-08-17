import type { Metadata } from "next";

import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "全部 Pack · Yoi",
  description: "yoi 商城的全部 Pack：每个 Pack 内含 agent 能直接用的 skill。",
};

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="container space-y-10 py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-display text-4xl sm:text-5xl">全部 Pack</h1>
          <p className="max-w-xl text-muted-foreground">
            每个 Pack 内含 agent 能直接用的 skill，挑一个，跟 Agent 说「用 yoi
            安装 &lt;名字&gt;」。
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          共 {products.length} 个 Pack
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
