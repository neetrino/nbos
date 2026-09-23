import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { api } from '../api';

export type FunctionCatalogListResponse = {
  items: DeliveryFunctionOperationalDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    categoryCounts?: Record<string, number>;
  };
};

export type DeliveryRoleRateRow = {
  id: string;
  roleKey: string;
  currency: string;
  rate: string;
  version: number;
  status: string;
};

export type DeliveryFunctionPriceRow = {
  id: string;
  functionId: string;
  version: number;
  status: string;
  roleUnits: Array<{ roleKey: string; unitKind: string; units: string | null }>;
};

const CATALOG_FETCH_PAGE_SIZE = 100;
const CATALOG_FETCH_MAX_PAGES = 20;

export const deliveryFunctionsApi = {
  async list(params?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<FunctionCatalogListResponse> {
    const resp = await api.get<FunctionCatalogListResponse>('/api/delivery-functions', {
      params,
    });
    return resp.data;
  },

  async listAll(params?: {
    search?: string;
    category?: string;
    status?: string;
  }): Promise<DeliveryFunctionOperationalDto[]> {
    const items: DeliveryFunctionOperationalDto[] = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;
    while (items.length < total && page <= CATALOG_FETCH_MAX_PAGES) {
      const result = await deliveryFunctionsApi.list({
        search: params?.search,
        category: params?.category,
        status: params?.status,
        page,
        pageSize: CATALOG_FETCH_PAGE_SIZE,
      });
      items.push(...result.items);
      total = result.meta.total;
      if (result.items.length === 0) {
        break;
      }
      page += 1;
    }
    return items;
  },

  async get(id: string): Promise<DeliveryFunctionOperationalDto> {
    const resp = await api.get<DeliveryFunctionOperationalDto>(`/api/delivery-functions/${id}`);
    return resp.data;
  },

  async createDraft(body: {
    code: string;
    category: string;
    iconKey: string;
    title: string;
    summary: string;
    scopeBoundaries: string;
    instructions: string;
    acceptanceCriteria: string;
  }): Promise<DeliveryFunctionOperationalDto> {
    const resp = await api.post<DeliveryFunctionOperationalDto>('/api/delivery-functions', body);
    return resp.data;
  },

  async listRoleRates(): Promise<DeliveryRoleRateRow[]> {
    const resp = await api.get<DeliveryRoleRateRow[]>(
      '/api/delivery-compensation/rules/role-rates',
    );
    return resp.data;
  },

  async listFunctionPrices(): Promise<DeliveryFunctionPriceRow[]> {
    const resp = await api.get<DeliveryFunctionPriceRow[]>(
      '/api/delivery-compensation/rules/function-prices',
    );
    return resp.data;
  },
};
