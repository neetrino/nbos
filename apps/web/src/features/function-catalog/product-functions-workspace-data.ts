import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { deliveryConfigurationsApi } from '@/lib/api/delivery-configurations';
import { deliveryFunctionsApi } from '@/lib/api/delivery-functions';
import { productsApi } from '@/lib/api/products';
import { visibleSalePriceByFunctionId, type VisibleSalePrice } from './function-catalog-sale-price';

export type ProductFunctionsWorkspaceData = {
  config: { mode: string };
  catalog: DeliveryFunctionOperationalDto[];
  deliveryStatus: string | null;
  salePriceByFunctionId: Map<string, VisibleSalePrice>;
};

export async function loadProductFunctionsWorkspace(
  productId: string,
  canSeeRules: boolean,
): Promise<ProductFunctionsWorkspaceData> {
  const [config, catalog, deliveryStatus, saleVersions] = await Promise.all([
    deliveryConfigurationsApi.getByProduct(productId),
    deliveryFunctionsApi.listAll(),
    productsApi
      .getById(productId)
      .then((product) => product.status)
      .catch(() => null),
    deliveryCatalogStructureApi.listSalePrices(),
  ]);
  return {
    config,
    catalog,
    deliveryStatus,
    salePriceByFunctionId: visibleSalePriceByFunctionId(
      catalog.map((item) => item.id),
      saleVersions,
      canSeeRules,
    ),
  };
}
