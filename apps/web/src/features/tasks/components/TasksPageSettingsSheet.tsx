'use client';

import Link from 'next/link';
import { ArrowLeft, Repeat, TableProperties, Trash2, Workflow } from 'lucide-react';
import type { EntityLifecycleScope } from '@nbos/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export type TasksPageSettingsSheetProps = {
  listScope: EntityLifecycleScope;
  onListScopeChange: (scope: EntityLifecycleScope) => void;
  exportDisabled: boolean;
  onExportScopeStatsCsv: () => void;
};

export function TasksPageSettingsSheet({
  listScope,
  onListScopeChange,
  exportDisabled,
  onExportScopeStatsCsv,
}: TasksPageSettingsSheetProps) {
  const isTrashList = listScope === 'trash';

  return (
    <PageSettingsSheet
      title="Tasks — settings"
      description={
        isTrashList
          ? 'Trash view. Restore tasks from the detail sheet or return to the active list.'
          : 'Exports, related tools, and Trash. Scope stats reflect workspace-wide aggregates.'
      }
      triggerAriaLabel="Tasks settings"
    >
      {isTrashList ? (
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => onListScopeChange('active')}
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Back to active list
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="justify-start gap-2"
          onClick={() => onListScopeChange('trash')}
        >
          <Trash2 className="text-destructive size-4 shrink-0" aria-hidden />
          View Trash
        </Button>
      )}
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
