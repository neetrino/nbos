import { BadRequestException } from '@nestjs/common';
import { Decimal, type PrismaClient } from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from './bonus-pool-decimal';
import { SUPPORT_BONUS_AMOUNT_PER_SLA_RESOLVED } from './support-bonus-accrual.constants';
import { parsePayrollMonthToUtcRange } from '../payroll-runs/payroll-run-suggested-sales-actual';
import { PAYROLL_MONTH_REGEX } from '../payroll-runs/payroll-runs.constants';

const TERMINAL_STATUSES = ['RESOLVED', 'CLOSED'] as const;

export interface SupportBonusAccrualPreviewRow {
  employeeId: string;
  firstName: string;
  lastName: string;
  slaMetCount: number;
  suggestedAmount: string;
}

export interface SupportBonusAccrualPreviewDto {
  payrollMonth: string;
  ratesConfigured: boolean;
  amountPerSlaResolved: string;
  rows: SupportBonusAccrualPreviewRow[];
  totals: {
    slaMetCount: number;
    suggestedAmount: string;
  };
  note: string;
}

function ticketSlaMetInMonth(
  ticket: {
    status: string;
    updatedAt: Date;
    slaResolveDeadline: Date | null;
  },
  range: { gte: Date; lt: Date },
): boolean {
  if (!TERMINAL_STATUSES.includes(ticket.status as (typeof TERMINAL_STATUSES)[number])) {
    return false;
  }
  if (ticket.updatedAt < range.gte || ticket.updatedAt >= range.lt) {
    return false;
  }
  if (ticket.slaResolveDeadline == null) {
    return false;
  }
  return ticket.updatedAt.getTime() <= ticket.slaResolveDeadline.getTime();
}

export async function querySupportBonusAccrualPreview(
  prisma: PrismaClient,
  payrollMonth: string,
): Promise<SupportBonusAccrualPreviewDto> {
  const month = payrollMonth.trim();
  if (!PAYROLL_MONTH_REGEX.test(month)) {
    throw new BadRequestException('payrollMonth must be YYYY-MM');
  }
  const range = parsePayrollMonthToUtcRange(month);
  if (range == null) {
    throw new BadRequestException('payrollMonth must be YYYY-MM');
  }

  const ratesConfigured = SUPPORT_BONUS_AMOUNT_PER_SLA_RESOLVED > 0;
  const perTicket = new Decimal(SUPPORT_BONUS_AMOUNT_PER_SLA_RESOLVED);

  const tickets = await prisma.supportTicket.findMany({
    where: {
      assignedTo: { not: null },
      status: { in: [...TERMINAL_STATUSES] },
      updatedAt: { gte: range.gte, lt: range.lt },
      slaResolveDeadline: { not: null },
    },
    select: {
      assignedTo: true,
      status: true,
      updatedAt: true,
      slaResolveDeadline: true,
    },
  });

  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    const assignee = ticket.assignedTo;
    if (assignee == null || !ticketSlaMetInMonth(ticket, range)) {
      continue;
    }
    counts.set(assignee, (counts.get(assignee) ?? 0) + 1);
  }

  const employeeIds = [...counts.keys()];
  const employees =
    employeeIds.length > 0
      ? await prisma.employee.findMany({
          where: { id: { in: employeeIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
  const nameById = new Map(employees.map((e) => [e.id, e]));

  let totalCount = 0;
  let totalSuggested = BONUS_POOL_ZERO;
  const rows: SupportBonusAccrualPreviewRow[] = [];

  for (const [employeeId, slaMetCount] of counts) {
    totalCount += slaMetCount;
    const suggested = perTicket.times(slaMetCount);
    totalSuggested = totalSuggested.plus(suggested);
    const emp = nameById.get(employeeId);
    rows.push({
      employeeId,
      firstName: emp?.firstName ?? '',
      lastName: emp?.lastName ?? '',
      slaMetCount,
      suggestedAmount: suggested.toFixed(2),
    });
  }

  rows.sort((a, b) =>
    `${a.lastName} ${a.firstName}`.trim().localeCompare(`${b.lastName} ${b.firstName}`.trim()),
  );

  return {
    payrollMonth: month,
    ratesConfigured,
    amountPerSlaResolved: decimalFrom(SUPPORT_BONUS_AMOUNT_PER_SLA_RESOLVED).toFixed(2),
    rows,
    totals: {
      slaMetCount: totalCount,
      suggestedAmount: totalSuggested.toFixed(2),
    },
    note: ratesConfigured
      ? 'SLA-met = resolved/closed in month before resolve deadline. Apply creates MARKETING-type planned entries on company anchor order.'
      : 'Rates not configured (preview counts only).',
  };
}
