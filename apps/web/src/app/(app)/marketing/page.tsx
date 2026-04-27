'use client';

import { Megaphone } from 'lucide-react';
import { ModulePlaceholder } from '@/components/shared';

export default function MarketingPage() {
  return (
    <ModulePlaceholder
      title="Marketing"
      description="Demand generation workspace for marketing board, attribution review, channel performance, and CRM source quality."
      emptyTitle="Marketing board is not configured yet"
      emptyDescription="Marketing is exposed as its own module now, but operational workflows will be implemented in the CRM and Marketing phase."
      icon={Megaphone}
    />
  );
}
