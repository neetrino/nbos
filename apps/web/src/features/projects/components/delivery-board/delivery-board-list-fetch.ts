import { extensionsApi, type Extension } from '@/lib/api/extensions';
import { productsApi, type Product } from '@/lib/api/products';

const PAGE_SIZE = 200;

export async function fetchAllProductsList(): Promise<Product[]> {
  const all: Product[] = [];
  let page = 1;
  for (;;) {
    const { items, meta } = await productsApi.getAll({ page, pageSize: PAGE_SIZE });
    all.push(...items);
    if (page >= meta.totalPages) break;
    page += 1;
  }
  return all;
}

export async function fetchAllExtensionsList(): Promise<Extension[]> {
  const all: Extension[] = [];
  let page = 1;
  for (;;) {
    const { items, meta } = await extensionsApi.getAll({ page, pageSize: PAGE_SIZE });
    all.push(...items);
    if (page >= meta.totalPages) break;
    page += 1;
  }
  return all;
}
