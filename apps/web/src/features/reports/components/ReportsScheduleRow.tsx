'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { reportsApi, type ReportSchedule } from '@/lib/api/reports';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  reportScheduleFiltersSummary,
  reportScheduleRecipientsSummary,
  reportScheduleRecurrenceSummary,
} from '../reports-schedule-display';

type ScheduleStatusAction = 'pause' | 'resume' | 'archive';

interface ReportsScheduleRowProps {
  schedule: ReportSchedule;
  schedules: ReportSchedule[];
  onSchedulesChange: (schedules: ReportSchedule[]) => void;
  onGenerateNow: (schedule: ReportSchedule) => void;
  generatingNow: boolean;
}

export function ReportsScheduleRow({
  schedule,
  schedules,
  onSchedulesChange,
  onGenerateNow,
  generatingNow,
}: ReportsScheduleRowProps) {
  const [busyAction, setBusyAction] = useState<ScheduleStatusAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = busyAction !== null || generatingNow;

  async function runAction(action: ScheduleStatusAction) {
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
          <p className="text-muted-foreground mt-1 text-sm">
            {reportScheduleRecurrenceSummary(schedule)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Dates: {reportScheduleFiltersSummary(schedule.filters ?? {})}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Email: {reportScheduleRecipientsSummary(schedule)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-muted rounded-full px-2.5 py-1 text-xs font-medium">
            {schedule.status}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={busy || schedule.status === 'ARCHIVED'}
            onClick={() => onGenerateNow(schedule)}
          >
            {generatingNow ? 'Creating...' : 'Create file now'}
          </Button>
          {schedule.status === 'ACTIVE' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
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
              disabled={busy}
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
              disabled={busy}
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

function updateScheduleStatus(scheduleId: string, action: ScheduleStatusAction) {
  if (action === 'pause') return reportsApi.pauseSchedule(scheduleId);
  if (action === 'resume') return reportsApi.resumeSchedule(scheduleId);
  return reportsApi.archiveSchedule(scheduleId);
}
