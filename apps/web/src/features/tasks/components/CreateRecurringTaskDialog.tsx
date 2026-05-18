'use client';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api-errors';
import { recurringTasksApi, type RecurringTaskTemplate } from '@/lib/api/recurring-tasks';
import { TASK_PRIORITIES } from '../constants/tasks';

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
  const [priority, setPriority] = useState('NORMAL');
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
    setPriority('NORMAL');
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
        priority,
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
            <Input
              id="recurring-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly subscription check"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="recurring-start">Start date</Label>
              <Input
                id="recurring-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
