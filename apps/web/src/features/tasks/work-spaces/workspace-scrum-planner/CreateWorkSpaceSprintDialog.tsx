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
import { Input } from '@/components/ui/input';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api-errors';
import { workSpaceSprintsApi, type WorkSpaceSprint } from '@/lib/api/work-space-sprints';

export function CreateWorkSpaceSprintDialog({
  open,
  onOpenChange,
  workspaceId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onCreated: (sprint: WorkSpaceSprint) => void;
}) {
  const t = useTranslations('workSpaces');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const sprint = await workSpaceSprintsApi.create(workspaceId, {
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      onCreated(sprint);
      setName('');
      setGoal('');
      setStartDate('');
      setEndDate('');
      onOpenChange(false);
      toast.success(t('scrum.created'));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('scrum.createFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('scrum.createTitle')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor="sprint-name">{t('scrum.name')}</Label>
            <Input
              id="sprint-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('scrum.namePlaceholder')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sprint-goal">{t('scrum.goal')}</Label>
            <Input
              id="sprint-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t('scrum.goalPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sprint-start">{t('scrum.startDate')}</Label>
              <NbosDatePicker
                id="sprint-start"
                value={startDate}
                onChange={setStartDate}
                aria-label={t('scrum.startDateAria')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sprint-end">{t('scrum.endDate')}</Label>
              <NbosDatePicker
                id="sprint-end"
                value={endDate}
                onChange={setEndDate}
                aria-label={t('scrum.endDateAria')}
              />
            </div>
          </div>
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
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving || !name.trim()}
          >
            {saving ? tCommon('creating') : tCommon('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
