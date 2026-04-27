'use client';

import { AreaChart } from 'lucide-react';
import { ModulePlaceholder } from '@/components/shared';

export default function MarketingDashboardPage() {
  return (
    <ModulePlaceholder
      title="Marketing Dashboard"
      description="Lightweight module analytics for marketing operations, not a replacement for Reports / Analytics."
      emptyTitle="Marketing dashboard is not configured yet"
      emptyDescription="Module analytics will appear here after lead, activity, and spend sources are implemented."
      icon={AreaChart}
    />
  );
}
