'use client';

import { Trash2 } from 'lucide-react';
import { PageHero } from '@/components/shared';
import { PlatformTrashInventoryPanel } from '@/features/settings/components/PlatformTrashInventoryPanel';

export default function TrashInventorySettingsPage() {
  return (
    <div className="space-y-6">
      <PageHero title="Trash inventory" />
      <p className="text-muted-foreground flex items-start gap-2 text-sm">
        <Trash2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        Cross-module overview of recoverable Trash rows and retention purge eligibility. Restore and
        permanent purge actions stay in each module&apos;s own UI.
      </p>
      <PlatformTrashInventoryPanel />
    </div>
  );
}
