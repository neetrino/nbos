'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  calendarApi,
  parseCalendarMeetingConflicts,
  type CalendarMeetingConflictPayload,
} from '@/lib/api/calendar';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toDatetimeLocalValue } from './calendar-datetime-helpers';

const MEETING_TYPES: Array<{ value: string; label: string }> = [
  { value: 'SALES_CALL', label: 'Sales call' },
  { value: 'OFFER_PRESENTATION', label: 'Offer presentation' },
  { value: 'DEMO', label: 'Demo' },
  { value: 'KICKOFF', label: 'Kickoff / handoff' },
  { value: 'SUPPORT_CALL', label: 'Support call' },
  { value: 'MAINTENANCE_CALL', label: 'Maintenance call' },
  { value: 'OTHER', label: 'Other' },
];

const LOCATION_TYPES: Array<{ value: string; label: string }> = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline' },
];

function meetingDefaults(selectedDate: Date) {
  return {
    title: '',
    startsLocal: toDatetimeLocalValue(selectedDate, 9, 0),
    endsLocal: toDatetimeLocalValue(selectedDate, 10, 0),
    meetingType: 'SALES_CALL',
    locationType: 'ONLINE',
    locationOrLink: '',
    agenda: '',
  };
}

export interface CreateMeetingCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onCreated: () => void;
}

export function CreateMeetingCalendarDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreated,
}: CreateMeetingCalendarDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<CalendarMeetingConflictPayload[] | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [form, setForm] = useState(() => meetingDefaults(selectedDate));

  useEffect(() => {
    if (!open) return;
    setForm(meetingDefaults(selectedDate));
    setFormError(null);
    setConflicts(null);
    setOverrideReason('');
  }, [open, selectedDate]);

  useEffect(() => {
    setConflicts(null);
    setOverrideReason('');
  }, [form.startsLocal, form.endsLocal]);

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
      await calendarApi.createMeeting({
        title,
        startsAt,
        endsAt,
        meetingType: form.meetingType,
        locationType: form.locationType,
        locationOrLink: form.locationOrLink.trim() || null,
        agenda: form.agenda.trim() || null,
        ...(conflicts?.length && overrideReason.trim()
          ? { conflictOverrideReason: overrideReason.trim() }
          : {}),
      });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      const parsed = parseCalendarMeetingConflicts(err);
      if (parsed?.length) {
        setConflicts(parsed);
        setFormError('This slot overlaps another meeting. Add a reason to schedule anyway.');
        return;
      }
      setFormError(getApiErrorMessage(err, 'Could not create meeting'));
    } finally {
      setLoading(false);
    }
  }, [form, conflicts, overrideReason, onOpenChange, onCreated]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New client meeting</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          {conflicts?.length ? (
            <div className="bg-secondary/60 space-y-2 rounded-xl border p-3 text-sm">
              <p className="text-foreground font-medium">Conflicts</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1">
                {conflicts.map((c) => (
                  <li key={`${c.code}-${c.meetingId}`}>
                    <span className="text-foreground">{c.meetingTitle}</span> — {c.detail}
                  </li>
                ))}
              </ul>
              <div>
                <Label htmlFor="cal-meet-override">Override reason</Label>
                <Textarea
                  id="cal-meet-override"
                  className="mt-1.5"
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Why schedule despite overlap?"
                />
              </div>
            </div>
          ) : null}

          <div>
            <Label htmlFor="cal-meet-title">Title *</Label>
            <Input
              id="cal-meet-title"
              className="mt-1.5"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Discovery with Acme"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="cal-meet-start">Start *</Label>
              <Input
                id="cal-meet-start"
                type="datetime-local"
                className="mt-1.5"
                value={form.startsLocal}
                onChange={(e) => setForm((p) => ({ ...p, startsLocal: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="cal-meet-end">End *</Label>
              <Input
                id="cal-meet-end"
                type="datetime-local"
                className="mt-1.5"
                value={form.endsLocal}
                onChange={(e) => setForm((p) => ({ ...p, endsLocal: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Meeting type</Label>
              <Select
                value={form.meetingType}
                onValueChange={(v) => {
                  if (v) setForm((p) => ({ ...p, meetingType: v }));
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Select
                value={form.locationType}
                onValueChange={(v) => {
                  if (v) setForm((p) => ({ ...p, locationType: v }));
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="cal-meet-link">Link or address</Label>
            <Input
              id="cal-meet-link"
              className="mt-1.5"
              value={form.locationOrLink}
              onChange={(e) => setForm((p) => ({ ...p, locationOrLink: e.target.value }))}
              placeholder="Meet link or street address"
            />
          </div>

          <div>
            <Label htmlFor="cal-meet-agenda">Agenda</Label>
            <Textarea
              id="cal-meet-agenda"
              className="mt-1.5"
              rows={2}
              value={form.agenda}
              onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))}
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
            disabled={
              loading || Boolean(conflicts?.length && !overrideReason.trim()) || !form.title.trim()
            }
          >
            {loading ? 'Saving…' : conflicts?.length ? 'Schedule anyway' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
