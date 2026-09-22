import { api } from '../api';

const BASE = '/api/delivery-catalog';

export type CoreItemDto = { id: string; position: number; label: string; note: string | null };

export type CoreItemInput = { label: string; note?: string | null };

export type FunctionCollectionDto = {
  id: string;
  productType: string;
  name: string;
  position: number;
  functionIds: string[];
};

export type SalePriceVersionDto = {
  id: string;
  targetKey: string;
  version: number;
  status: string;
  effectiveFrom: string;
  amountPerUnit: string | null;
  resolvedAmount: string | null;
  currency: string;
};

export type SalePriceDraftInput = {
  functionId?: string;
  tierId?: string;
  baseProfileVersionId?: string;
  amountPerUnit: string;
  effectiveFrom: string;
};

/**
 * Core composition, named collections and sale prices. None of these expose cost: a core item is a
 * list of work, a collection is a replace-helper kit, and a sale price is what the client pays.
 */
export const deliveryCatalogStructureApi = {
  async listCoreItems(profileVersionId: string): Promise<CoreItemDto[]> {
    const resp = await api.get<CoreItemDto[]>(
      `${BASE}/base-profiles/${profileVersionId}/core-items`,
    );
    return resp.data;
  },

  async replaceCoreItems(profileVersionId: string, items: CoreItemInput[]): Promise<CoreItemDto[]> {
    const resp = await api.put<CoreItemDto[]>(
      `${BASE}/base-profiles/${profileVersionId}/core-items`,
      { items },
    );
    return resp.data;
  },

  async listCollections(productType?: string): Promise<FunctionCollectionDto[]> {
    const resp = await api.get<FunctionCollectionDto[]>(`${BASE}/collections`, {
      params: productType ? { productType } : undefined,
    });
    return resp.data;
  },

  async createCollection(input: {
    productType: string;
    name: string;
    functionIds: string[];
  }): Promise<FunctionCollectionDto> {
    const resp = await api.post<FunctionCollectionDto>(`${BASE}/collections`, input);
    return resp.data;
  },

  async replaceCollection(
    id: string,
    input: { productType: string; name: string; functionIds: string[] },
  ): Promise<FunctionCollectionDto> {
    const resp = await api.put<FunctionCollectionDto>(`${BASE}/collections/${id}`, input);
    return resp.data;
  },

  async deleteCollection(id: string): Promise<void> {
    await api.delete(`${BASE}/collections/${id}`);
  },

  async listSalePrices(targetKey?: string): Promise<SalePriceVersionDto[]> {
    const resp = await api.get<SalePriceVersionDto[]>(`${BASE}/sale-prices`, {
      params: targetKey ? { targetKey } : undefined,
    });
    return resp.data;
  },

  async createSalePriceDraft(input: SalePriceDraftInput): Promise<SalePriceVersionDto> {
    const resp = await api.post<SalePriceVersionDto>(`${BASE}/sale-prices`, input);
    return resp.data;
  },

  async updateSalePriceDraft(
    id: string,
    input: { amountPerUnit: string },
  ): Promise<SalePriceVersionDto> {
    const resp = await api.patch<SalePriceVersionDto>(`${BASE}/sale-prices/${id}`, input);
    return resp.data;
  },

  async publishSalePrice(id: string): Promise<SalePriceVersionDto> {
    const resp = await api.post<SalePriceVersionDto>(`${BASE}/sale-prices/${id}/publish`, {});
    return resp.data;
  },
};
