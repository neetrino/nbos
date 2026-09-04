import { BadRequestException } from '@nestjs/common';
import type { ExpensePlanStatusEnum, Prisma } from '@nbos/database';

export const EXPENSE_PLAN_STATUSES = ['ACTIVE', 'CANCELLED'] as const;

const ALLOWED_TRANSITIONS: Record<ExpensePlanStatusEnum, readonly ExpensePlanStatusEnum[]> = {
  ACTIVE: ['CANCELLED'],
  CANCELLED: ['ACTIVE'],
};

export function assertExpensePlanStatus(value: string): asserts value is ExpensePlanStatusEnum {
  if (!(EXPENSE_PLAN_STATUSES as readonly string[]).includes(value)) {
    throw new BadRequestException(`Invalid expense plan status: ${value}`);
  }
}

export function assertExpensePlanStatusTransition(
  from: ExpensePlanStatusEnum,
  to: ExpensePlanStatusEnum,
): void {
  if (from === to) {
    throw new BadRequestException(`Expense plan status is already ${from}`);
  }
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new BadRequestException(`Cannot change expense plan status from ${from} to ${to}`);
  }
}

export type ExpensePlanStatusQueryFilter = ExpensePlanStatusEnum | { in: ExpensePlanStatusEnum[] };

/** Parses `status` query: omitted → all; one token → equals; comma list → `{ in }`. */
export function parseExpensePlanStatusQuery(
  raw: string | undefined,
): ExpensePlanStatusQueryFilter | undefined {
  if (raw == null || raw.trim() === '') {
    return undefined;
  }

  const statuses: ExpensePlanStatusEnum[] = [];
  for (const token of raw.split(',')) {
    const status = token.trim();
    assertExpensePlanStatus(status);
    statuses.push(status);
  }

  const [only] = statuses;
  if (only && statuses.length === 1) {
    return only;
  }
  return { in: statuses };
}

export function expensePlanStatusUpdateData(
  to: ExpensePlanStatusEnum,
): Prisma.ExpensePlanUpdateInput {
  if (to === 'CANCELLED') {
    return {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      autoGenerate: false,
    };
  }
  return {
    status: 'ACTIVE',
    cancelledAt: null,
  };
}
