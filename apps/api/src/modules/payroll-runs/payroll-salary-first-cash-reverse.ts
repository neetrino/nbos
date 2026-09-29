import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { moneyAmount } from './payroll-allocation-source-amounts';
import { payrollCashMoneyText, type PayrollCashBonusPart } from './payroll-salary-first-cash';
import {
  decodePayrollCashNotes,
  type EncodedPayrollCashAllocation,
  type PayrollCashPaymentNotes,
} from './payroll-salary-first-cash-notes';

export const PAYROLL_CASH_REFUND_NOTES_PREFIX = 'nbos:v1:payrollCashRefund:';

export const PAYROLL_CASH_REVERSE_ERRORS = {
  refundPositive: 'Payroll refund amount must be a positive number',
  residualReasonRequired: 'Payroll residual recovery requires a reason',
  closedHistory: 'Closed payroll history cannot be edited in place',
  originalLinksRequired: 'Payroll refund must reverse the original payment links',
} as const;

/** Pool sync on the remote dev database exceeds Prisma's 5s interactive default. */
export const PAYROLL_CASH_TRANSACTION_TIMEOUT_MS = 15_000;

export type EncodedPayrollCashRefund = {
  salaryAmount: Decimal;
  bonusParts: PayrollCashBonusPart[];
  residualAmount: Decimal;
  sourcePaymentId: string;
  idempotencyKey: string | null;
};

export type PayrollCashNetAttribution = {
  salaryPaid: Decimal;
  bonusPaidById: Map<string, Decimal>;
  carryPaid: Decimal;
  residualAmount: Decimal;
};

type StoredPayrollCashRefundJson = {
  salaryAmount: string;
  bonusParts: { bonusReleaseId: string; amount: string }[];
  residualAmount: string;
  sourcePaymentId: string;
  idempotencyKey?: string;
};

export function restoreOriginalPayrollCashPayment(
  original: EncodedPayrollCashAllocation | null,
): EncodedPayrollCashAllocation {
  if (original == null) {
    return emptyAllocation();
  }
  return {
    salaryAmount: moneyAmount(original.salaryAmount),
    bonusParts: original.bonusParts.map((part) => ({
      bonusReleaseId: part.bonusReleaseId,
      amount: moneyAmount(part.amount),
    })),
    carryAmount: moneyAmount(original.carryAmount),
    idempotencyKey: original.idempotencyKey,
  };
}

export function refundOriginalPayrollBonusCash(input: {
  original: EncodedPayrollCashAllocation;
  refundAmount: Decimal;
  sourcePaymentId: string;
  idempotencyKey?: string | null;
}): EncodedPayrollCashRefund {
  const refund = moneyAmount(input.refundAmount);
  if (!refund.isFinite() || refund.lte(BONUS_POOL_ZERO)) {
    throw new BadRequestException(PAYROLL_CASH_REVERSE_ERRORS.refundPositive);
  }
  const bonusCash = sumBonusParts(input.original.bonusParts);
  const restoredBonus = moneyAmount(Decimal.min(refund, bonusCash));
  return {
    salaryAmount: BONUS_POOL_ZERO,
    bonusParts: takeOriginalBonusPartsUpTo(input.original.bonusParts, restoredBonus),
    residualAmount: moneyAmount(Decimal.max(BONUS_POOL_ZERO, refund.minus(restoredBonus))),
    sourcePaymentId: input.sourcePaymentId,
    idempotencyKey: input.idempotencyKey?.trim() ? input.idempotencyKey.trim() : null,
  };
}

export function encodePayrollCashRefundNotes(
  refund: EncodedPayrollCashRefund,
  reason?: string | null,
): string {
  const payload: StoredPayrollCashRefundJson = {
    salaryAmount: payrollCashMoneyText(refund.salaryAmount),
    bonusParts: refund.bonusParts.map((part) => ({
      bonusReleaseId: part.bonusReleaseId,
      amount: payrollCashMoneyText(part.amount),
    })),
    residualAmount: payrollCashMoneyText(refund.residualAmount),
    sourcePaymentId: refund.sourcePaymentId,
  };
  if (refund.idempotencyKey != null) {
    payload.idempotencyKey = refund.idempotencyKey;
  }
  const encoded = `${PAYROLL_CASH_REFUND_NOTES_PREFIX}${JSON.stringify(payload)}`;
  const reasonText = reason?.trim() ?? '';
  return reasonText.length > 0 ? `${encoded}\n${reasonText}` : encoded;
}

export function decodePayrollCashRefundNotes(
  notes: string | null,
): EncodedPayrollCashRefund | null {
  if (notes == null) {
    return null;
  }
  const firstLine = notes.split('\n', 1)[0] ?? '';
  if (!firstLine.startsWith(PAYROLL_CASH_REFUND_NOTES_PREFIX)) {
    return null;
  }
  return parseStoredPayrollCashRefundJson(firstLine.slice(PAYROLL_CASH_REFUND_NOTES_PREFIX.length));
}

