import { BadRequestException } from '@nestjs/common';
import { Decimal, type Prisma } from '@nbos/database';

const CLIENT_SERVICE_PAGE_SIZE_DEFAULT = 50;
const CLIENT_SERVICE_PAGE_SIZE_MAX = 200;

export const CLIENT_SERVICE_RENEWAL_WINDOW_DAYS = 30;
export const CLIENT_SERVICE_SORT_FIELDS = new Set(['createdAt', 'renewalDate', 'name', 'ourCost']);

export function normalizeClientServicePage(value: number | undefined): number {
  return Number.isInteger(value) && value && value > 0 ? value : 1;
}

export function normalizeClientServicePageSize(value: number | undefined): number {
  if (!Number.isInteger(value) || !value || value <= 0) return CLIENT_SERVICE_PAGE_SIZE_DEFAULT;
  return Math.min(value, CLIENT_SERVICE_PAGE_SIZE_MAX);
}

export function toOptionalMoneyDecimal(
  value: number | null | undefined,
  field: string,
): Decimal | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new BadRequestException(`${field} must be a non-negative number`);
  }
  return new Decimal(value);
}

export function parseOptionalDate(value: string | null | undefined, field: string): Date | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} is invalid`);
  return date;
}

export function serializeClientServiceRow<T extends { ourCost?: unknown; clientCharge?: unknown }>(
  row: T,
) {
  return {
    ...row,
    ourCost: row.ourCost === null || row.ourCost === undefined ? null : String(row.ourCost),
    clientCharge:
      row.clientCharge === null || row.clientCharge === undefined ? null : String(row.clientCharge),
  };
}

export function buildClientServiceInclude(): Prisma.ClientServiceRecordInclude {
  return {
    project: { select: { id: true, code: true, name: true } },
    product: { select: { id: true, name: true } },
    providerAccount: { select: { id: true, name: true, provider: true } },
    _count: { select: { invoices: true, expensePlans: true, expenses: true } },
  };
}
