'use client';

import { QuickCreateTaskDialog } from '@/components/shared';
import type { Task } from '@/lib/api/tasks';

export function InternalCreateTaskFromMessages({
  open,
  creatorId,
  creatorReady,
  defaultLinks,
  selectedCount,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  creatorId: string;
  creatorReady: boolean;
  defaultLinks?: Array<{ entityType: string; entityId: string }>;
  selectedCount: number;
  onOpenChange: (open: boolean) => void;
  onCreated: (task: Task) => void;
}) {
  return (
    <>
      {open ? (
        <p className="sr-only">
          Creating a Task from {selectedCount} selected messages. Title and description stay empty
          until you fill the Task form.
        </p>
      ) : null}
      <QuickCreateTaskDialog
        open={open}
        onOpenChange={onOpenChange}
        creatorId={creatorId}
        creatorReady={creatorReady}
        defaultLinks={defaultLinks}
        onCreated={onCreated}
      />
    </>
  );
}
