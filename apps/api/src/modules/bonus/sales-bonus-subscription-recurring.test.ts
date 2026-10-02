import { Logger } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { describe, expect, it, vi } from 'vitest';
import { accrueSubscriptionRecurringSalesBonus } from './sales-bonus-subscription-recurring';

type SalesRole = 'SELLER' | 'ASSISTANT';

type StoredRecurringBonus = {
  employeeId: string;
  orderId: string;
  type: string;
  salesBonusSlot: SalesRole | null;
  salesAccrualRole: SalesRole | null;
  salesAccrualInvoiceId: string | null;
  amount: Decimal;
  percent: Decimal;
};

type InvoiceClause = { salesAccrualInvoiceId?: string | null | { not: string } };
type RoleClause = { salesAccrualRole?: SalesRole | null };

type RecurringWhere = {
  orderId?: string;
  type?: string;
  salesAccrualInvoiceId?: string;
  employeeId?: string;
  salesBonusSlot?: null;
  salesAccrualRole?: SalesRole;
  OR?: Array<InvoiceClause & RoleClause>;
};

const ORDER = {
  id: 'ord-sub',
  projectId: 'proj1',
  deal: {
    id: 'deal1',
    source: 'CLIENT' as const,
    sellerId: 'emp-1',
    sellerAssistantId: 'emp-1',
  },
};

function slottedRow(
  slot: SalesRole,
  amount: number,
  percent: number,
  invoiceId = 'inv-1',
): StoredRecurringBonus {
  return {
    employeeId: 'emp-1',
    orderId: 'ord-sub',
    type: 'SALES',
    salesBonusSlot: slot,
    salesAccrualRole: null,
    salesAccrualInvoiceId: invoiceId,
    amount: new Decimal(amount),
    percent: new Decimal(percent),
  };
}

function unslottedConflict(existing: StoredRecurringBonus[], next: StoredRecurringBonus): boolean {
  return existing.some(
    (row) =>
      row.type === 'SALES' &&
      row.orderId === next.orderId &&
      row.salesBonusSlot == null &&
      next.salesBonusSlot == null &&
      row.salesAccrualInvoiceId === next.salesAccrualInvoiceId &&
      row.employeeId === next.employeeId &&
      row.salesAccrualRole === next.salesAccrualRole,
  );
}

function matchesRole(row: StoredRecurringBonus, where: RecurringWhere): boolean {
  if (where.OR && where.OR.some((clause) => 'salesAccrualRole' in clause)) {
    return where.OR.some((clause) => {
      if (clause.salesAccrualRole === undefined) {
        return true;
      }
      if (clause.salesAccrualRole === null) {
        return row.salesAccrualRole == null;
      }
      return row.salesAccrualRole === clause.salesAccrualRole;
    });
  }
  return where.salesAccrualRole == null || row.salesAccrualRole === where.salesAccrualRole;
}

function matchesInvoiceSum(row: StoredRecurringBonus, where: RecurringWhere): boolean {
  if (!where.OR?.some((clause) => 'salesAccrualInvoiceId' in clause)) {
    return true;
  }
  return where.OR.some((clause) => {
    if (clause.salesAccrualInvoiceId === null) {
      return row.salesAccrualInvoiceId == null;
    }
    if (
      clause.salesAccrualInvoiceId != null &&
      typeof clause.salesAccrualInvoiceId === 'object' &&
      'not' in clause.salesAccrualInvoiceId
    ) {
      return (
        row.salesAccrualInvoiceId != null &&
        row.salesAccrualInvoiceId !== clause.salesAccrualInvoiceId.not
      );
    }
    return false;
  });
}

