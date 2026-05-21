'use client';

import { useCallback, useEffect, useState } from 'react';
import { calendarApi } from '@/lib/api/calendar';
import { getApiErrorMessage } from '@/lib/api-errors';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toDatetimeLocalValue } from './calendar-datetime-helpers';

function personalDefaults(selectedDate: Date) {
  return {
    title: '',
    startsLocal: toDatetimeLocalValue(selectedDate, 9, 0),
    endsLocal: toDatetimeLocalValue(selectedDate, 10, 0),
    notes: '',
  };
}

export interface CreatePersonalCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onCreated: () => void;
}

export function CreatePersonalCalendarDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreated,
}: CreatePersonalCalendarDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(() => personalDefaults(selectedDate));

  useEffect(() => {
    if (!open) return;
    setForm(personalDefaults(selectedDate));
    setFormError(null);
  }, [open, selectedDate]);

  const submit = useCallback(async () => {
    const title = form.title.trim();
    if (!title) {
      setFormError('Title is required.');
      return;
    }
    const startsAt = new Date(form.startsLocal).toISOString();
    const endsAt = new Date(form.endsLocal).toISOString();
    if (new Date(endsAt) <= new Date(startsAt)) {
      setFormError('End time must be after start time.');
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      await calendarApi.createPersonalEvent({
        title,
        startsAt,
        endsAt,
        notes: form.notes.trim() || null,
      });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not create personal event'));
    } finally {
      setLoading(false);
    }
  }, [form, onOpenChange, onCreated]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Personal reminder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          <div>
            <Label htmlFor="cal-per-title">Title *</Label>
            <Input
              id="cal-per-title"
              className="mt-1.5"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Focus block"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="cal-per-start">Start *</Label>
              <NbosDatePicker
                id="cal-per-start"
                mode="datetime"
                variant="extended"
                className="mt-1.5"
                value={form.startsLocal}
                onChange={(startsLocal) => setForm((p) => ({ ...p, startsLocal }))}
                aria-label="Reminder start"
              />
            </div>
            <div>
              <Label htmlFor="cal-per-end">End *</Label>
              <NbosDatePicker
                id="cal-per-end"
                mode="datetime"
                variant="extended"
                className="mt-1.5"
                value={form.endsLocal}
                onChange={(endsLocal) => setForm((p) => ({ ...p, endsLocal }))}
                aria-label="Reminder end"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cal-per-notes">Notes</Label>
            <Textarea
              id="cal-per-notes"
              className="mt-1.5"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={loading || !form.title.trim()}
          >
            {loading ? 'Saving…' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
