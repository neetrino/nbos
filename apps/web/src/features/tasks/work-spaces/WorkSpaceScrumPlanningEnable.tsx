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
    <div
      className="border-border bg-muted/20 flex w-fit shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1"
      title="Backlog, sprint blocks, and drag-and-drop between planning and execution."
    >
      <span className="text-xs font-medium">Scrum planning</span>
      <Switch
        size="sm"
        checked={workspace.scrumEnabled}
        onCheckedChange={(checked) => void handleChange(checked)}
        disabled={saving}
        aria-label="Enable Scrum planning"
      />
    </div>
  );
}
