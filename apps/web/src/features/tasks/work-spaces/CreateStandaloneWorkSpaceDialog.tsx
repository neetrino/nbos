'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { tasksApi, type WorkSpace } from '@/lib/api/tasks';

interface CreateStandaloneWorkSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (workspace: WorkSpace) => void;
}

export function CreateStandaloneWorkSpaceDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateStandaloneWorkSpaceDialogProps) {
  const t = useTranslations('workSpaces');
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scrumEnabled, setScrumEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setDescription('');
    setScrumEnabled(false);
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const workspace = await tasksApi.createWorkSpace({
        name: name.trim(),
        description: description.trim() || undefined,
        type: 'STANDALONE_OPERATIONAL',
        scrumEnabled,
      });
      onCreated(workspace);
      handleOpenChange(false);
    } catch {
      setError(t('create.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('create.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">{t('create.name')}</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('create.namePlaceholder')}
              onKeyDown={(event) => event.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace-description">{t('create.description')}</Label>
            <Textarea
              id="workspace-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t('create.descriptionPlaceholder')}
              rows={3}
            />
          </div>
          <div className="border-border flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t('create.scrum')}</p>
              <p className="text-muted-foreground text-xs">{t('create.scrumHint')}</p>
            </div>
            <Switch checked={scrumEnabled} onCheckedChange={setScrumEnabled} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving ? tCommon('creating') : t('create.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
