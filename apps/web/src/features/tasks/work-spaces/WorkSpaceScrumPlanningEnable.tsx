'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { tasksApi, type WorkSpace } from '@/lib/api/tasks';

export function WorkSpaceScrumPlanningEnable({
  workspace,
  onUpdated,
}: {
  workspace: WorkSpace;
  onUpdated: (workspace: WorkSpace) => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (checked: boolean) => {
    if (checked === workspace.scrumEnabled || saving) return;
    setSaving(true);
    try {
      const updated = await tasksApi.updateWorkSpace(workspace.id, { scrumEnabled: checked });
      await onUpdated(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-border bg-muted/20 flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3">
      <div>
        <p className="text-sm font-medium">Scrum planning</p>
        <p className="text-muted-foreground text-xs">
          Backlog, sprint blocks, and drag-and-drop between planning and execution.
        </p>
      </div>
      <Switch
        checked={workspace.scrumEnabled}
        onCheckedChange={(checked) => void handleChange(checked)}
        disabled={saving}
        aria-label="Enable Scrum planning"
      />
    </div>
  );
}
