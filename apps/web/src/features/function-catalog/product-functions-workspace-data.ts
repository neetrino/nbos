import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { deliveryConfigurationsApi } from '@/lib/api/delivery-configurations';
import { deliveryFunctionsApi } from '@/lib/api/delivery-functions';
import { extensionsApi } from '@/lib/api/extensions';
import { productsApi } from '@/lib/api/products';

export type FunctionsWorkspaceTarget =
  | { kind: 'product'; id: string }
  | { kind: 'extension'; id: string };

export type ProductFunctionsWorkspaceData = {
  config: { mode: string };
  catalog: DeliveryFunctionOperationalDto[];
  deliveryStatus: string | null;
};

export async function loadProductFunctionsWorkspace(
  target: FunctionsWorkspaceTarget,
): Promise<ProductFunctionsWorkspaceData> {
  const [config, catalog, deliveryStatus] = await Promise.all([
    target.kind === 'extension'
      ? deliveryConfigurationsApi.getByExtension(target.id)
      : deliveryConfigurationsApi.getByProduct(target.id),
    deliveryFunctionsApi.listAll(),
    loadDeliveryStatus(target),
  ]);
  return { config, catalog, deliveryStatus };
}

function loadDeliveryStatus(target: FunctionsWorkspaceTarget): Promise<string | null> {
  const request =
    target.kind === 'extension' ? extensionsApi.getById(target.id) : productsApi.getById(target.id);
  return request.then((row) => row.status).catch(() => null);
}
