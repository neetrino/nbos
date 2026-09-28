import { Decimal } from '@nbos/database';

import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
  createP5S3Journal,
  type P5S3Journal,
} from './payroll-register-reconciliation.p5-s3.journal';
import {
  expensePaymentsFromQuery,
  projectPayments,
  type PaymentSelect,
  type StoredPayment,
} from './payroll-salary-first-cash-reverse-apply.p5-s2.mock';
import {
  P5_S3_BONUS,
  P5_S3_EMPLOYEE_ID,
  P5_S3_ENTRY_ID,
  P5_S3_EXPENSE,
  P5_S3_EXPENSE_ID,
  P5_S3_RELEASE_ID,
  P5_S3_RUN_ID,
  P5_S3_SALARY,
} from './payroll-register-reconciliation.p5-s3.amounts';

export type P5S3ReleaseRow = {
  id: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal;
  status: string;
  bonusEntryId: string;
  payrollRunId: string;
  kpiBurnedAmount: Decimal | null;
  kpiBurnedReason: string | null;
  payrollCarryOverAmount: Decimal | null;
  releaseType: 'MANUAL';
  updatedAt: Date;
  payrollRun: { payrollMonth: string };
  bonusEntry: { order: { code: string } };
};

export type P5S3RegisterFixture = {
  prisma: MockPrisma;
  payments: StoredPayment[];
  releases: P5S3ReleaseRow[];
  salaryLine: {
    id: string;
    payrollRunId: string;
    employeeId: string;
    baseSalary: Decimal;
    totalPayable: Decimal;
    paidAmount: Decimal;
    remainingAmount: Decimal;
    payrollCarryAppliedAmount: Decimal | null;
    payrollRun: { status: string };
    expenseId: string;
  };
  journal: P5S3Journal;
};

export function createP5S3RegisterFixture(): P5S3RegisterFixture {
  const payments: StoredPayment[] = [];
  const releases = [openingRelease()];
  const salaryLine = openingSalaryLine();
  const prisma = createMockPrisma();
  const journal = createP5S3Journal();
  prisma.financePostingPeriod.findUnique.mockResolvedValue(null);
  wirePayments(prisma, payments);
  wireExpense(prisma, payments);
  wireSalaryLine(prisma, salaryLine);
  wireBonusReleases(prisma, releases);
  wirePoolReads(prisma);
  return { prisma, payments, releases, salaryLine, journal };
}

function openingRelease(): P5S3ReleaseRow {
  return {
    id: P5_S3_RELEASE_ID,
    amount: P5_S3_BONUS,
    payrollIncludedAmount: P5_S3_BONUS,
    status: 'INCLUDED_IN_PAYROLL',
    bonusEntryId: P5_S3_ENTRY_ID,
    payrollRunId: P5_S3_RUN_ID,
    kpiBurnedAmount: null,
    kpiBurnedReason: null,
    payrollCarryOverAmount: null,
    releaseType: 'MANUAL',
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    payrollRun: { payrollMonth: '2026-04' },
    bonusEntry: { order: { code: 'O-60' } },
  };
}

function openingSalaryLine(): P5S3RegisterFixture['salaryLine'] {
  return {
    id: 'sl-1',
    payrollRunId: P5_S3_RUN_ID,
    employeeId: P5_S3_EMPLOYEE_ID,
    baseSalary: P5_S3_SALARY,
    totalPayable: P5_S3_EXPENSE,
    paidAmount: new Decimal(0),
    remainingAmount: P5_S3_EXPENSE,
    payrollCarryAppliedAmount: null,
    payrollRun: { status: 'PAYING' },
    expenseId: P5_S3_EXPENSE_ID,
  };
}

function wirePayments(prisma: MockPrisma, payments: StoredPayment[]): void {
  wirePaymentReads(prisma, payments);
  wirePaymentWrites(prisma, payments);
}

function wirePaymentReads(prisma: MockPrisma, payments: StoredPayment[]): void {
  prisma.expensePayment.findMany.mockImplementation(async (args?: { select?: PaymentSelect }) =>
    projectPayments(payments, args?.select ?? true),
  );
  prisma.expensePayment.findFirst.mockImplementation(
    async ({ where }: { where: { id: string } }) => {
      return payments.find((row) => row.id === where.id) ?? null;
    },
  );
}

