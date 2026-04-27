'use client';

import { SlidersHorizontal } from 'lucide-react';
import { ModulePlaceholder } from '@/components/shared';

export default function ModuleSettingsPage() {
  return (
    <ModulePlaceholder
      title="Module Settings"
      description="Safe platform-level parameters for modules, without arbitrary business-rule editing."
      emptyTitle="Module settings are not configured yet"
      emptyDescription="This admin section is reserved for safe module defaults such as quiet hours, retention links, and non-critical workflow defaults."
      icon={SlidersHorizontal}
    />
  );
}
