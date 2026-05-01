import type { Deal } from '@/lib/api/deals';

export type SaveField = (field: string, value: string | number | null) => Promise<void>;
export type SaveMultipleFields = (fields: Record<string, string | null>) => Promise<void>;
export type SearchOption = { value: string; label: string; subtitle?: string };
export type SearchLoader = (query: string) => Promise<SearchOption[]>;

export interface DealSectionProps {
  deal: Deal;
  saveField: SaveField;
}
