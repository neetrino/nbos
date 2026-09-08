import type { ProductsHubTab } from '@/features/projects/constants/products-hub-page-preferences-storage';
import type { ProductListParams } from '@/lib/api/products';

export function productsHubTabToListParams(
  tab: ProductsHubTab,
): Pick<ProductListParams, 'hubView' | 'includeHubView'> {
  if (tab === 'delivery' || tab === 'maintenance' || tab === 'closed') {
    return { hubView: tab, includeHubView: true };
  }
  return { includeHubView: true };
}
