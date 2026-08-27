export function normalizeShopQuery(raw: string): string {
  return raw.trim();
}

export function filterProducts<T extends { slug: string; excerpt: string }>(
  products: readonly T[],
  rawQuery: string,
): T[] {
  const q = normalizeShopQuery(rawQuery).toLowerCase();
  if (q === "") {
    return [...products];
  }
  return products.filter(
    (product) =>
      product.slug.toLowerCase().includes(q) ||
      product.excerpt.toLowerCase().includes(q),
  );
}
