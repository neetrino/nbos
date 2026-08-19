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

export type FinanceSearchSubtype = 'invoice' | 'payment' | 'order' | 'subscription' | 'expense';

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
