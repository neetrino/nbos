import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { deliveryNormsApi } from '@/lib/api/delivery-norms';

export async function publishCoreSheetDrafts(input: {
  profileDraftId: string | null;
  saleDraftId: string | null;
  confirmZeroUnits: boolean;
}): Promise<void> {
  if (input.profileDraftId) {
    await deliveryNormsApi.publishBaseProfile(input.profileDraftId, {
      confirmZeroUnits: input.confirmZeroUnits,
    });
  }
  if (input.saleDraftId) {
    await deliveryCatalogStructureApi.publishSalePrice(input.saleDraftId);
  }
}

export async function publishFunctionSheetDrafts(input: {
  priceDraftId: string | null;
  saleDraftId: string | null;
  confirmZeroUnits: boolean;
}): Promise<void> {
  if (input.priceDraftId) {
    await deliveryNormsApi.publishFunctionPrice(input.priceDraftId, {
      confirmZeroUnits: input.confirmZeroUnits,
    });
  }
  if (input.saleDraftId) {
    await deliveryCatalogStructureApi.publishSalePrice(input.saleDraftId);
  }
}
