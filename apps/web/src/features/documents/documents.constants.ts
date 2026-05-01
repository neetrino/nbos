import type { StatusVariant } from '@/components/shared';

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
