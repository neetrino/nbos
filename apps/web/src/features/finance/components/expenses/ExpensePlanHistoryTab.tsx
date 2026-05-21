'use client';

import { History } from 'lucide-react';
import { DetailSheetPlaceholderTab } from '@/components/shared';

export function ExpensePlanHistoryTab() {
  return (
    <DetailSheetPlaceholderTab
      icon={History}
      title="History coming soon"
      description="Plan edits, generated cards, and auto-generate runs will be listed here."
    />
  );
}
