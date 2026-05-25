'use client';

import { History } from 'lucide-react';
import { DetailSheetPlaceholderTab } from '@/components/shared';

export function SubscriptionHistoryTab() {
  return (
    <DetailSheetPlaceholderTab
      icon={History}
      title="History coming soon"
      description="Status changes, billing edits, and invoice events for this subscription will appear here."
    />
  );
}
