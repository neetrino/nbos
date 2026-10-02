'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const TITLE_MAX_LENGTH = 200;

type VideoMeetingCreateDialogProps = {
  open: boolean;
  creating: boolean;
  suggestedTitle: string;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string) => Promise<void>;
};

export function VideoMeetingCreateDialog({
  open,
  creating,
  suggestedTitle,
  onOpenChange,
  onCreate,
}: VideoMeetingCreateDialogProps) {
  const t = useTranslations('videoMeetings');
  const [title, setTitle] = useState(suggestedTitle);

  const submit = async () => {
    await onCreate(title.trim() || suggestedTitle);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTitle(suggestedTitle);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('titleLabel')}</DialogTitle>
        </DialogHeader>
        <Input
          aria-label={t('titleLabel')}
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <DialogFooter>
          <Button type="button" disabled={creating} onClick={() => void submit()}>
            {creating ? t('actions.creating') : t('actions.createMeeting')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
