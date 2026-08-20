'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CalendarClock, RefreshCw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import type { ReportDefinition, ReportSchedule } from '@/lib/api/reports';
import { REPORTS_SCHEDULE_FILES_HREF } from '../reports-schedule-display';
import { ReportsScheduleCreateForm } from './ReportsScheduleCreateForm';
import { ReportsScheduleRow } from './ReportsScheduleRow';

interface ReportsSchedulePanelProps {
  definitions: ReportDefinition[];
  schedules: ReportSchedule[];
  filters: Record<string, string>;
  onSchedulesChange: (schedules: ReportSchedule[]) => void;
  onRefresh: () => void;
  onGenerateNow: (schedule: ReportSchedule) => void;
  generatingScheduleId: string | null;
}

export function ReportsSchedulePanel({
  definitions,
  schedules,
  filters,
  onSchedulesChange,
  onRefresh,
  onGenerateNow,
  generatingScheduleId,
}: ReportsSchedulePanelProps) {
  const sortedSchedules = useMemo(
    () => [...schedules].sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt)),
    [schedules],
  );

  return (
    <div className="border-border bg-card rounded-2xl border p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-xl font-semibold">Scheduled reports</p>
          <p className="text-muted-foreground text-sm">
            Daily, weekly or monthly. At the planned time the file is created, stored in Report
            files, and emailed to the selected Owner and CEO.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={REPORTS_SCHEDULE_FILES_HREF}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Report files
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <ReportsScheduleCreateForm
        definitions={definitions}
        schedules={schedules}
        filters={filters}
        onSchedulesChange={onSchedulesChange}
      />

      {sortedSchedules.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
          <CalendarClock className="text-muted-foreground mx-auto h-8 w-8" />
          <p className="mt-3 font-medium">No scheduled reports yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a monthly, weekly or daily plan. The file appears in Report files when it is due.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {sortedSchedules.map((schedule) => (
            <ReportsScheduleRow
              key={schedule.id}
              schedule={schedule}
              schedules={schedules}
              onSchedulesChange={onSchedulesChange}
              onGenerateNow={onGenerateNow}
              generatingNow={generatingScheduleId === schedule.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
