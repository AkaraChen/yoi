import type { Product } from "@/components/product-card";

import { splitFrontmatter } from "./mdx";
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

export async function getShopOnlySlugs(): Promise<ReadonlySet<string>> {
  const names = await listPackNames();
  const flagged = await Promise.all(
    names.map(async (slug) => {
      const raw = (await readPackFile(slug, "page.mdx")).toString("utf8");
      return splitFrontmatter(raw).data["shop-only"] === "true" ? slug : null;
    }),
  );
  return new Set(flagged.filter((slug): slug is string => slug !== null));
}
