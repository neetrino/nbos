'use client';

import { History } from 'lucide-react';
import { DetailSheetPlaceholderTab } from '@/components/shared';

export function LeadHistoryTab() {
  return (
    <DetailSheetPlaceholderTab
      icon={History}
      title="History coming soon"
      description="Stage changes and other audit events for this lead will be listed here."
    />
  );
}
