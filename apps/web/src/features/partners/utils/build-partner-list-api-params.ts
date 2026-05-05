import type { PartnerListParams } from '@/lib/api/partners';

export interface BuildPartnerListApiParamsInput {
  search: string;
  filters: Record<string, string>;
}

/**
 * Query shape for `GET /api/partners` (excluding paging).
 * Shared by the partners page fetch and CSV export paging.
 */
export function buildPartnerListApiParams(
  input: BuildPartnerListApiParamsInput,
): Omit<PartnerListParams, 'page' | 'pageSize'> {
  return {
    search: input.search || undefined,
    status:
      input.filters.status && input.filters.status !== 'all' ? input.filters.status : undefined,
    level: input.filters.level && input.filters.level !== 'all' ? input.filters.level : undefined,
    direction:
      input.filters.direction && input.filters.direction !== 'all'
        ? input.filters.direction
        : undefined,
  };
}
