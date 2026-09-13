'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { tasksApi, type WorkSpace } from '@/lib/api/tasks';

export function WorkSpaceScrumPlanningEnable({
  workspace,
  onUpdated,
}: {
  workspace: WorkSpace;
  onUpdated: (workspace: WorkSpace) => void | Promise<void>;
}) {
  const t = useTranslations('workSpaces');
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
      title={t('scrumEnable.title')}
    >
      <span className="text-xs font-medium">{t('scrumEnable.label')}</span>
      <Switch
        size="sm"
        checked={workspace.scrumEnabled}
        onCheckedChange={(checked) => void handleChange(checked)}
        disabled={saving}
        aria-label={t('scrumEnable.aria')}
      />
    </div>
  );
}
