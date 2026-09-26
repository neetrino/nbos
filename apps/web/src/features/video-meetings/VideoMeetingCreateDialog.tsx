'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TITLE_MAX_LENGTH = 200;

type VideoMeetingCreateDialogProps = {
  open: boolean;
  creating: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string) => Promise<void>;
};

export function VideoMeetingCreateDialog({
  open,
  creating,
  onOpenChange,
  onCreate,
}: VideoMeetingCreateDialogProps) {
  const t = useTranslations('videoMeetings');
  const [title, setTitle] = useState(t('defaultTitle'));

  const resetTitle = () => setTitle(t('defaultTitle'));

  const submit = async () => {
    const next = title.trim() || t('defaultTitle');
    await onCreate(next);
    resetTitle();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetTitle();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('actions.newMeeting')}</DialogTitle>
          <DialogDescription>{t('titleHint')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="video-meeting-create-title">{t('titleLabel')}</Label>
          <Input
            id="video-meeting-create-title"
            value={title}
            maxLength={TITLE_MAX_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" disabled={creating} onClick={() => void submit()}>
            {creating ? t('actions.creating') : t('actions.createMeeting')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
