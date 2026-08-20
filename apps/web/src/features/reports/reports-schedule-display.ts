import type { ReportSchedule, ReportScheduleRecipientRole } from '@/lib/api/reports';
import { buildReportsViewPath } from './reports-routing';

const RECIPIENT_ROLE_LABELS: Record<ReportScheduleRecipientRole, string> = {
  OWNER: 'Owner',
  CEO: 'CEO',
  SCHEDULE_OWNER: 'Schedule owner',
};

export const DEFAULT_REPORT_SCHEDULE_RECIPIENT_ROLES: ReportScheduleRecipientRole[] = [
  'OWNER',
  'CEO',
];

export const DEFAULT_REPORT_SCHEDULE_TIMEZONE = 'Asia/Yerevan';

export const REPORT_SCHEDULE_WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
] as const;

export const REPORTS_SCHEDULE_FILES_HREF = buildReportsViewPath('EXPORTS');

export function reportScheduleFiltersSummary(
  filters: Record<string, string | number | boolean | null>,
): string {
  const entries = Object.entries(filters).filter(([, value]) => value !== null && value !== '');
  if (entries.length === 0) return 'none';
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(', ');
}

export function reportScheduleRecipientsSummary(schedule: ReportSchedule): string {
  const roles = schedule.recipientRoles ?? [];
  if (roles.length > 0) {
    return roles.map((role) => RECIPIENT_ROLE_LABELS[role] ?? role).join(', ');
  }
  return schedule.recipientEmails.join(', ') || 'No recipients';
}

export function reportScheduleRecurrenceSummary(schedule: ReportSchedule): string {
  if (schedule.frequency === 'DAILY') {
    return `Daily at ${schedule.timeOfDay} (${schedule.timezone})`;
  }
  if (schedule.frequency === 'WEEKLY') {
    const day =
      REPORT_SCHEDULE_WEEKDAYS.find((item) => item.value === schedule.dayOfWeek)?.label ??
      'selected day';
    return `Weekly on ${day} at ${schedule.timeOfDay} (${schedule.timezone})`;
  }
  return `Monthly on day ${schedule.dayOfMonth ?? 1} at ${schedule.timeOfDay} (${schedule.timezone})`;
}
