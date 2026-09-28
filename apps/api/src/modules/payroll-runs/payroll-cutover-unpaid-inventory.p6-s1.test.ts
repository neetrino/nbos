import { beforeEach, describe, expect, it } from 'vitest';

import type { MockPrisma } from '../../test-utils/mock-prisma';
import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { moneyAmount, moneyText } from './payroll-allocation-source-amounts';
import {
  buildCutoverUnpaidInventory,
  loadCutoverUnpaidInventory,
} from './payroll-cutover-unpaid-inventory';
import {
  P6_S1_CARRY,
  P6_S1_CARRY_AFTER_USE,
  P6_S1_CARRY_EMPLOYEE_ID,
  P6_S1_CARRY_ENTRY_ID,
  P6_S1_CARRY_RELEASE_ID,
  P6_S1_CLOSED_EMPLOYEE_ID,
  P6_S1_CLOSED_ENTRY_ID,
  P6_S1_CLOSED_RELEASE_ID,
  P6_S1_INCLUDED_EMPLOYEE_ID,
  P6_S1_INCLUDED_ENTRY_ID,
  P6_S1_INCLUDED_RELEASE,
  P6_S1_INCLUDED_RELEASE_ID,
  P6_S1_INCLUDED_REMAINING,
  P6_S1_PARTIAL_CARRY_EMPLOYEE_ID,
  P6_S1_PARTIAL_CARRY_ENTRY_ID,
  P6_S1_PARTIAL_CARRY_RELEASE_ID,
  P6_S1_USED_CARRY_EMPLOYEE_ID,
  P6_S1_USED_CARRY_ENTRY_ID,
  P6_S1_USED_CARRY_RELEASE_ID,
  P6_S1_BURNED_EMPLOYEE_ID,
  P6_S1_BURNED_ENTRY_ID,
  P6_S1_REATTACH_EMPLOYEE_ID,
  P6_S1_REATTACH_ENTRY_ID,
  P6_S1_SPLIT_CARRY,
  P6_S1_SPLIT_EMPLOYEE_ID,
  P6_S1_SPLIT_ENTRY_ID,
  P6_S1_SPLIT_OWED,
  P6_S1_SPLIT_REATTACH_INCLUDED,
  P6_S1_SPLIT_UNRELEASED,
  P6_S1_OLDER_EMPLOYEE_ID,
  P6_S1_OLDER_ENTRY_ID,
  P6_S1_OLDER_UNPAID,
  P6_S1_PAID_LINE_ID,
  P6_S1_PAID_SALARY,
  P6_S1_PARTIAL_EMPLOYEE_ID,
  P6_S1_PARTIAL_ENTRY_ID,
  P6_S1_PARTIAL_PLANNED,
  P6_S1_PARTIAL_REMAINING,
  P6_S1_RESIDUAL,
  P6_S1_RESIDUAL_PAYMENT_ID,
} from './payroll-cutover-unpaid-inventory.p6-s1.amounts';
import { kpiBurnedOpenIncludedSnapshots } from './payroll-cutover-unpaid-inventory.p6-s1.burned';
import {
  splitCarryAndUnreleasedSnapshots,
  splitCarryReattachedSnapshots,
} from './payroll-cutover-unpaid-inventory.p6-s1.split-carry';
import {
  fullyConsumedCarrySnapshots,
  partiallyConsumedCarrySnapshots,
} from './payroll-cutover-unpaid-inventory.p6-s1.consumed-carry';
import {
  createP6S1InventoryFixture,
  type P6S1InventoryFixture,
} from './payroll-cutover-unpaid-inventory.p6-s1.fixture';
import type { CutoverUnpaidInventory } from './payroll-cutover-unpaid-inventory.types';

const MONEY_MODELS = [
  'bonusEntry',
  'bonusRelease',
  'salaryLine',
  'expensePayment',
  'expense',
  'payrollRun',
  'productBonusPool',
  'operationalJournalEntry',
] as const;

