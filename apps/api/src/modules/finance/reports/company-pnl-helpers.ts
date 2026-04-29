import { BadRequestException } from '@nestjs/common';
import { Decimal, type Prisma } from '@nbos/database';
import type { CompanyPnlQuery } from './company-pnl.types';

export const COMPANY_PNL_CURRENCY = 'AMD' as const;

export interface CompanyPnlPeriod {
  dateFrom: Date | null;
  dateTo: Date | null;
}

export function parseCompanyPnlPeriod(query: CompanyPnlQuery): CompanyPnlPeriod {
  const dateFrom = parseOptionalDate(query.dateFrom, 'dateFrom');
  const dateTo = parseOptionalDate(query.dateTo, 'dateTo');
  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new BadRequestException('dateFrom must be before or equal to dateTo');
  }
  return { dateFrom, dateTo };
}

export function buildDateFilter(period: CompanyPnlPeriod): Prisma.DateTimeFilter | undefined {
  if (!period.dateFrom && !period.dateTo) return undefined;
  return {
    ...(period.dateFrom ? { gte: period.dateFrom } : {}),
    ...(period.dateTo ? { lte: period.dateTo } : {}),
  };
}

export function buildPayrollMonthFilter(period: CompanyPnlPeriod): Prisma.StringFilter | undefined {
  const from = period.dateFrom ? toMonth(period.dateFrom) : undefined;
  const to = period.dateTo ? toMonth(period.dateTo) : undefined;
  if (!from && !to) return undefined;
  return { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
}

export function decimalString(value: Decimal | null | undefined): string {
  return (value ?? new Decimal(0)).toFixed(2);
}

export function marginPercent(profit: Decimal, revenue: Decimal): number | null {
  if (revenue.equals(0)) return null;
  return Number(profit.div(revenue).mul(100).toFixed(2));
}

export function periodIsoDate(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function parseOptionalDate(value: string | undefined, fieldName: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid date`);
  }
  if (fieldName === 'dateTo' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function toMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}
