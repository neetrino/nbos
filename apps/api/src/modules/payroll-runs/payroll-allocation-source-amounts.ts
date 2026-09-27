import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO, decimalFrom } from '../bonus/bonus-pool-decimal';
import {
  sumBonusEntryReleasedBefore,
  type PayrollBonusReleaseLedgerRow,
} from './payroll-bonus-entry-released-before';
import {
  payrollBonusReleaseBase,
  type PayrollBonusReleaseBaseInput,
} from './payroll-bonus-release-base';

export const PAYROLL_ALLOCATION_MONEY_SCALE = 2;
export const PAYROLL_SOURCE_AMOUNTS_PREFIX = 'nbos:v1:sourceAmounts:';

export type PayrollAllocationSourceAmount = {
  bonusEntryId: string;
  amount: Decimal;
};

export type PayrollAllocationSourceAmountInput = {
  bonusEntryId: string;
  amount: string;
};

export type PayrollAllocationSourceRemainingEntry = PayrollBonusReleaseBaseInput & {
  id: string;
};

export type PayrollAllocationSourceRemainingRelease = PayrollBonusReleaseLedgerRow & {
  bonusEntryId?: string;
};

export function moneyAmount(value: Decimal): Decimal {
  return value.toDecimalPlaces(PAYROLL_ALLOCATION_MONEY_SCALE, Decimal.ROUND_HALF_UP);
}

export function moneyText(value: Decimal): string {
  return moneyAmount(value).toFixed(PAYROLL_ALLOCATION_MONEY_SCALE);
}

export function parsePayrollAllocationSourceAmounts(
  input: PayrollAllocationSourceAmountInput[] | undefined,
): PayrollAllocationSourceAmount[] | null {
  if (input == null) return null;
  if (!Array.isArray(input) || input.length === 0) {
    throw new BadRequestException('sourceAmounts must list each chosen source amount');
  }
  const seen = new Set<string>();
  return input.map((row) => parseOneSourceAmount(row, seen));
}

function parseOneSourceAmount(
  row: PayrollAllocationSourceAmountInput,
  seen: Set<string>,
): PayrollAllocationSourceAmount {
  const bonusEntryId = row.bonusEntryId?.trim() ?? '';
  if (bonusEntryId.length === 0) {
    throw new BadRequestException('sourceAmounts entries require bonusEntryId');
  }
  if (seen.has(bonusEntryId)) {
    throw new BadRequestException('sourceAmounts cannot repeat the same bonus entry');
  }
  seen.add(bonusEntryId);
  const amount = moneyAmount(decimalFrom(row.amount));
  if (!amount.isFinite() || amount.lte(BONUS_POOL_ZERO)) {
    throw new BadRequestException('sourceAmounts amounts must be greater than zero');
  }
  return { bonusEntryId, amount };
}

export function encodePayrollAllocationSourceAmounts(
  splits: PayrollAllocationSourceAmount[] | null,
): string | null {
  if (splits == null || splits.length === 0) return null;
  const payload = splits.map((split) => ({
    bonusEntryId: split.bonusEntryId,
    amount: moneyText(split.amount),
  }));
  return `${PAYROLL_SOURCE_AMOUNTS_PREFIX}${JSON.stringify(payload)}`;
}

export function decodePayrollAllocationSourceAmounts(
  title: string | null,
): PayrollAllocationSourceAmount[] | null {
  if (title == null || !title.startsWith(PAYROLL_SOURCE_AMOUNTS_PREFIX)) {
    return null;
  }
  const raw = title.slice(PAYROLL_SOURCE_AMOUNTS_PREFIX.length);
  const parsed = parseStoredSourceAmountJson(raw);
  return parsePayrollAllocationSourceAmounts(parsed.map((row) => coerceStoredSourceAmount(row)));
}

export function payrollAllocationDraftDisplayTitle(title: string | null): string | null {
  if (title == null || title.startsWith(PAYROLL_SOURCE_AMOUNTS_PREFIX)) return null;
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function remainingForBonusEntry(params: {
  entry: PayrollAllocationSourceRemainingEntry;
  releases: PayrollAllocationSourceRemainingRelease[];
  payrollMonth: string;
  payrollRunId: string;
}): Decimal {
  const planned = payrollBonusReleaseBase(params.entry, params.payrollMonth);
  const scoped = params.releases.filter(
    (release) => release.bonusEntryId == null || release.bonusEntryId === params.entry.id,
  );
  return Decimal.max(
    BONUS_POOL_ZERO,
    planned.minus(sumBonusEntryReleasedBefore(scoped, params.payrollRunId)),
  ).toDecimalPlaces(PAYROLL_ALLOCATION_MONEY_SCALE, Decimal.ROUND_HALF_UP);
}

export function isOwnedPayrollAllocationSourceSplit(params: {
  splits: PayrollAllocationSourceAmount[];
  draftAmount: Decimal;
  owners: Map<string, { employeeId: string; orderId: string }>;
  employeeId: string;
  orderId: string;
}): boolean {
  let total = BONUS_POOL_ZERO;
  for (const split of params.splits) {
    const owner = params.owners.get(split.bonusEntryId);
    if (owner == null) return false;
    if (owner.employeeId !== params.employeeId || owner.orderId !== params.orderId) {
      return false;
    }
    total = total.plus(split.amount);
  }
  return moneyAmount(total).eq(moneyAmount(params.draftAmount));
}

export function assertChosenSourceAmounts(params: {
  splits: PayrollAllocationSourceAmount[];
  cellAmount: Decimal;
  remainingByEntry: Map<string, Decimal>;
  visibleIds: Set<string>;
}): void {
  const cellAmount = moneyAmount(params.cellAmount);
  let total = BONUS_POOL_ZERO;
  for (const split of params.splits) {
    if (!params.visibleIds.has(split.bonusEntryId)) {
      throw new BadRequestException('sourceAmounts must use visible bonus entries');
    }
    const remaining = params.remainingByEntry.get(split.bonusEntryId) ?? BONUS_POOL_ZERO;
    if (split.amount.gt(remaining)) {
      throw new BadRequestException('Draft allocation exceeds remaining bonus amount');
    }
    total = total.plus(split.amount);
  }
  if (!moneyAmount(total).eq(cellAmount)) {
    throw new BadRequestException('sourceAmounts must sum to the cell amount');
  }
}

function parseStoredSourceAmountJson(raw: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new BadRequestException('Stored source amounts are invalid');
    }
    return parsed;
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException('Stored source amounts are invalid');
  }
}

function coerceStoredSourceAmount(row: unknown): PayrollAllocationSourceAmountInput {
  if (row == null || typeof row !== 'object' || Array.isArray(row)) {
    throw new BadRequestException('Stored source amounts are invalid');
  }
  const record = row as Record<string, unknown>;
  if (typeof record.bonusEntryId !== 'string' || typeof record.amount !== 'string') {
    throw new BadRequestException('Stored source amounts are invalid');
  }
  return { bonusEntryId: record.bonusEntryId, amount: record.amount };
}
