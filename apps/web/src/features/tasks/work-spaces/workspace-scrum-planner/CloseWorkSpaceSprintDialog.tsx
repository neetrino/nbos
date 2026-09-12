'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  workSpaceSprintsApi,
  type UnfinishedSprintTaskAction,
  type WorkSpaceSprint,
} from '@/lib/api/work-space-sprints';

const UNFINISHED_ACTIONS: UnfinishedSprintTaskAction[] = ['BACKLOG', 'NEXT_SPRINT', 'KEEP'];

function unfinishedActionKey(
  action: UnfinishedSprintTaskAction,
): 'scrum.unfinished.BACKLOG' | 'scrum.unfinished.NEXT_SPRINT' | 'scrum.unfinished.KEEP' {
  if (action === 'NEXT_SPRINT') return 'scrum.unfinished.NEXT_SPRINT';
  if (action === 'KEEP') return 'scrum.unfinished.KEEP';
  return 'scrum.unfinished.BACKLOG';
}

export function CloseWorkSpaceSprintDialog({
  open,
  onOpenChange,
  workspaceId,
  sprint,
  planningSprints,
  onClosed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  sprint: WorkSpaceSprint;
  planningSprints: WorkSpaceSprint[];
  onClosed: (sprint: WorkSpaceSprint) => void;
}) {
  const t = useTranslations('workSpaces');
  const tCommon = useTranslations('common');
  const [action, setAction] = useState<UnfinishedSprintTaskAction>('BACKLOG');
  const [nextSprintId, setNextSprintId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleClose = async () => {
    setSaving(true);
    try {
      const closed = await workSpaceSprintsApi.close(workspaceId, sprint.id, {
        unfinishedTaskAction: action,
        nextSprintId: action === 'NEXT_SPRINT' ? nextSprintId || undefined : undefined,
      });
      onClosed(closed);
      onOpenChange(false);
      toast.success(t('scrum.closed'));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('scrum.closeFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('scrum.closeTitle', { name: sprint.name })}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label>{t('scrum.unfinishedTasks')}</Label>
            <Select
              value={action}
              onValueChange={(value) => {
                if (value) setAction(value as UnfinishedSprintTaskAction);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNFINISHED_ACTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(unfinishedActionKey(value))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {action === 'NEXT_SPRINT' && planningSprints.length > 0 ? (
            <div className="grid gap-2">
              <Label>{t('scrum.targetSprint')}</Label>
              <Select value={nextSprintId} onValueChange={(value) => setNextSprintId(value ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('scrum.selectSprint')} />
                </SelectTrigger>
                <SelectContent>
                  {planningSprints.map((planningSprint) => (
                    <SelectItem key={planningSprint.id} value={planningSprint.id}>
                      {planningSprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {tCommon('cancel')}
          </Button>
          <Button type="button" onClick={() => void handleClose()} disabled={saving}>
            {saving ? t('scrum.closing') : t('scrum.finishSprint')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
