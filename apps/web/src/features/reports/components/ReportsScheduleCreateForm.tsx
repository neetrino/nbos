'use client';

import { useState } from 'react';
import { NbosTimePicker } from '@/components/shared/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  reportsApi,
  type ReportDefinition,
  type ReportExportFormat,
  type ReportSchedule,
  type ReportScheduleFrequency,
  type ReportScheduleRecipientRole,
} from '@/lib/api/reports';
import {
  DEFAULT_REPORT_SCHEDULE_RECIPIENT_ROLES,
  DEFAULT_REPORT_SCHEDULE_TIMEZONE,
  REPORT_SCHEDULE_WEEKDAYS,
  reportScheduleFiltersSummary,
} from '../reports-schedule-display';
import { ReportsScheduleRecipientPicker } from './ReportsScheduleRecipientPicker';

const REPORT_SCHEDULE_FORMATS: ReportExportFormat[] = ['CSV', 'XLSX', 'PDF'];
const MONTH_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

interface ReportsScheduleCreateFormProps {
  definitions: ReportDefinition[];
  schedules: ReportSchedule[];
  filters: Record<string, string>;
  onSchedulesChange: (schedules: ReportSchedule[]) => void;
}

export function ReportsScheduleCreateForm({
  definitions,
  schedules,
  filters,
  onSchedulesChange,
}: ReportsScheduleCreateFormProps) {
  const defaultReportKey = definitions[0]?.key ?? '';
  const [reportKey, setReportKey] = useState(defaultReportKey);
  const [format, setFormat] = useState<ReportExportFormat>('CSV');
  const [recipientRoles, setRecipientRoles] = useState<ReportScheduleRecipientRole[]>([
    ...DEFAULT_REPORT_SCHEDULE_RECIPIENT_ROLES,
  ]);
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
    selectedReportKey && selectedDefinition && recipientRoles.length > 0 && scheduleLabel.trim(),
  );

  async function createSchedule() {
    if (!canSubmit || !selectedDefinition) return;
    setSubmitting(true);
    setError(null);
    try {
      const schedule = await reportsApi.createSchedule({
        reportKey: selectedReportKey,
        ownerModule: selectedDefinition.ownerModule,
        format,
        recipientRoles,
        scheduleLabel: scheduleLabel.trim(),
        frequency,
        timezone: DEFAULT_REPORT_SCHEDULE_TIMEZONE,
        timeOfDay,
        dayOfWeek: frequency === 'WEEKLY' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      onSchedulesChange([schedule, ...schedules.filter((item) => item.id !== schedule.id)]);
      setRecipientRoles([...DEFAULT_REPORT_SCHEDULE_RECIPIENT_ROLES]);
      setScheduleLabel('');
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Scheduled report could not be created.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background/50 mt-5 rounded-2xl border p-4">
      <p className="mb-1 font-medium">Create schedule</p>
      <p className="text-muted-foreground mb-3 text-xs">
        Uses current report dates: {reportScheduleFiltersSummary(filters)}. The file is stored in
        Report files and emailed to Owner and CEO when those roles are selected.
      </p>
      <div className="grid gap-3 lg:grid-cols-[1fr_140px_1fr]">
        <Select
          value={selectedReportKey}
          onValueChange={(value) => {
            if (value) setReportKey(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Report" />
          </SelectTrigger>
          <SelectContent>
            {definitions.map((definition) => (
              <SelectItem key={definition.key} value={definition.key}>
                {definition.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={format}
          onValueChange={(value) => {
            if (value) setFormat(value as ReportExportFormat);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_SCHEDULE_FORMATS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={scheduleLabel}
          onChange={(event) => setScheduleLabel(event.target.value)}
          placeholder="Monthly finance packet"
        />
      </div>
      <div className="mt-3">
        <ReportsScheduleRecipientPicker value={recipientRoles} onChange={setRecipientRoles} />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[180px_160px_minmax(0,1fr)]">
        <Select
          value={frequency}
          onValueChange={(value) => {
            if (value) setFrequency(value as ReportScheduleFrequency);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DAILY">Daily</SelectItem>
            <SelectItem value="WEEKLY">Weekly</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
          </SelectContent>
        </Select>
        <NbosTimePicker value={timeOfDay} onChange={setTimeOfDay} />
        {frequency === 'WEEKLY' ? (
          <Select
            value={String(dayOfWeek)}
            onValueChange={(value) => {
              if (value) setDayOfWeek(Number(value));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Weekday" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_SCHEDULE_WEEKDAYS.map((day) => (
                <SelectItem key={day.value} value={String(day.value)}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        {frequency === 'MONTHLY' ? (
          <div>
            <Select
              value={String(dayOfMonth)}
              onValueChange={(value) => {
                if (value) setDayOfMonth(Number(value));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Day of month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_DAYS.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    Day {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">
              Days 1–28, so short months are not skipped.
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
  );
}
