export type CredentialProductSummary = { id: string; name: string };

export type WithCredentialProduct<T extends { productId?: string | null }> = T & {
  product: CredentialProductSummary | null;
};

type ProductDelegate = {
  findMany: (args: {
    where: { id: { in: string[] } };
    select: { id: true; name: true };
  }) => Promise<Array<{ id: string; name: string }>>;
};

/** Collects unique non-empty `productId` values from credential API rows. */
export function collectCredentialProductIds(items: Array<{ productId?: string | null }>): string[] {
  const ids = new Set<string>();
  for (const item of items) {
    if (typeof item.productId === 'string' && item.productId.length > 0) {
      ids.add(item.productId);
    }
  }
  return [...ids];
}

/** Merges batch-loaded product summaries onto credential rows. */
export function mergeCredentialProducts<T extends { productId?: string | null }>(
  items: T[],
  productsById: Map<string, CredentialProductSummary>,
): Array<WithCredentialProduct<T>> {
  return items.map((item) => {
    const productId = typeof item.productId === 'string' ? item.productId : null;
    const product = productId ? (productsById.get(productId) ?? null) : null;
    return { ...item, product };
  });
}

/** Batch-loads product names and attaches `product: { id, name } | null` to each row. */
export async function attachCredentialProducts<T extends { productId?: string | null }>(
  prisma: { product: ProductDelegate },
  items: T[],
): Promise<Array<WithCredentialProduct<T>>> {
  if (items.length === 0) return [];
  const ids = collectCredentialProductIds(items);
  if (ids.length === 0) {
    return items.map((item) => ({ ...item, product: null }));
  }
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  return mergeCredentialProducts(items, new Map(products.map((product) => [product.id, product])));
}
