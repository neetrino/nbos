import type { StatusVariant } from '@/components/shared';

/** Debounce before documents list search hits the API. */
export const DOCUMENTS_SEARCH_DEBOUNCE_MS = 320;

export const DOCUMENT_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archive',
};

export function documentStatusVariant(status: string): StatusVariant {
  if (status === 'PUBLISHED') return 'emerald';
  if (status === 'ARCHIVED') return 'gray';
  return 'amber';
}
