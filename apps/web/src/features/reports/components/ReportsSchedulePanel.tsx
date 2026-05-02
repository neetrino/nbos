'use client';

import { useMemo, useState } from 'react';
import { CalendarClock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  reportsApi,
  type ReportDefinition,
  type ReportSchedule,
  type ReportScheduleFrequency,
} from '@/lib/api/reports';
import { getApiErrorMessage } from '@/lib/api-errors';

const DEFAULT_TIMEZONE = 'Asia/Yerevan';
const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

interface ReportsSchedulePanelProps {
  definitions: ReportDefinition[];
  schedules: ReportSchedule[];
  filters: Record<string, string>;
  onSchedulesChange: (schedules: ReportSchedule[]) => void;
  onRefresh: () => void;
}

export function ReportsSchedulePanel({
  definitions,
  schedules,
  filters,
  onSchedulesChange,
  onRefresh,
}: ReportsSchedulePanelProps) {
  const defaultReportKey = definitions[0]?.key ?? '';
  const [reportKey, setReportKey] = useState(defaultReportKey);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [scheduleLabel, setScheduleLabel] = useState('');
  const [frequency, setFrequency] = useState<ReportScheduleFrequency>('MONTHLY');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedReportKey = reportKey || defaultReportKey;
  const selectedDefinition = definitions.find((definition) => definition.key === selectedReportKey);
  const canSubmit = Boolean(
    selectedReportKey && selectedDefinition && recipientEmail.trim() && scheduleLabel.trim(),
  );

  async function createSchedule() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const schedule = await reportsApi.createSchedule({
        reportKey: selectedReportKey,
        ownerModule: selectedDefinition?.ownerModule,
        format: 'CSV',
        recipientEmails: [recipientEmail.trim()],
        scheduleLabel: scheduleLabel.trim(),
        frequency,
        timezone: DEFAULT_TIMEZONE,
        timeOfDay,
        dayOfWeek: frequency === 'WEEKLY' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      onSchedulesChange([schedule, ...schedules.filter((item) => item.id !== schedule.id)]);
      setRecipientEmail('');
      setScheduleLabel('');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Scheduled report could not be created.'));
    } finally {
      setSubmitting(false);
    }
  }

  const sortedSchedules = useMemo(
    () => [...schedules].sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt)),
    [schedules],
  );

  return (
    <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-xl font-semibold">Scheduled reports</p>
          <p className="text-muted-foreground text-sm">
            Store owner, recipients and simple recurrence for report exports.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            New schedules inherit current report filters: {filtersSummary(filters)}.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="bg-background/50 mt-5 rounded-2xl border p-4">
        <p className="mb-3 font-medium">Create schedule</p>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
          <select
            value={selectedReportKey}
            onChange={(event) => setReportKey(event.target.value)}
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          >
            {definitions.map((definition) => (
              <option key={definition.key} value={definition.key}>
                {definition.title}
              </option>
            ))}
          </select>
          <Input
            type="email"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            placeholder="recipient@example.com"
          />
          <Input
            value={scheduleLabel}
            onChange={(event) => setScheduleLabel(event.target.value)}
            placeholder="Monthly finance packet"
          />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[180px_160px_minmax(0,1fr)]">
          <select
            value={frequency}
            onChange={(event) => setFrequency(event.target.value as ReportScheduleFrequency)}
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          <Input
            type="time"
            value={timeOfDay}
            onChange={(event) => setTimeOfDay(event.target.value)}
          />
          {frequency === 'WEEKLY' ? (
            <select
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(Number(event.target.value))}
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            >
              {WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          ) : null}
          {frequency === 'MONTHLY' ? (
            <div>
              <select
                value={dayOfMonth}
                onChange={(event) => setDayOfMonth(Number(event.target.value))}
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              >
                {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
                  <option key={day} value={day}>
                    Day {day}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground mt-1 text-xs">
                Monthly report schedules use days 1-28 so February and short months are never
                skipped.
              </p>
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => void createSchedule()}
            disabled={!canSubmit || submitting}
          >
            {submitting ? 'Creating...' : 'Create schedule'}
          </Button>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
      </div>

      {sortedSchedules.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
          <CalendarClock className="text-muted-foreground mx-auto h-8 w-8" />
          <p className="mt-3 font-medium">No scheduled reports yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a schedule with explicit recipients and a daily, weekly or monthly recurrence.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {sortedSchedules.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              schedules={schedules}
              onSchedulesChange={onSchedulesChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleRow({
  schedule,
  schedules,
  onSchedulesChange,
}: {
  schedule: ReportSchedule;
  schedules: ReportSchedule[];
  onSchedulesChange: (schedules: ReportSchedule[]) => void;
}) {
  const [busyAction, setBusyAction] = useState<'pause' | 'resume' | 'archive' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: 'pause' | 'resume' | 'archive') {
    setBusyAction(action);
    setError(null);
    try {
      const updated = await updateScheduleStatus(schedule.id, action);
      onSchedulesChange(schedules.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Scheduled report could not be updated.'));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{schedule.reportTitle}</p>
          <p className="text-muted-foreground text-sm">
            {schedule.scheduleLabel} · {schedule.format} · next{' '}
            {new Date(schedule.nextRunAt).toLocaleString()}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">{scheduleSummary(schedule)}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Filters: {filtersSummary(schedule.filters ?? {})}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Recipients: {schedule.recipientEmails.join(', ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium">
            {schedule.status}
          </span>
          {schedule.status === 'ACTIVE' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busyAction !== null}
              onClick={() => void runAction('pause')}
            >
              {busyAction === 'pause' ? 'Pausing...' : 'Pause'}
            </Button>
          ) : null}
          {schedule.status === 'PAUSED' || schedule.status === 'FAILED' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busyAction !== null}
              onClick={() => void runAction('resume')}
            >
              {busyAction === 'resume' ? 'Resuming...' : 'Resume'}
            </Button>
          ) : null}
          {schedule.status !== 'ARCHIVED' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busyAction !== null}
              onClick={() => void runAction('archive')}
            >
              {busyAction === 'archive' ? 'Archiving...' : 'Archive'}
            </Button>
          ) : null}
        </div>
      </div>
      {schedule.failureReason ? (
        <p className="text-destructive mt-2 text-sm">{schedule.failureReason}</p>
      ) : null}
      {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
    </div>
  );
}

function updateScheduleStatus(scheduleId: string, action: 'pause' | 'resume' | 'archive') {
  if (action === 'pause') return reportsApi.pauseSchedule(scheduleId);
  if (action === 'resume') return reportsApi.resumeSchedule(scheduleId);
  return reportsApi.archiveSchedule(scheduleId);
}

function filtersSummary(filters: Record<string, string | number | boolean | null>): string {
  const entries = Object.entries(filters).filter(([, value]) => value !== null && value !== '');
  if (entries.length === 0) return 'none';
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(', ');
}

function scheduleSummary(schedule: ReportSchedule): string {
  if (schedule.frequency === 'DAILY')
    return `Daily at ${schedule.timeOfDay} (${schedule.timezone})`;
  if (schedule.frequency === 'WEEKLY') {
    const day = WEEKDAYS.find((item) => item.value === schedule.dayOfWeek)?.label ?? 'selected day';
    return `Weekly on ${day} at ${schedule.timeOfDay} (${schedule.timezone})`;
  }
  return `Monthly on day ${schedule.dayOfMonth ?? 1} at ${schedule.timeOfDay} (${schedule.timezone})`;
}
