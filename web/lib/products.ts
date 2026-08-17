import type { Product } from "@/components/product-card";

import { excerptFromMdx, findPackCover, listPackNames, readPackFile } from "./packs";

export async function getProducts(): Promise<Product[]> {
  const names = await listPackNames();
  return Promise.all(
    names.map(async (slug) => {
      const raw = (await readPackFile(slug, "page.mdx")).toString("utf8");
      return {
        slug,
        excerpt: excerptFromMdx(raw),
        cover: await findPackCover(slug),
      };
    }),
  );
}
