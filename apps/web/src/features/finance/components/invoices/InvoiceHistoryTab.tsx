'use client';

import { History } from 'lucide-react';
import { DetailSheetPlaceholderTab } from '@/components/shared';

export function InvoiceHistoryTab() {
  return (
    <DetailSheetPlaceholderTab
      icon={History}
      title="History coming soon"
      description="Money status changes, payments, and official invoice actions will be listed here."
    />
  );
}
