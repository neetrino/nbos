import { Decimal } from '@nbos/database';

import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
  allocateSalaryFirstCash,
  parsePayrollCashBonusAssignments,
} from './payroll-salary-first-cash';
import { encodePayrollCashNotes } from './payroll-salary-first-cash-notes';
import {
  expensePaymentsFromQuery,
  projectPayments,
  type PaymentSelect,
  type StoredPayment,
} from './payroll-salary-first-cash-reverse-apply.p5-s2.mock';

export const P5_S2_SALARY = new Decimal('300000.00');
export const P5_S2_BONUS_A = 'bonus-a';
export const P5_S2_BONUS_B = 'bonus-b';
export const P5_S2_CASH_320 = new Decimal('320000.00');

export type ReverseApplyFixture = {
  prisma: MockPrisma;
  payments: StoredPayment[];
};

type ReleaseRow = ReturnType<typeof includedRelease>;

export function includedRelease(id: string, amount: string, status: string) {
  const value = new Decimal(amount);
  return {
    id,
    amount: value,
    payrollIncludedAmount: value,
    status,
    bonusEntryId: `be-${id}`,
    bonusEntry: { order: { code: `O-${id}` } },
  };
}

export function createReverseApplyFixture(): ReverseApplyFixture {
  const payments = [openingPayment()];
  const prisma = createMockPrisma();
  prisma.financePostingPeriod.findUnique.mockResolvedValue(null);
  wirePaymentCommands(prisma, payments);
  wireExpenseReads(prisma, payments);
  wirePayrollReads(prisma);
  wireBonusReleases(prisma, openingReleases());
  return { prisma, payments };
}

function openingPayment(): StoredPayment {
  return {
    id: 'pay-1',
    amount: P5_S2_CASH_320,
    notes: encoded320kNotes(),
    paymentDate: new Date('2026-04-28T00:00:00.000Z'),
  };
}

function encoded320kNotes(): string {
  const allocation = allocateSalaryFirstCash({
    cash: P5_S2_CASH_320,
    salaryRemaining: P5_S2_SALARY,
    bonuses: [
      { bonusReleaseId: P5_S2_BONUS_A, remaining: new Decimal('20000.00') },
      { bonusReleaseId: P5_S2_BONUS_B, remaining: new Decimal('40000.00') },
    ],
    assignments: parsePayrollCashBonusAssignments([
      { bonusReleaseId: P5_S2_BONUS_A, amount: '20000.00' },
    ]),
  });
  return encodePayrollCashNotes(allocation);
}

function openingReleases(): ReleaseRow[] {
  return [
    includedRelease(P5_S2_BONUS_A, '20000.00', 'PAID'),
    includedRelease(P5_S2_BONUS_B, '40000.00', 'INCLUDED_IN_PAYROLL'),
  ];
}

function wirePaymentCommands(prisma: MockPrisma, payments: StoredPayment[]): void {
  prisma.expensePayment.findFirst.mockImplementation(
    async ({ where }: { where: { id: string } }) => {
      return payments.find((row) => row.id === where.id) ?? null;
    },
  );
  prisma.expensePayment.delete.mockImplementation(async ({ where }: { where: { id: string } }) => {
    replacePayments(
      payments,
      payments.filter((row) => row.id !== where.id),
    );
    return { id: where.id };
  });
  wirePaymentWrites(prisma, payments);
}

function wirePaymentWrites(prisma: MockPrisma, payments: StoredPayment[]): void {
  let created = 0;
  prisma.expensePayment.create.mockImplementation(
    async ({ data }: { data: { amount: Decimal; notes: string | null; paymentDate: Date } }) => {
      created += 1;
      const row = { id: `created-${created}`, ...data };
      payments.push(row);
      return row;
    },
  );
  prisma.expensePayment.update.mockImplementation(
    async ({
      where,
      data,
    }: {
      where: { id: string };
      data: { amount?: Decimal; notes?: string | null };
    }) => applyPaymentUpdate(payments, where.id, data),
  );
}

function applyPaymentUpdate(
  payments: StoredPayment[],
  id: string,
  data: { amount?: Decimal; notes?: string | null },
): StoredPayment | { id: string } {
  const row = payments.find((item) => item.id === id);
  if (row == null) {
    return { id };
  }
  if (data.amount != null) {
    row.amount = data.amount;
  }
  if (data.notes !== undefined) {
    row.notes = data.notes;
  }
  return row;
}

function wireExpenseReads(prisma: MockPrisma, payments: StoredPayment[]): void {
  prisma.expense.findUnique.mockImplementation(
    async (args?: { include?: { expensePayments?: true | { select?: PaymentSelect } } }) => ({
      id: 'ex-1',
      name: 'Payroll',
      amount: new Decimal('400000.00'),
      status: 'DUE_NOW',
      dueDate: new Date('2026-04-30'),
      projectId: null,
      productId: null,
      partnerPayoutBatch: null,
      expensePayments: expensePaymentsFromQuery(args ?? {}, payments),
    }),
  );
  prisma.expensePayment.findMany.mockImplementation(async (args?: { select?: PaymentSelect }) =>
    projectPayments(payments, args?.select ?? true),
  );
}

function wirePayrollReads(prisma: MockPrisma): void {
  prisma.payrollRun.findUnique.mockResolvedValue({ payrollMonth: new Date('2026-04-01') });
  prisma.bonusEntry.findUnique.mockResolvedValue({
    id: 'be-bonus-a',
    status: 'ACTIVE',
    amount: new Decimal('20000.00'),
    employeeId: 'emp-1',
    orderId: 'o1',
    order: { code: 'O-bonus-a' },
  });
  prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: new Decimal('20000.00') } });
  prisma.order.findUnique.mockResolvedValue(null);
  prisma.salaryLine.findUnique.mockResolvedValue({
    id: 'sl-1',
    payrollRunId: 'pr-1',
    employeeId: 'emp-1',
    baseSalary: P5_S2_SALARY,
    totalPayable: new Decimal('400000.00'),
    payrollRun: { status: 'PAYING' },
  });
}

function wireBonusReleases(prisma: MockPrisma, releases: ReleaseRow[]): void {
  prisma.bonusRelease.findMany.mockImplementation(
    async ({ where }: { where?: { id?: { in?: string[] }; status?: string } }) => {
      return releases.filter((row) => releaseMatches(row, where));
    },
  );
  prisma.bonusRelease.updateMany.mockImplementation(
    async ({
      where,
      data,
    }: {
      where?: { id?: { in?: string[] }; status?: string };
      data: { status: string };
    }) => markMatchingReleases(releases, where, data.status),
  );
}

function releaseMatches(
  row: ReleaseRow,
  where?: { id?: { in?: string[] }; status?: string },
): boolean {
  if (where?.id?.in != null && !where.id.in.includes(row.id)) {
    return false;
  }
  return where?.status == null || row.status === where.status;
}

function markMatchingReleases(
  releases: ReleaseRow[],
  where: { id?: { in?: string[] }; status?: string } | undefined,
  status: string,
): { count: number } {
  let count = 0;
  for (const row of releases) {
    if (!releaseMatches(row, where)) {
      continue;
    }
    row.status = status;
    count += 1;
  }
  return { count };
}

function replacePayments(target: StoredPayment[], next: StoredPayment[]): void {
  target.length = 0;
  target.push(...next);
}