function createRecurringStore(seed: StoredRecurringBonus[]) {
  const rows = seed.map((row) => ({ ...row }));
  const prisma = {
    $executeRaw: async () => 1,
    $transaction: async (work: (tx: typeof prisma) => Promise<boolean>) => work(prisma),
    bonusEntry: {
      aggregate: async ({ where }: { where: RecurringWhere }) => {
        const total = rows
          .filter((row) => row.type === 'SALES' && row.orderId === ORDER.id)
          .filter((row) => matchesInvoiceSum(row, where))
          .reduce((sum, row) => sum.plus(row.amount), new Decimal(0));
        return { _sum: { amount: total } };
      },
      findFirst: async ({ where }: { where: RecurringWhere }) => {
        const match = rows.find(
          (row) =>
            row.type === 'SALES' &&
            row.orderId === ORDER.id &&
            (where.salesAccrualInvoiceId == null ||
              row.salesAccrualInvoiceId === where.salesAccrualInvoiceId) &&
            (where.employeeId == null || row.employeeId === where.employeeId) &&
            (where.salesBonusSlot === undefined || row.salesBonusSlot === where.salesBonusSlot) &&
            matchesRole(row, where),
        );
        return match ? { id: 'existing' } : null;
      },
      createMany: async ({
        data,
        skipDuplicates,
      }: {
        data: StoredRecurringBonus[];
        skipDuplicates?: boolean;
      }) => {
        let count = 0;
        for (const entry of data) {
          if (unslottedConflict(rows, entry)) {
            if (skipDuplicates) {
              continue;
            }
            throw { code: 'P2002' };
          }
          rows.push(entry);
          count += 1;
        }
        return { count };
      },
    },
  };
  return { rows, prisma };
}

async function accrueRecurring(
  prisma: ReturnType<typeof createRecurringStore>['prisma'],
  invoiceAmount: number,
  sellerPercent = 40,
  assistantPercent = 10,
): Promise<boolean> {
  return accrueSubscriptionRecurringSalesBonus({
    prisma: prisma as never,
    logger: { warn: vi.fn() } as unknown as Logger,
    invoice: { id: 'inv-2', amount: new Decimal(invoiceAmount) },
    order: ORDER,
    earnedPeriod: '2026-10',
    loadPolicy: async () => ({
      sellerPercent: new Decimal(sellerPercent),
      assistantPercent: new Decimal(assistantPercent),
    }),
  });
}