describe('P6-S1 read-only inventory of old unpaid balances', () => {
  let fixture: P6S1InventoryFixture;

  beforeEach(() => {
    fixture = createP6S1InventoryFixture();
  });

  it('lists a 40000 unpaid older bonus as 40000, not 0', async () => {
    const inventory = await loadCutoverUnpaidInventory(fixture.prisma);
    const older = rowBySource(inventory.unpaidBonuses, P6_S1_OLDER_ENTRY_ID);

    expect(older?.amount.toFixed(2)).toBe(P6_S1_OLDER_UNPAID.toFixed(2));
    expect(older?.earnedPeriod).toBe('2026-08');
    expect(older?.employeeId).toBe('emp-aug');
    expect(older?.amount.toFixed(2)).not.toBe('0.00');
    expectNoMoneyWrites(fixture.prisma);
  });

  it('lists remaining 40000 of a 200000 bonus after 160000 attributed cash', async () => {
    const inventory = await loadCutoverUnpaidInventory(fixture.prisma);
    const partial = rowBySource(inventory.unpaidBonuses, P6_S1_PARTIAL_ENTRY_ID);

    expect(partial?.amount.toFixed(2)).toBe(P6_S1_PARTIAL_REMAINING.toFixed(2));
    expect(partial?.plannedAmount?.toFixed(2)).toBe(P6_S1_PARTIAL_PLANNED.toFixed(2));
    expect(partial?.attributedPaidCash?.toFixed(2)).toBe('160000.00');
    expect(partial?.status).toBe('PAID');
    expect(partial?.amount.toFixed(2)).not.toBe('0.00');
    expect(partial?.amount.toFixed(2)).not.toBe(P6_S1_PARTIAL_PLANNED.toFixed(2));
  });

  it('lists included remaining 40000 of 60000 with status INCLUDED_IN_PAYROLL', async () => {
    const inventory = await loadCutoverUnpaidInventory(fixture.prisma);
    const included = rowBySource(inventory.includedUnpaidReleases, P6_S1_INCLUDED_RELEASE_ID);

    expect(included?.amount.toFixed(2)).toBe(P6_S1_INCLUDED_REMAINING.toFixed(2));
    expect(included?.plannedAmount?.toFixed(2)).toBe(P6_S1_INCLUDED_RELEASE.toFixed(2));
    expect(included?.plannedAmount?.toFixed(2)).not.toBe('80000.00');
    expect(included?.attributedPaidCash?.toFixed(2)).toBe('20000.00');
    expect(included?.status).toBe('INCLUDED_IN_PAYROLL');
    expect(rowBySource(inventory.unpaidBonuses, P6_S1_INCLUDED_ENTRY_ID)).toBeUndefined();
  });

  it('lists leftover carry 100000 and leaves it present after the inventory runs', async () => {
    const before = fixture.carryRelease.payrollCarryOverAmount?.toFixed(2);
    const inventory = await loadCutoverUnpaidInventory(fixture.prisma);
    const carry = rowBySource(inventory.leftoverSalaryCapCarry, P6_S1_CARRY_RELEASE_ID);

    expect(carry?.amount.toFixed(2)).toBe(P6_S1_CARRY.toFixed(2));
    expect(rowBySource(inventory.unpaidBonuses, P6_S1_CARRY_ENTRY_ID)).toBeUndefined();
    expect(
      fixture.payments.some((payment) => payment.notes?.includes(P6_S1_CARRY_RELEASE_ID)),
    ).toBe(false);
    expect(before).toBe(P6_S1_CARRY.toFixed(2));
    expect(fixture.carryRelease.payrollCarryOverAmount?.toFixed(2)).toBe(P6_S1_CARRY.toFixed(2));
    expect(fixture.carryRelease.payrollCarryOverRemaining?.toFixed(2)).toBe(P6_S1_CARRY.toFixed(2));
    expectNoMoneyWrites(fixture.prisma);
  });

  it('lists unapplied residual 30000 separately from bonus remaining', async () => {
    const inventory = await loadCutoverUnpaidInventory(fixture.prisma);
    const residual = rowBySource(inventory.unappliedRefundResiduals, P6_S1_RESIDUAL_PAYMENT_ID);
    const bonusAmounts = inventory.unpaidBonuses.map((row) => row.amount.toFixed(2));

    expect(residual?.amount.toFixed(2)).toBe(P6_S1_RESIDUAL.toFixed(2));
    expect(bonusAmounts).not.toContain(P6_S1_RESIDUAL.toFixed(2));
    expect(residual?.explanation).toContain('fixed salary');
  });

  it('lists a PAID 300000 salary as already settled and not as unpaid', async () => {
    const inventory = await loadCutoverUnpaidInventory(fixture.prisma);
    const settled = rowBySource(inventory.alreadySettled, P6_S1_PAID_LINE_ID);
    const unpaidAmounts = unpaidOfferedAmounts(inventory);

    expect(settled?.amount.toFixed(2)).toBe(P6_S1_PAID_SALARY.toFixed(2));
    expect(settled?.status).toBe('PAID');
    expect(unpaidAmounts).not.toContain(moneyText(P6_S1_PAID_SALARY));
    expect(unpaidAmounts).not.toContain(P6_S1_PAID_LINE_ID);
    expectNoMoneyWrites(fixture.prisma);
  });

  it('sums one employee owed cash once across unpaid, included, and leftover carry', async () => {
    const inventory = await loadCutoverUnpaidInventory(fixture.prisma);

    expect(owedCash(inventory, P6_S1_INCLUDED_EMPLOYEE_ID)).toBe(
      P6_S1_INCLUDED_REMAINING.toFixed(2),
    );
    expect(owedCash(inventory, P6_S1_OLDER_EMPLOYEE_ID)).toBe(P6_S1_OLDER_UNPAID.toFixed(2));
    expect(owedCash(inventory, P6_S1_PARTIAL_EMPLOYEE_ID)).toBe(P6_S1_PARTIAL_REMAINING.toFixed(2));
    expect(owedCash(inventory, P6_S1_CARRY_EMPLOYEE_ID)).toBe(P6_S1_CARRY.toFixed(2));
    expect(owedCash(inventory, P6_S1_CLOSED_EMPLOYEE_ID)).toBe(P6_S1_INCLUDED_REMAINING.toFixed(2));
    expect(owedCash(inventory, P6_S1_INCLUDED_EMPLOYEE_ID)).not.toBe('80000.00');
  });

  it('lists a CLOSED-run included remaining once and not as a new payable', async () => {
    const inventory = await loadCutoverUnpaidInventory(fixture.prisma);
    const owed = owedRows(inventory, P6_S1_CLOSED_EMPLOYEE_ID);

    expect(owed).toHaveLength(1);
    expect(owed[0]?.kind).toBe('UNPAID_BONUS');
    expect(owed[0]?.sourceId).toBe(P6_S1_CLOSED_ENTRY_ID);
    expect(owed[0]?.amount.toFixed(2)).toBe(P6_S1_INCLUDED_REMAINING.toFixed(2));
    expect(rowBySource(inventory.includedUnpaidReleases, P6_S1_CLOSED_RELEASE_ID)).toBeUndefined();
  });

  it('lists leftover 40000 after 60000 consumed carry and no unpaid bonus', () => {
    const inventory = buildCutoverUnpaidInventory(partiallyConsumedCarrySnapshots());
    const leftover = rowBySource(inventory.leftoverSalaryCapCarry, P6_S1_PARTIAL_CARRY_RELEASE_ID);

    expect(leftover?.amount.toFixed(2)).toBe(P6_S1_CARRY_AFTER_USE.toFixed(2));
    expect(rowBySource(inventory.unpaidBonuses, P6_S1_PARTIAL_CARRY_ENTRY_ID)).toBeUndefined();
    expect(owedCash(inventory, P6_S1_PARTIAL_CARRY_EMPLOYEE_ID)).toBe(
      P6_S1_CARRY_AFTER_USE.toFixed(2),
    );
    expect(owedCash(inventory, P6_S1_PARTIAL_CARRY_EMPLOYEE_ID)).not.toBe(P6_S1_CARRY.toFixed(2));
  });

  it('lists no leftover and no unpaid bonus after 100000 carry is fully used', () => {
    const inventory = buildCutoverUnpaidInventory(fullyConsumedCarrySnapshots());

    expect(
      rowBySource(inventory.leftoverSalaryCapCarry, P6_S1_USED_CARRY_RELEASE_ID),
    ).toBeUndefined();
    expect(rowBySource(inventory.unpaidBonuses, P6_S1_USED_CARRY_ENTRY_ID)).toBeUndefined();
    expect(owedCash(inventory, P6_S1_USED_CARRY_EMPLOYEE_ID)).toBe('0.00');
  });

  it('does not list KPI-burned 20000 as unpaid when included remaining is 40000', () => {
    const inventory = buildCutoverUnpaidInventory(kpiBurnedOpenIncludedSnapshots());

    expect(owedCash(inventory, P6_S1_BURNED_EMPLOYEE_ID)).toBe(P6_S1_INCLUDED_REMAINING.toFixed(2));
    expect(owedCash(inventory, P6_S1_BURNED_EMPLOYEE_ID)).not.toBe('60000.00');
    expect(rowBySource(inventory.unpaidBonuses, P6_S1_BURNED_ENTRY_ID)).toBeUndefined();
    expect(inventory.includedUnpaidReleases[0]?.amount.toFixed(2)).toBe(
      P6_S1_INCLUDED_REMAINING.toFixed(2),
    );
  });

  it('lists leftover 70000 plus unpaid 100000 for a 200000 entry', () => {
    const inventory = buildCutoverUnpaidInventory(splitCarryAndUnreleasedSnapshots());
    const leftover = inventory.leftoverSalaryCapCarry[0];
    const unpaid = rowBySource(inventory.unpaidBonuses, P6_S1_SPLIT_ENTRY_ID);

    expect(leftover?.amount.toFixed(2)).toBe(P6_S1_SPLIT_CARRY.toFixed(2));
    expect(unpaid?.amount.toFixed(2)).toBe(P6_S1_SPLIT_UNRELEASED.toFixed(2));
    expect(owedCash(inventory, P6_S1_SPLIT_EMPLOYEE_ID)).toBe(P6_S1_SPLIT_OWED.toFixed(2));
    expect(owedCash(inventory, P6_S1_SPLIT_EMPLOYEE_ID)).not.toBe('100000.00');
  });

  it('keeps unpaid 100000 after 60000 carry was used and 40000 re-attached', () => {
    const inventory = buildCutoverUnpaidInventory(splitCarryReattachedSnapshots());
    const unpaid = rowBySource(inventory.unpaidBonuses, P6_S1_REATTACH_ENTRY_ID);

    expect(unpaid?.amount.toFixed(2)).toBe(P6_S1_SPLIT_UNRELEASED.toFixed(2));
    expect(inventory.leftoverSalaryCapCarry).toEqual([]);
    expect(inventory.includedUnpaidReleases[0]?.amount.toFixed(2)).toBe(
      P6_S1_SPLIT_REATTACH_INCLUDED.toFixed(2),
    );
    expect(owedCash(inventory, P6_S1_REATTACH_EMPLOYEE_ID)).not.toBe('40000.00');
  });
});

