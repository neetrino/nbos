'use client';

import { BarChart3 } from 'lucide-react';
import { ModulePlaceholder } from '@/components/shared';

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports / Analytics"
      description="Read-only catalog for cross-module reports, exports, scheduled reports, saved views, and data-quality warnings."
      emptyTitle="Report catalog is not configured yet"
      emptyDescription="Reports will read from module-owned business definitions. Until reliable source data exists, NBOS shows this honest empty state instead of fake analytics."
      icon={BarChart3}
    />
  );
}