describe('accrueSubscriptionRecurringSalesBonus envelope', () => {
  it('stores 0 on a later invoice when the first month already used 300000', async () => {
    const store = createRecurringStore([
      slottedRow('SELLER', 240_000, 40),
      slottedRow('ASSISTANT', 60_000, 10),
    ]);
    const created = await accrueRecurring(store.prisma, 1_000_000);
    expect(created).toBe(false);
    expect(store.rows.filter((row) => row.salesAccrualInvoiceId === 'inv-2')).toHaveLength(0);
    const stored = store.rows.reduce((sum, row) => sum.plus(row.amount), new Decimal(0));
    expect(stored.toString()).toBe('300000');
  });

  it('gives a later invoice only the remaining 200000 split by that invoice rates', async () => {
    const store = createRecurringStore([
      slottedRow('SELLER', 80_000, 8),
      slottedRow('ASSISTANT', 20_000, 2),
    ]);
    const created = await accrueRecurring(store.prisma, 1_000_000);
    expect(created).toBe(true);
    const later = store.rows.filter((row) => row.salesAccrualInvoiceId === 'inv-2');
    expect(later.map((row) => row.amount.toString())).toEqual(['160000', '40000']);
    expect(later.every((row) => row.salesBonusSlot === null)).toBe(true);
  });

  it('stores both unslotted recurring roles when one employee holds both', async () => {
    const store = createRecurringStore([
      slottedRow('SELLER', 40_000, 40),
      slottedRow('ASSISTANT', 10_000, 10),
    ]);
    const created = await accrueRecurring(store.prisma, 50_000, 5, 1);
    expect(created).toBe(true);
    const later = store.rows.filter((row) => row.salesAccrualInvoiceId === 'inv-2');
    expect(later).toHaveLength(2);
    expect(later.every((row) => row.employeeId === 'emp-1')).toBe(true);
    expect(later.every((row) => row.salesBonusSlot === null)).toBe(true);
    expect(later.map((row) => row.percent.toString())).toEqual(['5', '1']);
    expect(later.map((row) => row.amount.toString())).toEqual(['2500', '500']);
    expect(later.map((row) => row.salesAccrualRole)).toEqual(['SELLER', 'ASSISTANT']);
  });

  it('stores 10000 and 10000 when recurring rates are both 5 percent', async () => {
    const store = createRecurringStore([
      slottedRow('SELLER', 80_000, 8),
      slottedRow('ASSISTANT', 20_000, 2),
    ]);
    const created = await accrueRecurring(store.prisma, 200_000, 5, 5);
    expect(created).toBe(true);
    const later = store.rows.filter((row) => row.salesAccrualInvoiceId === 'inv-2');
    expect(later).toHaveLength(2);
    expect(later.map((row) => row.amount.toString())).toEqual(['10000', '10000']);
    expect(later.map((row) => row.salesAccrualRole)).toEqual(['SELLER', 'ASSISTANT']);
    expect(later.every((row) => row.salesBonusSlot === null)).toBe(true);
    const createdAgain = await accrueRecurring(store.prisma, 200_000, 5, 5);
    expect(createdAgain).toBe(false);
    expect(store.rows.filter((row) => row.salesAccrualInvoiceId === 'inv-2')).toHaveLength(2);
  });

  it('stores 0 on the next invoice when a null invoice id already used 300000', async () => {
    const store = createRecurringStore([
      {
        employeeId: 'emp-1',
        orderId: 'ord-sub',
        type: 'SALES',
        salesBonusSlot: 'SELLER',
        salesAccrualRole: null,
        salesAccrualInvoiceId: null,
        amount: new Decimal(240_000),
        percent: new Decimal(40),
      },
      {
        employeeId: 'emp-1',
        orderId: 'ord-sub',
        type: 'SALES',
        salesBonusSlot: 'ASSISTANT',
        salesAccrualRole: null,
        salesAccrualInvoiceId: null,
        amount: new Decimal(60_000),
        percent: new Decimal(10),
      },
    ]);
    const created = await accrueRecurring(store.prisma, 1_000_000);
    expect(created).toBe(false);
    expect(store.rows.filter((row) => row.salesAccrualInvoiceId === 'inv-2')).toHaveLength(0);
  });

  it('does not insert another 20000 over a legacy null-role row for that employee', async () => {
    const store = createRecurringStore([
      {
        employeeId: 'emp-1',
        orderId: 'ord-sub',
        type: 'SALES',
        salesBonusSlot: null,
        salesAccrualRole: null,
        salesAccrualInvoiceId: 'inv-2',
        amount: new Decimal(20_000),
        percent: new Decimal(2),
      },
    ]);
    const created = await accrueRecurring(store.prisma, 200_000, 5, 5);
    expect(created).toBe(false);
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]?.amount.toString()).toBe('20000');
  });

  it('does not write a positive missing Assistant after Seller 240000 on this invoice and 60000 on another', async () => {
    const store = createRecurringStore([
      slottedRow('SELLER', 240_000, 40, 'inv-2'),
      slottedRow('ASSISTANT', 60_000, 10, 'inv-1'),
    ]);
    const created = await accrueRecurring(store.prisma, 1_000_000);
    expect(created).toBe(false);
    const assistantOnThisInvoice = store.rows.filter(
      (row) => row.salesAccrualInvoiceId === 'inv-2' && row.salesBonusSlot === 'ASSISTANT',
    );
    expect(assistantOnThisInvoice).toHaveLength(0);
    const stored = store.rows.reduce((sum, row) => sum.plus(row.amount), new Decimal(0));
    expect(stored.toString()).toBe('300000');
  });
});
