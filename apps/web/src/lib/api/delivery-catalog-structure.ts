import { api } from '../api';

const BASE = '/api/delivery-catalog';

export type CoreItemDto = { id: string; position: number; label: string; note: string | null };

export type CoreItemInput = { label: string; note?: string | null };

export type SizePresetDto = { profileKey: string; configSize: string; functionIds: string[] };

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
 * Core composition, size presets and sale prices. None of these expose cost: a core item is a list of
 * work, a preset is a list of modules, and a sale price is what the client pays.
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

  async listSizePresets(profileKey: string): Promise<SizePresetDto[]> {
    const resp = await api.get<SizePresetDto[]>(`${BASE}/size-presets`, { params: { profileKey } });
    return resp.data;
  },

  async replaceSizePreset(input: SizePresetDto): Promise<SizePresetDto> {
    const resp = await api.put<SizePresetDto>(`${BASE}/size-presets`, input);
    return resp.data;
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

  async publishSalePrice(id: string): Promise<SalePriceVersionDto> {
    const resp = await api.post<SalePriceVersionDto>(`${BASE}/sale-prices/${id}/publish`, {});
    return resp.data;
  },

  async getDefaultUnitPrice(): Promise<{ defaultSaleAmountPerUnit: string }> {
    const resp = await api.get<{ defaultSaleAmountPerUnit: string }>(
      `${BASE}/sale-prices/default-unit-price`,
    );
    return resp.data;
  },

  async setDefaultUnitPrice(amountPerUnit: string): Promise<{ defaultSaleAmountPerUnit: string }> {
    const resp = await api.post<{ defaultSaleAmountPerUnit: string }>(
      `${BASE}/sale-prices/default-unit-price`,
      { amountPerUnit },
    );
    return resp.data;
  },
};
