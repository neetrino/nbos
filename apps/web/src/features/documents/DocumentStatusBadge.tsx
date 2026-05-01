'use client';

import { StatusBadge } from '@/components/shared';
import { DOCUMENT_STATUS_LABEL, documentStatusVariant } from './documents.constants';

export function DocumentStatusBadge({ status }: { status: string }) {
  const label = DOCUMENT_STATUS_LABEL[status] ?? status;
  return <StatusBadge variant={documentStatusVariant(status)} label={label} />;
}