export function netPayrollCashAttribution(
  payments: readonly PayrollCashPaymentNotes[],
): PayrollCashNetAttribution {
  const bonusPaidById = new Map<string, Decimal>();
  let salaryPaid = BONUS_POOL_ZERO;
  let carryPaid = BONUS_POOL_ZERO;
  let residualAmount = BONUS_POOL_ZERO;
  const sourceIds = sourcePayoutIds(payments);
  const appliedSources = new Set<string>();
  for (const payment of payments) {
    const payout = decodePayrollCashNotes(payment.notes);
    if (payout != null) {
      salaryPaid = moneyAmount(salaryPaid.plus(payout.salaryAmount));
      carryPaid = moneyAmount(carryPaid.plus(payout.carryAmount));
      addBonusParts(bonusPaidById, payout.bonusParts, 1);
    }
    const refund = decodePayrollCashRefundNotes(payment.notes);
    if (refund == null || appliedSources.has(refund.sourcePaymentId)) {
      continue;
    }
    appliedSources.add(refund.sourcePaymentId);
    residualAmount = moneyAmount(residualAmount.plus(refund.residualAmount));
    if (!sourceIds.has(refund.sourcePaymentId)) {
      continue;
    }
    salaryPaid = moneyAmount(salaryPaid.minus(refund.salaryAmount));
    addBonusParts(bonusPaidById, refund.bonusParts, -1);
  }
  return {
    salaryPaid: moneyAmount(Decimal.max(BONUS_POOL_ZERO, salaryPaid)),
    bonusPaidById,
    carryPaid: moneyAmount(Decimal.max(BONUS_POOL_ZERO, carryPaid)),
    residualAmount,
  };
}

export function sumNetEncodedBonusCashByRelease(
  payments: readonly PayrollCashPaymentNotes[],
): Map<string, Decimal> {
  const paid = netPayrollCashAttribution(payments).bonusPaidById;
  for (const [id, amount] of paid) {
    paid.set(id, moneyAmount(Decimal.max(BONUS_POOL_ZERO, amount)));
  }
  return paid;
}

export function encodedBonusReleaseIds(payments: readonly PayrollCashPaymentNotes[]): Set<string> {
  const ids = new Set<string>();
  for (const payment of payments) {
    const payout = decodePayrollCashNotes(payment.notes);
    for (const part of payout?.bonusParts ?? []) {
      ids.add(part.bonusReleaseId);
    }
    const refund = decodePayrollCashRefundNotes(payment.notes);
    for (const part of refund?.bonusParts ?? []) {
      ids.add(part.bonusReleaseId);
    }
  }
  return ids;
}

export function findPayrollCashRefundForSource(
  payments: readonly PayrollCashPaymentNotes[],
  sourcePaymentId: string,
): PayrollCashPaymentNotes | null {
  for (const payment of payments) {
    const decoded = decodePayrollCashRefundNotes(payment.notes);
    if (decoded?.sourcePaymentId === sourcePaymentId) {
      return payment;
    }
  }
  return null;
}

function sourcePayoutIds(payments: readonly PayrollCashPaymentNotes[]): Set<string> {
  const ids = new Set<string>();
  for (const payment of payments) {
    if (payment.id != null && decodePayrollCashNotes(payment.notes) != null) {
      ids.add(payment.id);
    }
  }
  return ids;
}

function takeOriginalBonusPartsUpTo(
  parts: readonly PayrollCashBonusPart[],
  limit: Decimal,
): PayrollCashBonusPart[] {
  let remaining = moneyAmount(limit);
  const restored: PayrollCashBonusPart[] = [];
  for (const part of parts) {
    if (remaining.lte(BONUS_POOL_ZERO)) {
      break;
    }
    const take = moneyAmount(Decimal.min(part.amount, remaining));
    if (take.lte(BONUS_POOL_ZERO)) {
      continue;
    }
    restored.push({ bonusReleaseId: part.bonusReleaseId, amount: take });
    remaining = moneyAmount(remaining.minus(take));
  }
  return restored;
}

function addBonusParts(
  paid: Map<string, Decimal>,
  parts: readonly PayrollCashBonusPart[],
  sign: 1 | -1,
): void {
  for (const part of parts) {
    const previous = paid.get(part.bonusReleaseId) ?? BONUS_POOL_ZERO;
    paid.set(part.bonusReleaseId, moneyAmount(previous.plus(part.amount.times(sign))));
  }
}

function sumBonusParts(parts: readonly PayrollCashBonusPart[]): Decimal {
  return moneyAmount(parts.reduce((sum, part) => sum.plus(part.amount), BONUS_POOL_ZERO));
}

function emptyAllocation(): EncodedPayrollCashAllocation {
  return {
    salaryAmount: BONUS_POOL_ZERO,
    bonusParts: [],
    carryAmount: BONUS_POOL_ZERO,
    idempotencyKey: null,
  };
}

function parseStoredPayrollCashRefundJson(raw: string): EncodedPayrollCashRefund | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(parsed) || typeof parsed.sourcePaymentId !== 'string') {
    return null;
  }
  if (typeof parsed.residualAmount !== 'string' || !Array.isArray(parsed.bonusParts)) {
    return null;
  }
  const bonusParts: PayrollCashBonusPart[] = [];
  for (const row of parsed.bonusParts) {
    if (
      !isRecord(row) ||
      typeof row.bonusReleaseId !== 'string' ||
      typeof row.amount !== 'string'
    ) {
      return null;
    }
    const bonusReleaseId = row.bonusReleaseId.trim();
    if (bonusReleaseId.length === 0) {
      return null;
    }
    bonusParts.push({ bonusReleaseId, amount: moneyAmount(new Decimal(row.amount)) });
  }
  const key =
    typeof parsed.idempotencyKey === 'string' && parsed.idempotencyKey.trim().length > 0
      ? parsed.idempotencyKey.trim()
      : null;
  return {
    salaryAmount: BONUS_POOL_ZERO,
    bonusParts,
    residualAmount: moneyAmount(new Decimal(parsed.residualAmount)),
    sourcePaymentId: parsed.sourcePaymentId.trim(),
    idempotencyKey: key,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
