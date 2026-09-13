'use client';

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
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface SupportTicketCreateExecutionTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meId: string | null;
  busy: boolean;
  title: string;
  description: string;
  dueDate: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onSubmit: () => void;
}

export function SupportTicketCreateExecutionTaskDialog({
  open,
  onOpenChange,
  meId,
  busy,
  title,
  description,
  dueDate,
  onTitleChange,
  onDescriptionChange,
  onDueDateChange,
  onSubmit,
}: SupportTicketCreateExecutionTaskDialogProps) {
  const t = useTranslations('support');
  const tCommon = useTranslations('common');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>{t('sheet.taskDialogTitle')}</DialogTitle>
          <DialogDescription>{t('sheet.taskDialogDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="st-task-title">{t('sheet.taskTitleOptional')}</Label>
            <Input
              id="st-task-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t('sheet.taskTitlePlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="st-task-desc">{t('sheet.taskDescriptionOptional')}</Label>
            <Textarea
              id="st-task-desc"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="resize-y"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="st-task-due">{t('sheet.taskDueOptional')}</Label>
            <NbosDatePicker
              id="st-task-due"
              mode="datetime"
              variant="extended"
              value={dueDate}
              onChange={onDueDateChange}
              clearable
              aria-label={t('sheet.taskDueAria')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button type="button" disabled={busy || !meId} onClick={onSubmit}>
            {t('sheet.createTask')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
