'use client';

import { SlidersHorizontal } from 'lucide-react';
import { ModulePlaceholder } from '@/components/shared';

export default function MarketingSettingsPage() {
  return (
    <ModulePlaceholder
      title="Marketing Settings"
      description="Safe marketing module settings for channels and attribution defaults."
      emptyTitle="Marketing settings are not configured yet"
      emptyDescription="Only safe module parameters belong here. Business logic and report formulas will stay code-controlled until explicitly designed."
      icon={SlidersHorizontal}
    />
  );
}
