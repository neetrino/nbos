import { BadRequestException } from '@nestjs/common';
import type { Prisma, PayrollRunStatusEnum } from '@nbos/database';
import { isValidPayrollMonth } from './payroll-runs.constants';

const PAYROLL_RUN_STATUSES: PayrollRunStatusEnum[] = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'PAYING',
  'CLOSED',
];

/** Validates `status` query for list/stats filters; throws `BadRequestException` when invalid. */
export function parsePayrollRunStatusQuery(value: string): PayrollRunStatusEnum {
  if (!PAYROLL_RUN_STATUSES.includes(value as PayrollRunStatusEnum)) {
    throw new BadRequestException(`Invalid payroll run status: ${value}`);
  }
  return value as PayrollRunStatusEnum;
}

export interface PayrollRunListScopeInput {
  status?: string;
  payrollMonthFrom?: string;
  payrollMonthTo?: string;
}

/**
 * Shared `where` for payroll run list, stats, and export (status + optional YYYY-MM range).
 * `payrollMonth` is compared as strings (lexicographic order matches calendar order).
 */
export function buildPayrollRunWhereFromScope(
  input: PayrollRunListScopeInput,
): Prisma.PayrollRunWhereInput {
  const where: Prisma.PayrollRunWhereInput = {};

  if (input.status?.trim()) {
    where.status = parsePayrollRunStatusQuery(input.status.trim());
  }

  const from = input.payrollMonthFrom?.trim();
  const to = input.payrollMonthTo?.trim();

  if (from && !isValidPayrollMonth(from)) {
    throw new BadRequestException('payrollMonthFrom must be YYYY-MM');
  }
  if (to && !isValidPayrollMonth(to)) {
    throw new BadRequestException('payrollMonthTo must be YYYY-MM');
  }
  if (from && to && from > to) {
    throw new BadRequestException('payrollMonthFrom must be less than or equal to payrollMonthTo');
  }

  if (from || to) {
    where.payrollMonth = {};
    if (from) {
      where.payrollMonth.gte = from;
    }
    if (to) {
      where.payrollMonth.lte = to;
    }
  }

  return where;
}
