import { api } from '../api';

export type SearchEntityType =
  | 'lead'
  | 'deal'
  | 'product'
  | 'invoice'
  | 'payment'
  | 'order'
  | 'subscription'
  | 'expense'
  | 'credential';

export type SearchGroupId = 'leads' | 'deals' | 'products' | 'finance' | 'credentials';

export type SearchQueryGroup = SearchGroupId | 'all';

export interface SearchGroupDefinition {
  id: SearchGroupId;
  label: string;
}

export interface SearchHit {
  id: string;
  group: SearchGroupId;
  entityType: SearchEntityType;
  title: string;
  subtitle: string;
  href: string;
  occurredAt: string;
}

export interface GlobalSearchResponse {
  query: string;
  groups: SearchGroupDefinition[];
  items: SearchHit[];
}

export interface GlobalSearchParams {
  q?: string;
  group?: SearchQueryGroup;
  signal?: AbortSignal;
}

export const searchApi = {
  async search(params: GlobalSearchParams): Promise<GlobalSearchResponse> {
    const { signal, ...queryParams } = params;
    const resp = await api.get<GlobalSearchResponse>('/api/search', {
      params: queryParams,
      signal,
    });
    return resp.data;
  },
};
