'use client';

import Link from 'next/link';
import { Repeat, TableProperties, Workflow } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export type TasksPageSettingsSheetProps = {
  exportDisabled: boolean;
  onExportScopeStatsCsv: () => void;
};

export function TasksPageSettingsSheet({
  exportDisabled,
  onExportScopeStatsCsv,
}: TasksPageSettingsSheetProps) {
  return (
    <PageSettingsSheet
      title="Tasks — settings"
      description="Exports and related task tools. Scope stats reflect workspace-wide aggregates; they do not apply current list filters."
      triggerAriaLabel="Tasks settings"
    >
      <Link
        href="/tasks/recurring"
        className={buttonVariants({ variant: 'outline', className: 'justify-start gap-2' })}
      >
        <Repeat className="size-4 shrink-0" aria-hidden />
        Recurring tasks
      </Link>
      <Link
        href="/tasks/automation"
        className={buttonVariants({ variant: 'outline', className: 'justify-start gap-2' })}
      >
        <Workflow className="size-4 shrink-0" aria-hidden />
        Automation
      </Link>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={exportDisabled}
        onClick={() => onExportScopeStatsCsv()}
      >
        <TableProperties className="size-4 shrink-0" aria-hidden />
        Export scope stats (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