function wirePaymentWrites(prisma: MockPrisma, payments: StoredPayment[]): void {
  let created = 0;
  prisma.expensePayment.create.mockImplementation(
    async ({
      data,
    }: {
      data: { amount: Decimal | number; notes: string | null; paymentDate: Date };
    }) => {
      created += 1;
      const amount = data.amount instanceof Decimal ? data.amount : new Decimal(data.amount);
      const row = {
        id: `pay-${created}`,
        amount,
        notes: data.notes,
        paymentDate: data.paymentDate,
      };
      payments.push(row);
      return row;
    },
  );
  prisma.expensePayment.delete.mockImplementation(async ({ where }: { where: { id: string } }) => {
    const next = payments.filter((row) => row.id !== where.id);
    payments.length = 0;
    payments.push(...next);
    return { id: where.id };
  });
  prisma.expensePayment.update.mockImplementation(async (args: UpdatePaymentArgs) =>
    applyPaymentUpdate(payments, args),
  );
}

type UpdatePaymentArgs = {
  where: { id: string };
  data: { amount?: Decimal; notes?: string | null };
};

function applyPaymentUpdate(payments: StoredPayment[], args: UpdatePaymentArgs): StoredPayment {
  const row = payments.find((item) => item.id === args.where.id);
  if (row == null) {
    return { id: args.where.id, amount: new Decimal(0), notes: null, paymentDate: new Date(0) };
  }
  if (args.data.amount != null) {
    row.amount = args.data.amount;
  }
  if (args.data.notes !== undefined) {
    row.notes = args.data.notes;
  }
  return row;
}

function wireExpense(prisma: MockPrisma, payments: StoredPayment[]): void {
  prisma.expense.findUnique.mockImplementation(
    async (args?: { include?: { expensePayments?: true | { select?: PaymentSelect } } }) => ({
      id: P5_S3_EXPENSE_ID,
      name: 'Payroll',
      amount: P5_S3_EXPENSE,
      status: 'DUE_NOW',
      dueDate: new Date('2026-04-30'),
      projectId: null,
      productId: null,
      partnerPayoutBatch: null,
      expensePayments: expensePaymentsFromQuery(args ?? {}, payments),
    }),
  );
}

function wireSalaryLine(prisma: MockPrisma, salaryLine: P5S3RegisterFixture['salaryLine']): void {
  prisma.salaryLine.findUnique.mockResolvedValue(salaryLine);
  prisma.salaryLine.findMany.mockResolvedValue([{ expenseId: P5_S3_EXPENSE_ID }]);
  prisma.salaryLine.update.mockImplementation(
    async ({
      data,
    }: {
      data: { paidAmount?: Decimal; remainingAmount?: Decimal; status?: string };
    }) => {
      if (data.paidAmount != null) {
        salaryLine.paidAmount = data.paidAmount;
      }
      if (data.remainingAmount != null) {
        salaryLine.remainingAmount = data.remainingAmount;
      }
      return salaryLine;
    },
  );
  prisma.salaryLine.aggregate.mockImplementation(async () => ({
    _sum: {
      baseSalary: salaryLine.baseSalary,
      bonusesTotal: P5_S3_BONUS,
      totalPayable: salaryLine.totalPayable,
      paidAmount: salaryLine.paidAmount,
    },
  }));
}

function wireBonusReleases(prisma: MockPrisma, releases: P5S3ReleaseRow[]): void {
  prisma.bonusRelease.findMany.mockImplementation(
    async ({ where }: { where?: { id?: { in?: string[] }; status?: string } }) =>
      releases.filter((row) => releaseMatches(row, where)),
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

function markMatchingReleases(
  releases: P5S3ReleaseRow[],
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

function releaseMatches(
  row: P5S3ReleaseRow,
  where?: { id?: { in?: string[] }; status?: string },
): boolean {
  if (where?.id?.in != null && !where.id.in.includes(row.id)) {
    return false;
  }
  return where?.status == null || row.status === where.status;
}

function wirePoolReads(prisma: MockPrisma): void {
  prisma.payrollRun.findUnique.mockResolvedValue({ payrollMonth: '2026-04' });
  prisma.bonusEntry.findUnique.mockResolvedValue({
    id: P5_S3_ENTRY_ID,
    status: 'ACTIVE',
    amount: P5_S3_BONUS,
    employeeId: P5_S3_EMPLOYEE_ID,
    orderId: 'ord-1',
    order: { code: 'O-60' },
  });
  prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: P5_S3_BONUS } });
  prisma.order.findUnique.mockResolvedValue(null);
  prisma.productBonusPool.findMany.mockResolvedValue([
    {
      orderId: 'ord-1',
      availableFunding: new Decimal(0),
      overFundingAmount: new Decimal(0),
      totalPlannedAmount: P5_S3_BONUS,
      totalReleasedAmount: P5_S3_BONUS,
      status: 'CLOSED',
      product: { name: 'Site' },
      extension: null,
    },
  ]);
}
