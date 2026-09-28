import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { materializePayrollBonusAllocationDrafts } from './payroll-bonus-allocation-materialize';

vi.mock('./payroll-bonus-release-attach', () => ({
  attachBonusReleasesToPayrollRun: vi.fn().mockResolvedValue([]),
}));

const AUGUST_AMOUNT = new Decimal('40000.00');
const NEWER_AMOUNT = new Decimal('100000.00');

type DraftRow = {
  id: string;
  payrollRunId: string;
  employeeId: string;
  orderId: string;
  projectId: string;
  bonusEntryId: string | null;
  amount: Decimal;
  kind: string;
  title: string | null;
  reason: string | null;
};

type EntryRow = {
  id: string;
  employeeId: string;
  orderId: string;
  type: string;
  amount: Decimal;
  originalAmount: Decimal;
  payableAmount: Decimal;
  earnedPeriod: string;
};

type ReleaseRow = {
  id: string;
  bonusEntryId: string;
  payrollRunId: string | null;
  status: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
};

function augustEntry(): EntryRow {
  return {
    id: 'be-aug',
    employeeId: 'e1',
    orderId: 'o-aug',
    type: 'DELIVERY',
    amount: AUGUST_AMOUNT,
    originalAmount: AUGUST_AMOUNT,
    payableAmount: AUGUST_AMOUNT,
    earnedPeriod: '2026-08',
  };
}

function newerEntry(): EntryRow {
  return {
    id: 'be-sep',
    employeeId: 'e1',
    orderId: 'o-sep',
    type: 'DELIVERY',
    amount: NEWER_AMOUNT,
    originalAmount: NEWER_AMOUNT,
    payableAmount: NEWER_AMOUNT,
    earnedPeriod: '2026-09',
  };
}

function draft(params: Partial<DraftRow> & Pick<DraftRow, 'amount' | 'bonusEntryId'>): DraftRow {
  return {
    id: 'd1',
    payrollRunId: 'pr-oct',
    employeeId: 'e1',
    orderId: params.orderId ?? 'o-aug',
    projectId: 'p1',
    title: null,
    reason: null,
    kind: 'READY',
    ...params,
  };
}

function createTx(params: {
  drafts: DraftRow[];
  entries: Map<string, EntryRow>;
  releases?: ReleaseRow[];
}) {
  const releases = params.releases ?? [];
  let releaseSeq = releases.length;
  const tx = {
    payrollBonusAllocationDraft: {
      findMany: vi.fn().mockResolvedValue(params.drafts),
      deleteMany: vi.fn().mockResolvedValue({ count: params.drafts.length }),
    },
    bonusEntry: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return params.entries.get(where.id) ?? null;
      }),
      findMany: vi.fn(async () => [...params.entries.values()]),
      create: vi.fn(),
      update: vi.fn(),
    },
    bonusRelease: {
      findMany: vi.fn(async ({ where }: { where: { bonusEntryId: string } }) => {
        return releases.filter((row) => row.bonusEntryId === where.bonusEntryId);
      }),
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { bonusEntryId: string; payrollRunId: string; amount: Decimal };
        }) => {
          return (
            releases.find(
              (row) =>
                row.bonusEntryId === where.bonusEntryId &&
                row.payrollRunId === where.payrollRunId &&
                row.amount.eq(where.amount),
            ) ?? null
          );
        },
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        releaseSeq += 1;
        const created: ReleaseRow = {
          id: `rel-${releaseSeq}`,
          bonusEntryId: String(data.bonusEntryId),
          payrollRunId: data.payrollRunId == null ? null : String(data.payrollRunId),
          status: String(data.status),
          amount: data.amount instanceof Decimal ? data.amount : new Decimal(String(data.amount)),
          payrollIncludedAmount: null,
        };
        releases.push(created);
        return created;
      }),
    },
    order: {
      findUnique: vi.fn().mockResolvedValue({ productId: 'prod1', extensionId: null }),
    },
  };
  return { tx, releases, entries: params.entries };
}

describe('P4-S3 materialize older unpaid August 40000 in October', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('releases 40000 in October without copying the August bonus', async () => {
    const entries = new Map([['be-aug', augustEntry()]]);
    const { tx, releases } = createTx({
      drafts: [draft({ amount: AUGUST_AMOUNT, bonusEntryId: 'be-aug' })],
      entries,
    });

    await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr-oct',
      payrollMonth: '2026-10',
      actorUserId: 'emp1',
    });

    expect(entries.get('be-aug')?.earnedPeriod).toBe('2026-08');
    expect(entries.size).toBe(1);
    expect(tx.bonusEntry.create).not.toHaveBeenCalled();
    expect(releases.map((row) => row.amount.toFixed(2))).toEqual(['40000.00']);
    expect(releases[0]?.bonusEntryId).toBe('be-aug');
  });

  it('does not create a second 40000 when the October release is repeated', async () => {
    const entries = new Map([['be-aug', augustEntry()]]);
    const releases: ReleaseRow[] = [
      {
        id: 'rel-existing',
        bonusEntryId: 'be-aug',
        payrollRunId: 'pr-oct',
        status: 'INCLUDED_IN_PAYROLL',
        amount: AUGUST_AMOUNT,
        payrollIncludedAmount: AUGUST_AMOUNT,
      },
    ];
    const sameRun = createTx({
      drafts: [draft({ amount: AUGUST_AMOUNT, bonusEntryId: 'be-aug' })],
      entries,
      releases,
    });
    const sameResult = await materializePayrollBonusAllocationDrafts(sameRun.tx as never, {
      payrollRunId: 'pr-oct',
      payrollMonth: '2026-10',
      actorUserId: 'emp1',
    });
    expect(sameResult.releaseIds).toEqual(['rel-existing']);
    expect(sameRun.tx.bonusRelease.create).not.toHaveBeenCalled();

    const laterRun = createTx({
      drafts: [
        draft({
          payrollRunId: 'pr-nov',
          amount: AUGUST_AMOUNT,
          bonusEntryId: 'be-aug',
        }),
      ],
      entries,
      releases,
    });
    await expect(
      materializePayrollBonusAllocationDrafts(laterRun.tx as never, {
        payrollRunId: 'pr-nov',
        payrollMonth: '2026-11',
        actorUserId: 'emp1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(laterRun.tx.bonusRelease.create).not.toHaveBeenCalled();
    expect(releases.filter((row) => row.bonusEntryId === 'be-aug')).toHaveLength(1);
    expect(entries.get('be-aug')?.earnedPeriod).toBe('2026-08');
  });

  it('does not hide or pay the older 40000 when a newer project is released', async () => {
    const entries = new Map([
      ['be-aug', augustEntry()],
      ['be-sep', newerEntry()],
    ]);
    const { tx, releases } = createTx({
      drafts: [
        draft({
          amount: NEWER_AMOUNT,
          bonusEntryId: 'be-sep',
          orderId: 'o-sep',
        }),
      ],
      entries,
    });

    await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr-oct',
      payrollMonth: '2026-10',
      actorUserId: 'emp1',
    });

    expect(entries.get('be-aug')?.amount.toFixed(2)).toBe('40000.00');
    expect(entries.get('be-aug')?.earnedPeriod).toBe('2026-08');
    expect(releases.filter((row) => row.bonusEntryId === 'be-aug')).toEqual([]);
    expect(
      releases.filter((row) => row.bonusEntryId === 'be-sep').map((row) => row.amount.toFixed(2)),
    ).toEqual(['100000.00']);
  });
});
