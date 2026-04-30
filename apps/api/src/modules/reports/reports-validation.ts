import { BadRequestException } from '@nestjs/common';
import type { InputJsonValue } from '@nbos/database';
import {
  assertReportScheduleRecurrence,
  calculateNextReportScheduleRun,
  DEFAULT_REPORT_SCHEDULE_TIMEZONE,
  DEFAULT_REPORT_SCHEDULE_TIME_OF_DAY,
  REPORT_SCHEDULE_FREQUENCIES,
} from './reports-schedule-recurrence';
import {
  REPORT_EXPORT_FORMATS,
  REPORT_EXPORT_OWNER_MODULES,
  type CreateReportScheduleDto,
  type CreateReportExportJobDto,
  type ParsedReportExportJobInput,
  type ParsedReportScheduleInput,
} from './reports.types';

const MAX_FILTER_KEYS = 20;
const MAX_RECIPIENTS = 20;

export function parseReportExportJobInput(
  input: CreateReportExportJobDto,
): ParsedReportExportJobInput {
  const reportKey = parseRequiredText(input.reportKey, 'reportKey');
  const format = parseEnumValue(input.format, REPORT_EXPORT_FORMATS, 'format');
  const ownerModule = parseEnumValue(
    input.ownerModule ?? 'FINANCE',
    REPORT_EXPORT_OWNER_MODULES,
    'ownerModule',
  );
  const filters = parseFilters(input.filters);
  return { reportKey, ownerModule, format, filters };
}

export function parseReportScheduleInput(
  input: CreateReportScheduleDto,
): ParsedReportScheduleInput {
  const startDate = parseOptionalDate(input.startDate, 'startDate') ?? new Date();
  const recurrence = {
    frequency: parseEnumValue(
      input.frequency ?? 'MONTHLY',
      REPORT_SCHEDULE_FREQUENCIES,
      'frequency',
    ),
    timezone: parseOptionalText(input.timezone) ?? DEFAULT_REPORT_SCHEDULE_TIMEZONE,
    timeOfDay: parseOptionalText(input.timeOfDay) ?? DEFAULT_REPORT_SCHEDULE_TIME_OF_DAY,
    startDate,
    dayOfWeek: parseOptionalInteger(input.dayOfWeek),
    dayOfMonth: parseOptionalInteger(input.dayOfMonth),
  };
  assertReportScheduleRecurrence(recurrence);
  return {
    ...parseReportExportJobInput(input),
    recipientEmails: parseRecipientEmails(input.recipientEmails),
    scheduleLabel: parseRequiredText(input.scheduleLabel, 'scheduleLabel'),
    ...recurrence,
    nextRunAt: calculateNextReportScheduleRun(recurrence, new Date()),
  };
}

function parseRequiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} is required.`);
  }
  return value.trim();
}

function parseOptionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseEnumValue<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
): T[number] {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new BadRequestException(`${field} must be one of: ${allowed.join(', ')}.`);
  }
  return value as T[number];
}

function parseFilters(value: unknown): InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (!isPlainObject(value)) throw new BadRequestException('filters must be an object.');
  const entries = Object.entries(value);
  if (entries.length > MAX_FILTER_KEYS) {
    throw new BadRequestException(`filters cannot contain more than ${MAX_FILTER_KEYS} keys.`);
  }
  return Object.fromEntries(entries.map(([key, item]) => [key, parseFilterValue(item)]));
}

function parseRecipientEmails(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BadRequestException('recipientEmails must contain at least one email.');
  }
  if (value.length > MAX_RECIPIENTS) {
    throw new BadRequestException(
      `recipientEmails cannot contain more than ${MAX_RECIPIENTS} items.`,
    );
  }
  return value.map((item) => parseEmail(item));
}

function parseEmail(value: unknown): string {
  const email = parseRequiredText(value, 'recipientEmail').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException('recipientEmails must contain valid emails.');
  }
  return email;
}

function parseOptionalDate(value: unknown, field: string): Date | undefined {
  if (value === undefined) return undefined;
  const raw = parseRequiredText(value, field);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} must be a valid date.`);
  return date;
}

function parseOptionalInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return Number(value);
  throw new BadRequestException('recurrence numeric fields must be integers.');
}

function parseFilterValue(value: unknown): string | number | boolean | null {
  if (value === null || typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  throw new BadRequestException('filters can only contain string, number, boolean or null values.');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
