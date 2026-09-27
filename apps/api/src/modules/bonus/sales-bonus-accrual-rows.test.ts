import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';

import {
  buildSalesBonusAmountRows,
  persistSalesBonusRows,
  type SalesBonusAmountRow,
} from './sales-bonus-accrual-rows';

const ORDER = { id: 'ord-1', projectId: 'proj-1' };
const DEAL = { id: 'deal-1' };
const INVOICE_ID = 'inv-1';
const EARNED_PERIOD = '2026-09';
const SNAPSHOT = { basis: 'ORDER_TOTAL' };

type StoredSalesBonus = {
  employeeId: string;
  orderId: string;
  type: string;
  salesBonusSlot: 'SELLER' | 'ASSISTANT' | null;
  salesAccrualInvoiceId: string | null;
};

type CreateManyArgs = {
  data: StoredSalesBonus[];
  skipDuplicates?: boolean;
};

function dualRoleRows(employeeId: string): SalesBonusAmountRow[] {
  return [
    { employeeId, slot: 'SELLER', amount: new Decimal(80_000), percent: new Decimal(8) },
    { employeeId, slot: 'ASSISTANT', amount: new Decimal(20_000), percent: new Decimal(2) },
  ];
}

/** Mirrors the partial unique indexes on `bonus_entries` after P3-S1. */
function salesBonusConflicts(existing: StoredSalesBonus[], next: StoredSalesBonus): boolean {
  if (next.type !== 'SALES') {
    return false;
  }
  return existing.some((row) => rowConflicts(row, next));
}

function rowConflicts(row: StoredSalesBonus, next: StoredSalesBonus): boolean {
  if (row.type !== 'SALES' || row.orderId !== next.orderId) {
    return false;
  }
  if (next.salesBonusSlot != null && row.salesBonusSlot === next.salesBonusSlot) {
    return true;
  }
  if (next.salesBonusSlot != null) {
    return false;
  }
  return (
    row.salesBonusSlot == null &&
    row.salesAccrualInvoiceId === next.salesAccrualInvoiceId &&
    row.employeeId === next.employeeId
  );
}

function createUniqueAwareBonusStore() {
  const rows: StoredSalesBonus[] = [];
  const createMany = async ({ data, skipDuplicates }: CreateManyArgs) => {
    let count = 0;
    for (const entry of data) {
      if (salesBonusConflicts(rows, entry)) {
        if (skipDuplicates) {
          continue;
        }
        throw { code: 'P2002' };
      }
      rows.push(entry);
      count += 1;
    }
    return { count };
  };
  return { rows, prisma: { bonusEntry: { createMany } } };
}

async function persistDualRole(
  prisma: { bonusEntry: { createMany: (args: CreateManyArgs) => Promise<{ count: number }> } },
  rows: SalesBonusAmountRow[],
  invoiceId = INVOICE_ID,
): Promise<boolean> {
  return persistSalesBonusRows(
    prisma as never,
    ORDER,
    DEAL,
    rows,
    SNAPSHOT,
    invoiceId,
    'slot',
    EARNED_PERIOD,
  );
}

describe('buildSalesBonusAmountRows', () => {
  it('keeps both slots when one employee is seller and assistant', () => {
    const rows = buildSalesBonusAmountRows(
      { sellerId: 'emp-1', sellerAssistantId: 'emp-1' },
      { sellerPercent: new Decimal(8), assistantPercent: new Decimal(2) },
      new Decimal(1_000_000),
    );
    expect(rows).toEqual([
      expect.objectContaining({ employeeId: 'emp-1', slot: 'SELLER' }),
      expect.objectContaining({ employeeId: 'emp-1', slot: 'ASSISTANT' }),
    ]);
  });
});

describe('persistSalesBonusRows unique keys', () => {
  it('keeps both slots for the same employee on the same invoice', async () => {
    const store = createUniqueAwareBonusStore();
    const created = await persistDualRole(store.prisma, dualRoleRows('emp-1'));
    expect(created).toBe(true);
    expect(store.rows).toHaveLength(2);
    expect(store.rows.map((row) => row.salesBonusSlot)).toEqual(['SELLER', 'ASSISTANT']);
    expect(store.rows.every((row) => row.employeeId === 'emp-1')).toBe(true);
  });

  it('replay of both slots stays two rows, not four', async () => {
    const store = createUniqueAwareBonusStore();
    const rows = dualRoleRows('emp-1');
    await persistDualRole(store.prisma, rows);
    const createdAgain = await persistDualRole(store.prisma, rows);
    expect(createdAgain).toBe(false);
    expect(store.rows).toHaveLength(2);
  });

  it('still writes the other slot when one slot already exists', async () => {
    const store = createUniqueAwareBonusStore();
    const rows = dualRoleRows('emp-1');
    await persistDualRole(store.prisma, [rows[0]!]);
    expect(store.rows).toHaveLength(1);
    const created = await persistDualRole(store.prisma, rows);
    expect(created).toBe(true);
    expect(store.rows).toHaveLength(2);
    expect(store.rows.map((row) => row.salesBonusSlot)).toEqual(['SELLER', 'ASSISTANT']);
  });

  it('rejects a second seller in the seller slot', async () => {
    const store = createUniqueAwareBonusStore();
    await persistDualRole(store.prisma, [
      {
        employeeId: 'emp-seller',
        slot: 'SELLER',
        amount: new Decimal(80_000),
        percent: new Decimal(8),
      },
    ]);
    const created = await persistDualRole(store.prisma, [
      {
        employeeId: 'emp-other',
        slot: 'SELLER',
        amount: new Decimal(80_000),
        percent: new Decimal(8),
      },
    ]);
    expect(created).toBe(false);
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]?.employeeId).toBe('emp-seller');
  });

  it('keeps recurring accruals on different invoices separate', async () => {
    const store = createUniqueAwareBonusStore();
    const recurring: SalesBonusAmountRow[] = [
      { employeeId: 'emp-1', slot: 'SELLER', amount: new Decimal(5_000), percent: new Decimal(5) },
    ];
    await persistSalesBonusRows(
      store.prisma as never,
      ORDER,
      DEAL,
      recurring,
      SNAPSHOT,
      'inv-recurring-1',
      null,
      EARNED_PERIOD,
    );
    await persistSalesBonusRows(
      store.prisma as never,
      ORDER,
      DEAL,
      recurring,
      SNAPSHOT,
      'inv-recurring-2',
      null,
      EARNED_PERIOD,
    );
    expect(store.rows).toHaveLength(2);
    expect(store.rows.map((row) => row.salesAccrualInvoiceId)).toEqual([
      'inv-recurring-1',
      'inv-recurring-2',
    ]);
  });
});

describe('sales invoice-employee unique migration', () => {
  it('replaces the invoice-employee key with one that includes sales_bonus_slot', () => {
    const sqlPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../../packages/database/prisma/migrations/20260927233000_bonus_entry_sales_invoice_employee_slot_unique/migration.sql',
    );
    const sql = readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('DROP INDEX IF EXISTS "bonus_entries_sales_invoice_employee_unique"');
    expect(sql).toContain('"bonus_entries_sales_invoice_employee_slot_unique"');
    expect(sql).toContain('"sales_bonus_slot"');
    expect(sql).toContain('"bonus_entries_sales_invoice_employee_unslotted_unique"');
  });
});
