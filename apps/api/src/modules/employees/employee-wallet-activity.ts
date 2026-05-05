import type { BonusReleaseStatusEnum, PrismaClient } from '@nbos/database';

const ACTIVITY_MERGED_LIMIT = 25;
const ACTIVITY_PER_SOURCE = 12;

const BONUS_ACTIVITY_STATUSES: BonusReleaseStatusEnum[] = [
  'APPROVED',
  'INCLUDED_IN_PAYROLL',
  'PAID',
];

export type EmployeeWalletActivityKind = 'BONUS_RELEASE' | 'SALARY_PAYMENT' | 'PAYROLL_CLOSED';

export interface EmployeeWalletActivityItem {
  id: string;
  kind: EmployeeWalletActivityKind;
  occurredAt: string;
  title: string;
  detail: string | null;
  /** App path e.g. `/finance/payroll/…` — client resolves with base URL. */
  linkHref: string | null;
}

type BonusReleaseActivityRow = {
  id: string;
  status: BonusReleaseStatusEnum;
  amount: { toFixed: (n: number) => string };
  updatedAt: Date;
  payrollRunId: string | null;
  payrollRun: { id: string; payrollMonth: string } | null;
  bonusEntry: { order: { code: string } };
};

function mapBonusReleaseActivity(r: BonusReleaseActivityRow): EmployeeWalletActivityItem {
  const orderCode = r.bonusEntry.order.code;
  const amt = r.amount.toFixed(2);
  const month = r.payrollRun?.payrollMonth;
  const monthSuffix = month ? ` · ${month}` : '';
  const runId = r.payrollRun?.id ?? r.payrollRunId;
  const payrollLink = runId ? `/finance/payroll/${runId}` : null;

  if (r.status === 'PAID') {
    return {
      id: `wallet-br-paid-${r.id}`,
      kind: 'BONUS_RELEASE',
      occurredAt: r.updatedAt.toISOString(),
      title: 'Bonus paid',
      detail: `Order ${orderCode} · ${amt}${monthSuffix}`,
      linkHref: payrollLink,
    };
  }
  if (r.status === 'INCLUDED_IN_PAYROLL') {
    return {
      id: `wallet-br-included-${r.id}`,
      kind: 'BONUS_RELEASE',
      occurredAt: r.updatedAt.toISOString(),
      title: 'Bonus included in payroll',
      detail: `Order ${orderCode} · ${amt}${monthSuffix}`,
      linkHref: payrollLink,
    };
  }
  return {
    id: `wallet-br-approved-${r.id}`,
    kind: 'BONUS_RELEASE',
    occurredAt: r.updatedAt.toISOString(),
    title: 'Bonus release approved',
    detail: `Order ${orderCode} · ${amt}`,
    linkHref: payrollLink,
  };
}

type ExpensePayActivityRow = {
  id: string;
  amount: { toFixed: (n: number) => string };
  paymentDate: Date;
  expenseId: string;
  expense: {
    salaryLine: {
      payrollRun: { id: string; payrollMonth: string };
    } | null;
  };
};

function mapSalaryPaymentActivity(p: ExpensePayActivityRow): EmployeeWalletActivityItem {
  const run = p.expense.salaryLine?.payrollRun;
  const month = run?.payrollMonth ?? '';
  const detail = month ? `Payroll ${month} · ${p.amount.toFixed(2)}` : p.amount.toFixed(2);
  return {
    id: `wallet-pay-${p.id}`,
    kind: 'SALARY_PAYMENT',
    occurredAt: p.paymentDate.toISOString(),
    title: 'Salary payment recorded',
    detail,
    linkHref: `/finance/expenses/${p.expenseId}`,
  };
}

type ClosedRunRow = {
  id: string;
  payrollMonth: string;
  closedAt: Date | null;
  updatedAt: Date;
};

function mapPayrollClosedActivity(r: ClosedRunRow): EmployeeWalletActivityItem {
  const at = r.closedAt ?? r.updatedAt;
  return {
    id: `wallet-run-closed-${r.id}`,
    kind: 'PAYROLL_CLOSED',
    occurredAt: at.toISOString(),
    title: 'Payroll closed',
    detail: r.payrollMonth,
    linkHref: `/finance/payroll/${r.id}`,
  };
}

/** Merges and caps timeline for wallet UI (NBOS § notifications — read-only feed). */
export function mergeWalletActivityItems(
  items: EmployeeWalletActivityItem[],
): EmployeeWalletActivityItem[] {
  return [...items]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, ACTIVITY_MERGED_LIMIT);
}

export async function fetchWalletActivity(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
): Promise<EmployeeWalletActivityItem[]> {
  const [bonusRows, payRows, closedRuns] = await Promise.all([
    prisma.bonusRelease.findMany({
      where: { employeeId, status: { in: [...BONUS_ACTIVITY_STATUSES] } },
      orderBy: { updatedAt: 'desc' },
      take: ACTIVITY_PER_SOURCE,
      select: {
        id: true,
        status: true,
        amount: true,
        updatedAt: true,
        payrollRunId: true,
        payrollRun: { select: { id: true, payrollMonth: true } },
        bonusEntry: { select: { order: { select: { code: true } } } },
      },
    }),
    prisma.expensePayment.findMany({
      where: { expense: { salaryLine: { employeeId } } },
      orderBy: { paymentDate: 'desc' },
      take: ACTIVITY_PER_SOURCE,
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        expenseId: true,
        expense: {
          select: {
            salaryLine: {
              select: { payrollRun: { select: { id: true, payrollMonth: true } } },
            },
          },
        },
      },
    }),
    prisma.payrollRun.findMany({
      where: { status: 'CLOSED', salaryLines: { some: { employeeId } } },
      orderBy: [{ closedAt: 'desc' }, { updatedAt: 'desc' }],
      take: 8,
      select: { id: true, payrollMonth: true, closedAt: true, updatedAt: true },
    }),
  ]);

  const fromBonus = bonusRows.map((r) => mapBonusReleaseActivity(r as BonusReleaseActivityRow));
  const fromPay = payRows
    .filter((p) => p.expense.salaryLine != null)
    .map((p) => mapSalaryPaymentActivity(p as ExpensePayActivityRow));
  const fromRuns = closedRuns.map((r) => mapPayrollClosedActivity(r));

  return mergeWalletActivityItems([...fromBonus, ...fromPay, ...fromRuns]);
}