function unpaidOfferedAmounts(inventory: CutoverUnpaidInventory): string[] {
  return [
    ...inventory.unpaidBonuses,
    ...inventory.includedUnpaidReleases,
    ...inventory.leftoverSalaryCapCarry,
    ...inventory.unappliedRefundResiduals,
  ].flatMap((row) => [row.amount.toFixed(2), row.sourceId]);
}

function owedRows(
  inventory: CutoverUnpaidInventory,
  employeeId: string,
): CutoverUnpaidInventory['unpaidBonuses'] {
  return [
    ...inventory.unpaidBonuses,
    ...inventory.includedUnpaidReleases,
    ...inventory.leftoverSalaryCapCarry,
  ].filter((row) => row.employeeId === employeeId);
}

function owedCash(inventory: CutoverUnpaidInventory, employeeId: string): string {
  const total = owedRows(inventory, employeeId).reduce(
    (sum, row) => moneyAmount(sum.plus(row.amount)),
    BONUS_POOL_ZERO,
  );
  return total.toFixed(2);
}

function rowBySource(
  rows: CutoverUnpaidInventory['unpaidBonuses'],
  sourceId: string,
): CutoverUnpaidInventory['unpaidBonuses'][number] | undefined {
  return rows.find((row) => row.sourceId === sourceId);
}

function expectNoMoneyWrites(prisma: MockPrisma): void {
  for (const name of MONEY_MODELS) {
    const model = prisma[name];
    expect(model.create).not.toHaveBeenCalled();
    expect(model.createMany).not.toHaveBeenCalled();
    expect(model.update).not.toHaveBeenCalled();
    expect(model.updateMany).not.toHaveBeenCalled();
    expect(model.upsert).not.toHaveBeenCalled();
    expect(model.delete).not.toHaveBeenCalled();
    expect(model.deleteMany).not.toHaveBeenCalled();
  }
  expect(prisma.$executeRaw).not.toHaveBeenCalled();
  expect(prisma.$transaction).not.toHaveBeenCalled();
}
