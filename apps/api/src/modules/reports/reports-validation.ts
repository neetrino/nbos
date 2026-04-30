import { BadRequestException } from '@nestjs/common';
import type { InputJsonValue } from '@nbos/database';
import {
  REPORT_EXPORT_FORMATS,
  REPORT_EXPORT_OWNER_MODULES,
  type CreateReportExportJobDto,
  type ParsedReportExportJobInput,
} from './reports.types';

const MAX_FILTER_KEYS = 20;

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

function parseRequiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} is required.`);
  }
  return value.trim();
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

function parseFilterValue(value: unknown): string | number | boolean | null {
  if (value === null || typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  throw new BadRequestException('filters can only contain string, number, boolean or null values.');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
