'use client';

import { Timer } from 'lucide-react';
import { PageHero } from '@/components/shared';
import { SchedulerJobsPanel } from '@/features/settings/components/SchedulerJobsPanel';

export default function SchedulerSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHero title="Scheduler" />
      <p className="text-muted-foreground flex items-start gap-2 text-sm">
        <Timer className="mt-0.5 size-4 shrink-0" aria-hidden />
        Platform cron and time jobs that run without a person. Enable/disable from Settings comes in
        a later slice; today this list is read-only. Timezone defaults to Asia/Yerevan.
      </p>
      <SchedulerJobsPanel />
    </div>
  );
}
