'use client';

import { Flame } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS,
  TASK_PRIORITY_FLAME_BUTTON_CLASS,
} from '@/components/shared/quick-create-task/quick-create-task-constants';
import { cn } from '@/lib/utils';
import { recurringTasksApi, type RecurringTaskTemplate } from '@/lib/api/recurring-tasks';

const RECURRING_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;

interface CreateRecurringTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  onCreated?: (template: RecurringTaskTemplate) => void;
}

export function CreateRecurringTaskDialog({
  open,
  onOpenChange,
  creatorId,
  onCreated,
}: CreateRecurringTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<string>('WEEKLY');
  const [interval, setInterval] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
  }, [open]);

  const reset = () => {
    setTitle('');
    setFrequency('WEEKLY');
    setInterval('1');
    setIsUrgent(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !creatorId || !startDate) return;
    const intervalNum = Number.parseInt(interval, 10);
    if (!Number.isFinite(intervalNum) || intervalNum < 1) {
      toast.error('Interval must be at least 1.');
      return;
    }
    setSaving(true);
    try {
      const template = await recurringTasksApi.create({
        title: title.trim(),
        creatorId,
        frequency,
        interval: intervalNum,
        startDate: new Date(startDate).toISOString(),
        priority: isUrgent ? 'HIGH' : 'NORMAL',
      });
      onCreated?.(template);
      reset();
      onOpenChange(false);
      toast.success('Recurring template created.');
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Template could not be created.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New recurring template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="recurring-title">Title</Label>
            <div className="relative pr-10">
              <Input
                id="recurring-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly subscription check"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn(
                  TASK_PRIORITY_FLAME_BUTTON_CLASS,
                  'absolute top-1/2 right-0 -translate-y-1/2',
                  isUrgent && TASK_PRIORITY_FLAME_BUTTON_ACTIVE_CLASS,
                )}
                aria-pressed={isUrgent}
                aria-label={isUrgent ? 'Urgent' : 'Mark as urgent'}
                title={isUrgent ? 'Urgent' : 'Mark as urgent'}
                onClick={() => setIsUrgent((current) => !current)}
              >
                <Flame size={20} strokeWidth={1.75} aria-hidden />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(value) => {
                  if (value) setFrequency(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recurring-interval">Every (interval)</Label>
              <Input
                id="recurring-interval"
                type="number"
                min={1}
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recurring-start">Start date</Label>
            <NbosDatePicker
              id="recurring-start"
              value={startDate}
              onChange={setStartDate}
              aria-label="Start date"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving || !title.trim()}
          >
            {saving ? 'Creating…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
