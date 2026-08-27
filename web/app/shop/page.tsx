import type { Metadata } from "next";

import { ShopShelf } from "@/components/shop-shelf";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "全部 Pack · Yoi",
  description: "yoi 商城的全部 Pack：每个 Pack 内含 agent 能直接用的 skill。",
};

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="container py-16 sm:py-20">
      <ShopShelf products={products} />
    </div>
  );
}
