import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { moneyAmount } from './payroll-allocation-source-amounts';
import {
  PAYROLL_CASH_NOTES_PREFIX,
  payrollCashMoneyText,
  type PayrollCashBonusPart,
  type SalaryFirstCashAllocation,
} from './payroll-salary-first-cash';

export type EncodedPayrollCashAllocation = {
  salaryAmount: Decimal;
  bonusParts: PayrollCashBonusPart[];
  carryAmount: Decimal;
  idempotencyKey: string | null;
};

export type PayrollCashPaymentNotes = {
  id?: string;
  amount: Decimal;
  notes: string | null;
};

type StoredPayrollCashJson = {
  salaryAmount: string;
  bonusParts: { bonusReleaseId: string; amount: string }[];
  carryAmount?: string;
  idempotencyKey?: string;
};

export function encodePayrollCashNotes(
  allocation: SalaryFirstCashAllocation,
  opts?: { userNotes?: string | null; idempotencyKey?: string | null },
): string {
  const payload: StoredPayrollCashJson = {
    salaryAmount: payrollCashMoneyText(allocation.salaryAmount),
    bonusParts: allocation.bonusParts.map((part) => ({
      bonusReleaseId: part.bonusReleaseId,
      amount: payrollCashMoneyText(part.amount),
    })),
    carryAmount: payrollCashMoneyText(allocation.carryAmount),
  };
  const key = opts?.idempotencyKey?.trim() ?? '';
  if (key.length > 0) {
    payload.idempotencyKey = key;
  }
  const encoded = `${PAYROLL_CASH_NOTES_PREFIX}${JSON.stringify(payload)}`;
  const userNotes = opts?.userNotes?.trim() ?? '';
  return userNotes.length > 0 ? `${encoded}\n${userNotes}` : encoded;
}

export function decodePayrollCashNotes(notes: string | null): EncodedPayrollCashAllocation | null {
  if (notes == null) {
    return null;
  }
  const firstLine = notes.split('\n', 1)[0] ?? '';
  if (!firstLine.startsWith(PAYROLL_CASH_NOTES_PREFIX)) {
    return null;
  }
  const raw = firstLine.slice(PAYROLL_CASH_NOTES_PREFIX.length);
  return parseStoredPayrollCashJson(raw);
}

export function sumEncodedBonusCashByRelease(
  payments: readonly PayrollCashPaymentNotes[],
): Map<string, Decimal> {
  const paid = new Map<string, Decimal>();
  for (const payment of payments) {
    const decoded = decodePayrollCashNotes(payment.notes);
    if (decoded == null) {
      continue;
    }
    addBonusParts(paid, decoded.bonusParts);
  }
  return paid;
}

export function sumEncodedCarryCash(payments: readonly PayrollCashPaymentNotes[]): Decimal {
  return payments.reduce((sum, payment) => {
    const decoded = decodePayrollCashNotes(payment.notes);
    if (decoded == null) {
      return sum;
    }
    return moneyAmount(sum.plus(decoded.carryAmount));
  }, BONUS_POOL_ZERO);
}

export function findPayrollCashPaymentByIdempotencyKey(
  payments: readonly PayrollCashPaymentNotes[],
  idempotencyKey: string | null | undefined,
): PayrollCashPaymentNotes | null {
  const key = idempotencyKey?.trim() ?? '';
  if (key.length === 0) {
    return null;
  }
  for (const payment of payments) {
    const decoded = decodePayrollCashNotes(payment.notes);
    if (decoded?.idempotencyKey === key) {
      return payment;
    }
  }
  return null;
}

export function hasEncodedPayrollCash(payments: readonly { notes?: string | null }[]): boolean {
  return payments.some((payment) => decodePayrollCashNotes(payment.notes ?? null) != null);
}

function addBonusParts(paid: Map<string, Decimal>, parts: readonly PayrollCashBonusPart[]): void {
  for (const part of parts) {
    const previous = paid.get(part.bonusReleaseId) ?? BONUS_POOL_ZERO;
    paid.set(part.bonusReleaseId, moneyAmount(previous.plus(part.amount)));
  }
}

function parseStoredPayrollCashJson(raw: string): EncodedPayrollCashAllocation | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(parsed) || typeof parsed.salaryAmount !== 'string') {
    return null;
  }
  if (!Array.isArray(parsed.bonusParts)) {
    return null;
  }
  const bonusParts: PayrollCashBonusPart[] = [];
  for (const row of parsed.bonusParts) {
    const part = parseStoredBonusPart(row);
    if (part == null) {
      return null;
    }
    bonusParts.push(part);
  }
  const idempotencyKey =
    typeof parsed.idempotencyKey === 'string' && parsed.idempotencyKey.trim().length > 0
      ? parsed.idempotencyKey.trim()
      : null;
  return {
    salaryAmount: moneyAmount(new Decimal(parsed.salaryAmount)),
    bonusParts,
    carryAmount: parseStoredCarryAmount(parsed.carryAmount),
    idempotencyKey,
  };
}

function parseStoredCarryAmount(value: unknown): Decimal {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return BONUS_POOL_ZERO;
  }
  return moneyAmount(new Decimal(value));
}

function parseStoredBonusPart(row: unknown): PayrollCashBonusPart | null {
  if (!isRecord(row)) {
    return null;
  }
  if (typeof row.bonusReleaseId !== 'string' || typeof row.amount !== 'string') {
    return null;
  }
  const bonusReleaseId = row.bonusReleaseId.trim();
  if (bonusReleaseId.length === 0) {
    return null;
  }
  return { bonusReleaseId, amount: moneyAmount(new Decimal(row.amount)) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
