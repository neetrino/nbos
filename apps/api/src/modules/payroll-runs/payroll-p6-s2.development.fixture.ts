import { Decimal } from '@nbos/database';
import { vi } from 'vitest';

export type P6S2BonusEntry = {
  id: string;
  employeeId: string;
  orderId: string;
  type: string;
  amount: Decimal;
  originalAmount: Decimal;
  payableAmount: Decimal;
  earnedPeriod: string;
  payableAdjustment: Decimal;
  calculationSnapshot?: unknown;
};

export type P6S2BonusRelease = {
  bonusEntryId: string;
  payrollRunId: string | null;
  status: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
};

export type P6S2ResolveDraft = {
  kind: string;
  title: string | null;
  bonusEntryId: string | null;
  employeeId: string;
  orderId: string;
  projectId: string;
  amount: Decimal;
};

const ZERO = new Decimal('0');

export function p6S2PlanEntry(amount: Decimal): P6S2BonusEntry {
  return {
    id: 'be-plan',
    employeeId: 'e1',
    orderId: 'o1',
    type: 'DELIVERY',
    amount,
    originalAmount: amount,
    payableAmount: amount,
    earnedPeriod: '2026-04',
    payableAdjustment: ZERO,
  };
}

export function p6S2PlanRelease(
  payrollRunId: string,
  amount: Decimal,
  status = 'INCLUDED_IN_PAYROLL',
): P6S2BonusRelease {
  return {
    bonusEntryId: 'be-plan',
    payrollRunId,
    status,
    amount,
    payrollIncludedAmount: amount,
  };
}

export function p6S2ExtraDraft(amount: Decimal): P6S2ResolveDraft {
  return {
    kind: 'EXTRA_BONUS',
    title: null,
    bonusEntryId: 'be-plan',
    employeeId: 'e1',
    orderId: 'o1',
    projectId: 'p1',
    amount,
  };
}

export function createP6S2ResolveTx(params: {
  entries: Map<string, P6S2BonusEntry>;
  releases: P6S2BonusRelease[];
}): { tx: Record<string, unknown>; entries: Map<string, P6S2BonusEntry> } {
  let extraSeq = 0;
  const tx = {
    bonusEntry: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return params.entries.get(where.id) ?? null;
      }),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        return listBonusEntries(params.entries, where);
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        extraSeq += 1;
        const created = createdExtraEntry(`extra-${extraSeq}`, data);
        params.entries.set(created.id, created);
        return created;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: object }) => {
        const existing = params.entries.get(where.id);
        if (existing == null) return null;
        Object.assign(existing, data);
        return existing;
      }),
    },
    bonusRelease: {
      findMany: vi.fn(async ({ where }: { where: { bonusEntryId: string } }) => {
        return params.releases.filter((row) => row.bonusEntryId === where.bonusEntryId);
      }),
    },
  };
  return { tx, entries: params.entries };
}

function listBonusEntries(
  entries: Map<string, P6S2BonusEntry>,
  where: Record<string, unknown>,
): P6S2BonusEntry[] {
  const ids = (where.id as { in?: string[] } | undefined)?.in;
  if (ids != null) {
    return [...entries.values()].filter((entry) => ids.includes(entry.id));
  }
  const amount = where.amount as Decimal | undefined;
  if (amount != null) {
    return extraMatches(entries, amount);
  }
  return visibleMatches(entries, where);
}

function extraMatches(entries: Map<string, P6S2BonusEntry>, amount: Decimal): P6S2BonusEntry[] {
  return [...entries.values()].filter((entry) => {
    const snapshot = entry.calculationSnapshot as { payrollExtraAward?: boolean } | undefined;
    return entry.amount.eq(amount) && snapshot?.payrollExtraAward === true;
  });
}

function visibleMatches(
  entries: Map<string, P6S2BonusEntry>,
  where: Record<string, unknown>,
): P6S2BonusEntry[] {
  const employeeId = where.employeeId as string | undefined;
  const orderId = where.orderId as string | undefined;
  return [...entries.values()].filter(
    (entry) =>
      (employeeId == null || entry.employeeId === employeeId) &&
      (orderId == null || entry.orderId === orderId),
  );
}

function createdExtraEntry(id: string, data: Record<string, unknown>): P6S2BonusEntry {
  const amount = decimalAmount(data.amount);
  return {
    id,
    employeeId: String(data.employeeId),
    orderId: String(data.orderId),
    type: String(data.type),
    amount,
    originalAmount: decimalAmount(data.originalAmount ?? data.amount),
    payableAmount: amount,
    earnedPeriod: String(data.earnedPeriod),
    payableAdjustment: ZERO,
    calculationSnapshot: data.calculationSnapshot,
  };
}

function decimalAmount(value: unknown): Decimal {
  return value instanceof Decimal ? value : new Decimal(String(value));
}
