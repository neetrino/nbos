export const REPORT_SCHEDULE_RECIPIENT_ROLES = ['OWNER', 'CEO', 'SCHEDULE_OWNER'] as const;

export type ReportScheduleRecipientRole = (typeof REPORT_SCHEDULE_RECIPIENT_ROLES)[number];

export const REPORT_RECIPIENT_EMPLOYEE_STATUSES = ['ACTIVE', 'PROBATION'] as const;
