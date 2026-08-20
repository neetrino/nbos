'use client';

import { PageHero } from '@/components/shared';
import { SchedulerJobsPanel } from '@/features/settings/components/SchedulerJobsPanel';

export default function SchedulerSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHero title="Scheduler" />
      <SchedulerJobsPanel />
    </div>
  );
}
