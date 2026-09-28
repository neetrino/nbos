import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { encodePayrollAllocationSourceAmounts } from './payroll-allocation-source-amounts';
import { materializePayrollBonusAllocationDrafts } from './payroll-bonus-allocation-materialize';

vi.mock('./payroll-bonus-release-attach', () => ({
  attachBonusReleasesToPayrollRun: vi.fn().mockResolvedValue([]),
}));

const PLAN_AMOUNT = new Decimal('200000.00');
const EXTRA_AMOUNT = new Decimal('30000.00');
const INSTALLMENTS = [
  new Decimal('40000.00'),
  new Decimal('10000.00'),
  new Decimal('120000.00'),
] as const;
const PLAN_REMAINDER = new Decimal('30000.00');

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
  calculationSnapshot?: unknown;
};

type ReleaseRow = {
  id: string;
  bonusEntryId: string;
  payrollRunId: string | null;
  status: string;
  amount: Decimal;
  payrollIncludedAmount: Decimal | null;
  releaseType?: string;
};

function planEntry(id = 'be-plan'): EntryRow {
  return {
    id,
    employeeId: 'e1',
    orderId: 'o1',
    type: 'DELIVERY',
    amount: PLAN_AMOUNT,
    originalAmount: PLAN_AMOUNT,
    payableAmount: PLAN_AMOUNT,
    earnedPeriod: '2026-04',
  };
}

function sourceEntry(
  id: string,
  amount: Decimal,
  owner: { employeeId?: string; orderId?: string } = {},
): EntryRow {
  return {
    id,
    employeeId: owner.employeeId ?? 'e1',
    orderId: owner.orderId ?? 'o1',
    type: 'DELIVERY',
    amount,
    originalAmount: amount,
    payableAmount: amount,
    earnedPeriod: '2026-04',
  };
}

function draft(params: Partial<DraftRow> & Pick<DraftRow, 'amount' | 'kind'>): DraftRow {
  return {
    id: 'd1',
    payrollRunId: 'pr1',
    employeeId: 'e1',
    orderId: 'o1',
    projectId: 'p1',
    bonusEntryId: 'be-plan',
    title: null,
    reason: null,
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
  let extraSeq = 0;
  const tx = {
    payrollBonusAllocationDraft: {
      findMany: vi.fn().mockResolvedValue(params.drafts),
      deleteMany: vi.fn().mockResolvedValue({ count: params.drafts.length }),
    },
    bonusEntry: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return params.entries.get(where.id) ?? null;
      }),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        const ids = (where.id as { in?: string[] } | undefined)?.in;
        if (ids != null) {
          return [...params.entries.values()].filter((entry) => ids.includes(entry.id));
        }
        const amount = where.amount as Decimal | undefined;
        const employeeId = where.employeeId as string | undefined;
        const orderId = where.orderId as string | undefined;
        if (amount != null) {
          return [...params.entries.values()].filter(
            (entry) =>
              entry.amount.eq(amount) &&
              (entry.calculationSnapshot as { payrollExtraAward?: boolean } | undefined)
                ?.payrollExtraAward === true,
          );
        }
        return [...params.entries.values()].filter(
          (entry) =>
            (employeeId == null || entry.employeeId === employeeId) &&
            (orderId == null || entry.orderId === orderId),
        );
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        extraSeq += 1;
        const created: EntryRow = {
          id: `extra-${extraSeq}`,
          employeeId: String(data.employeeId),
          orderId: String(data.orderId),
          type: String(data.type),
          amount: decimalAmount(data.amount),
          originalAmount: decimalAmount(data.originalAmount ?? data.amount),
          payableAmount: decimalAmount(data.amount),
          earnedPeriod: String(data.earnedPeriod),
          calculationSnapshot: data.calculationSnapshot,
        };
        params.entries.set(created.id, created);
        return created;
      }),
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
          amount: decimalAmount(data.amount),
          payrollIncludedAmount: null,
          releaseType: String(data.releaseType),
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

function decimalAmount(value: unknown): Decimal {
  return value instanceof Decimal ? value : new Decimal(String(value));
}

function economicRemaining(entryAmount: Decimal, entryReleases: ReleaseRow[]): Decimal {
  const spent = entryReleases.reduce((sum, row) => sum.plus(row.amount), new Decimal(0));
  return Decimal.max(new Decimal(0), entryAmount.minus(spent));
}

describe('P4-S2 development installments extra award and source split', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('releases 40000 then 10000 then 120000 leaving 30000 on a 200000 plan', async () => {
    const entries = new Map([['be-plan', planEntry()]]);
    const releases: ReleaseRow[] = [];
    const months = [
      { runId: 'pr-m1', amount: INSTALLMENTS[0] },
      { runId: 'pr-m2', amount: INSTALLMENTS[1] },
      { runId: 'pr-m3', amount: INSTALLMENTS[2] },
    ];

    for (const month of months) {
      const { tx } = createTx({
        drafts: [
          draft({
            payrollRunId: month.runId,
            amount: month.amount,
            kind: 'READY',
          }),
        ],
        entries,
        releases,
      });
      await materializePayrollBonusAllocationDrafts(tx as never, {
        payrollRunId: month.runId,
        payrollMonth: '2026-05',
        actorUserId: 'emp1',
      });
    }

    expect(entries.get('be-plan')?.amount.toFixed(2)).toBe('200000.00');
    const planReleases = releases.filter((row) => row.bonusEntryId === 'be-plan');
    expect(planReleases.map((row) => row.amount.toFixed(2))).toEqual([
      '40000.00',
      '10000.00',
      '120000.00',
    ]);
    expect(economicRemaining(PLAN_AMOUNT, planReleases).toFixed(2)).toBe('30000.00');

    const over = createTx({
      drafts: [draft({ payrollRunId: 'pr-m4', amount: new Decimal('40000.00'), kind: 'READY' })],
      entries,
      releases,
    });
    await expect(
      materializePayrollBonusAllocationDrafts(over.tx as never, {
        payrollRunId: 'pr-m4',
        payrollMonth: '2026-05',
        actorUserId: 'emp1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(over.tx.bonusRelease.create).not.toHaveBeenCalled();
    expect(economicRemaining(PLAN_AMOUNT, releases).toFixed(2)).toBe(PLAN_REMAINDER.toFixed(2));
  });

  it('does not create a second copy when the same 120000 installment is repeated', async () => {
    const entries = new Map([['be-plan', planEntry()]]);
    const releases: ReleaseRow[] = [
      {
        id: 'rel-existing',
        bonusEntryId: 'be-plan',
        payrollRunId: 'pr-m3',
        status: 'INCLUDED_IN_PAYROLL',
        amount: INSTALLMENTS[2],
        payrollIncludedAmount: INSTALLMENTS[2],
      },
    ];
    const { tx } = createTx({
      drafts: [draft({ payrollRunId: 'pr-m3', amount: INSTALLMENTS[2], kind: 'READY' })],
      entries,
      releases,
    });

    const result = await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr-m3',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(result.releaseIds).toEqual(['rel-existing']);
    expect(tx.bonusRelease.create).not.toHaveBeenCalled();
    expect(releases.filter((row) => row.bonusEntryId === 'be-plan')).toHaveLength(1);
  });

  it('creates a separate reasoned extra 30000 without changing the 200000 plan', async () => {
    const entries = new Map([['be-plan', planEntry()]]);
    const { tx, releases } = createTx({
      drafts: [
        draft({
          amount: EXTRA_AMOUNT,
          kind: 'EXTRA_BONUS',
          reason: 'CEO extra award',
        }),
      ],
      entries,
      releases: [
        {
          id: 'rel-plan-full',
          bonusEntryId: 'be-plan',
          payrollRunId: 'pr-old',
          status: 'INCLUDED_IN_PAYROLL',
          amount: PLAN_AMOUNT,
          payrollIncludedAmount: PLAN_AMOUNT,
        },
      ],
    });

    await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(entries.get('be-plan')?.amount.toFixed(2)).toBe('200000.00');
    const extra = entries.get('extra-1');
    expect(extra?.amount.toFixed(2)).toBe('30000.00');
    expect(extra?.type).toBe('DELIVERY');
    expect(PLAN_AMOUNT.plus(extra?.amount ?? 0).toFixed(2)).toBe('230000.00');
    expect(tx.bonusEntry.create).toHaveBeenCalledTimes(1);
    expect(tx.bonusRelease.create).toHaveBeenCalledTimes(1);
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bonusEntryId: 'extra-1',
          amount: EXTRA_AMOUNT,
          releaseType: 'EXTRA',
          reason: 'CEO extra award',
          approvedById: 'emp1',
          status: 'APPROVED',
        }),
      }),
    );
    expect(tx.bonusRelease.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bonusEntryId: 'be-plan' }),
      }),
    );
    expect(releases.some((row) => row.status === 'PAID')).toBe(false);
  });

  it('does not create a second 30000 extra when the same extra is approved again', async () => {
    const extra = sourceEntry('extra-1', EXTRA_AMOUNT);
    extra.calculationSnapshot = { payrollExtraAward: true, payrollRunId: 'pr1' };
    const entries = new Map([
      ['be-plan', planEntry()],
      ['extra-1', extra],
    ]);
    const releases: ReleaseRow[] = [
      {
        id: 'rel-plan-full',
        bonusEntryId: 'be-plan',
        payrollRunId: 'pr-old',
        status: 'INCLUDED_IN_PAYROLL',
        amount: PLAN_AMOUNT,
        payrollIncludedAmount: PLAN_AMOUNT,
      },
      {
        id: 'rel-extra',
        bonusEntryId: 'extra-1',
        payrollRunId: 'pr1',
        status: 'INCLUDED_IN_PAYROLL',
        amount: EXTRA_AMOUNT,
        payrollIncludedAmount: EXTRA_AMOUNT,
      },
    ];
    const { tx } = createTx({
      drafts: [
        draft({
          amount: EXTRA_AMOUNT,
          kind: 'EXTRA_BONUS',
          reason: 'CEO extra award',
        }),
      ],
      entries,
      releases,
    });

    const result = await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(result.releaseIds).toEqual(['rel-extra']);
    expect(tx.bonusEntry.create).not.toHaveBeenCalled();
    expect(tx.bonusRelease.create).not.toHaveBeenCalled();
    expect([...entries.values()].filter((entry) => entry.amount.eq(EXTRA_AMOUNT))).toHaveLength(1);
  });

  it('releases the 30000 plan remainder first and extras only the 30000 overflow', async () => {
    const entries = new Map([['be-plan', planEntry()]]);
    const priorPlanPaid = new Decimal('170000.00');
    const { tx, releases } = createTx({
      drafts: [
        draft({
          amount: new Decimal('60000.00'),
          kind: 'EXTRA_BONUS',
          reason: 'overflow extra',
        }),
      ],
      entries,
      releases: [
        {
          id: 'rel-prior',
          bonusEntryId: 'be-plan',
          payrollRunId: 'pr-old',
          status: 'INCLUDED_IN_PAYROLL',
          amount: priorPlanPaid,
          payrollIncludedAmount: priorPlanPaid,
        },
      ],
    });

    await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(entries.get('be-plan')?.amount.toFixed(2)).toBe('200000.00');
    expect(entries.get('extra-1')?.amount.toFixed(2)).toBe('30000.00');
    expect(PLAN_AMOUNT.plus(entries.get('extra-1')?.amount ?? 0).toFixed(2)).toBe('230000.00');
    expect(tx.bonusEntry.create).toHaveBeenCalledTimes(1);
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bonusEntryId: 'be-plan',
          amount: PLAN_REMAINDER,
          releaseType: 'MANUAL',
          status: 'APPROVED',
        }),
      }),
    );
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bonusEntryId: 'extra-1',
          amount: EXTRA_AMOUNT,
          releaseType: 'EXTRA',
          reason: 'overflow extra',
          approvedById: 'emp1',
          status: 'APPROVED',
        }),
      }),
    );
    expect(tx.bonusRelease.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bonusEntryId: 'be-plan', amount: new Decimal('60000.00') }),
      }),
    );
    expect(
      economicRemaining(
        PLAN_AMOUNT,
        releases.filter((r) => r.bonusEntryId === 'be-plan'),
      ).toFixed(2),
    ).toBe('0.00');

    const later = createTx({
      drafts: [draft({ payrollRunId: 'pr-later', amount: PLAN_REMAINDER, kind: 'READY' })],
      entries,
      releases,
    });
    await expect(
      materializePayrollBonusAllocationDrafts(later.tx as never, {
        payrollRunId: 'pr-later',
        payrollMonth: '2026-05',
        actorUserId: 'emp1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(later.tx.bonusRelease.create).not.toHaveBeenCalled();
    expect(
      [...entries.values()]
        .reduce((sum, entry) => sum.plus(entry.amount), new Decimal(0))
        .toFixed(2),
    ).toBe('230000.00');
  });

  it('consumes the 40 remaining on the 70 source when EXTRA 100 is bound to the spent 50 source', async () => {
    const entries = new Map([
      ['be-50', sourceEntry('be-50', new Decimal(50))],
      ['be-70', sourceEntry('be-70', new Decimal(70))],
    ]);
    const { tx, releases } = createTx({
      drafts: [
        draft({
          bonusEntryId: 'be-50',
          amount: new Decimal(100),
          kind: 'EXTRA_BONUS',
          reason: 'multi-source overflow',
        }),
      ],
      entries,
      releases: [
        {
          id: 'rel-a-full',
          bonusEntryId: 'be-50',
          payrollRunId: 'pr-old',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal(50),
          payrollIncludedAmount: new Decimal(50),
        },
        {
          id: 'rel-b-part',
          bonusEntryId: 'be-70',
          payrollRunId: 'pr-old',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal(30),
          payrollIncludedAmount: new Decimal(30),
        },
      ],
    });

    await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(entries.get('be-50')?.amount.toFixed(2)).toBe('50.00');
    expect(entries.get('be-70')?.amount.toFixed(2)).toBe('70.00');
    expect(entries.get('extra-1')?.amount.toFixed(2)).toBe('60.00');
    expect(
      new Decimal(50)
        .plus(70)
        .plus(entries.get('extra-1')?.amount ?? 0)
        .toFixed(2),
    ).toBe('180.00');
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bonusEntryId: 'be-70',
          amount: new Decimal(40),
          releaseType: 'MANUAL',
          status: 'APPROVED',
        }),
      }),
    );
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bonusEntryId: 'extra-1',
          amount: new Decimal(60),
          releaseType: 'EXTRA',
          status: 'APPROVED',
        }),
      }),
    );
    expect(tx.bonusRelease.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bonusEntryId: 'be-50', amount: new Decimal(100) }),
      }),
    );
    expect(tx.bonusRelease.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: new Decimal(100), releaseType: 'EXTRA' }),
      }),
    );

    const later = createTx({
      drafts: [
        draft({
          payrollRunId: 'pr-later',
          bonusEntryId: 'be-70',
          amount: new Decimal(40),
          kind: 'READY',
        }),
      ],
      entries,
      releases,
    });
    await expect(
      materializePayrollBonusAllocationDrafts(later.tx as never, {
        payrollRunId: 'pr-later',
        payrollMonth: '2026-05',
        actorUserId: 'emp1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(later.tx.bonusRelease.create).not.toHaveBeenCalled();
  });

  it('consumes the 10 remaining on the other source instead of paying EXTRA 10 twice', async () => {
    const entries = new Map([
      ['be-50', sourceEntry('be-50', new Decimal(50))],
      ['be-70', sourceEntry('be-70', new Decimal(70))],
    ]);
    const { tx, releases } = createTx({
      drafts: [
        draft({
          bonusEntryId: 'be-50',
          amount: new Decimal(10),
          kind: 'EXTRA_BONUS',
          reason: 'cell at remaining sum',
        }),
      ],
      entries,
      releases: [
        {
          id: 'rel-a-full',
          bonusEntryId: 'be-50',
          payrollRunId: 'pr-old',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal(50),
          payrollIncludedAmount: new Decimal(50),
        },
        {
          id: 'rel-b-part',
          bonusEntryId: 'be-70',
          payrollRunId: 'pr-old',
          status: 'INCLUDED_IN_PAYROLL',
          amount: new Decimal(60),
          payrollIncludedAmount: new Decimal(60),
        },
      ],
    });

    await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(tx.bonusEntry.create).not.toHaveBeenCalled();
    expect(tx.bonusRelease.create).toHaveBeenCalledTimes(1);
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bonusEntryId: 'be-70',
          amount: new Decimal(10),
          releaseType: 'MANUAL',
          status: 'APPROVED',
        }),
      }),
    );
    expect(tx.bonusRelease.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ releaseType: 'EXTRA' }),
      }),
    );
    expect(
      economicRemaining(
        new Decimal(70),
        releases.filter((row) => row.bonusEntryId === 'be-70'),
      ).toFixed(2),
    ).toBe('0.00');
  });

  it('does not let a manual title with the source-amount prefix pay another employee plan', async () => {
    const stolen = encodePayrollAllocationSourceAmounts([
      { bonusEntryId: 'be-other', amount: new Decimal(50) },
    ]);
    const entries = new Map([
      ['be-other', sourceEntry('be-other', new Decimal(100), { employeeId: 'e2' })],
    ]);
    const { tx, releases } = createTx({
      drafts: [
        draft({
          id: 'd-manual',
          employeeId: 'e1',
          bonusEntryId: null,
          amount: new Decimal(50),
          kind: 'MANUAL_BONUS',
          title: stolen,
          reason: 'manual award',
        }),
        draft({
          id: 'd-other',
          employeeId: 'e2',
          bonusEntryId: 'be-other',
          amount: new Decimal(30),
          kind: 'READY',
        }),
      ],
      entries,
    });

    await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(tx.bonusRelease.create).toHaveBeenCalledTimes(2);
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bonusEntryId: 'extra-1',
          employeeId: 'e1',
          amount: new Decimal(50),
          releaseType: 'MANUAL',
        }),
      }),
    );
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bonusEntryId: 'be-other',
          employeeId: 'e2',
          amount: new Decimal(30),
        }),
      }),
    );
    expect(tx.bonusRelease.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bonusEntryId: 'be-other', amount: new Decimal(50) }),
      }),
    );
    expect(releases.filter((row) => row.bonusEntryId === 'be-other')).toHaveLength(1);
  });

  it('pays each owned accrual when a manual cell stored source amounts', async () => {
    const title = encodePayrollAllocationSourceAmounts([
      { bonusEntryId: 'be-a', amount: new Decimal(40_000) },
      { bonusEntryId: 'be-b', amount: new Decimal(20_000) },
    ]);
    const entries = new Map([
      ['be-a', sourceEntry('be-a', new Decimal(40_000))],
      ['be-b', sourceEntry('be-b', new Decimal(20_000))],
    ]);
    const { tx } = createTx({
      drafts: [
        draft({
          id: 'd-split',
          bonusEntryId: 'be-a',
          amount: new Decimal(60_000),
          kind: 'MANUAL_BONUS',
          title,
        }),
      ],
      entries,
    });

    await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bonusEntryId: 'be-a', amount: new Decimal(40_000) }),
      }),
    );
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bonusEntryId: 'be-b', amount: new Decimal(20_000) }),
      }),
    );
  });

  it('materializes a matrix draft as APPROVED and never as PAID', async () => {
    const entries = new Map([['be-plan', planEntry()]]);
    const { tx } = createTx({
      drafts: [draft({ amount: INSTALLMENTS[0], kind: 'READY' })],
      entries,
    });

    await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'APPROVED',
        }),
      }),
    );
    expect(tx.bonusRelease.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID' }),
      }),
    );
  });

  it('materializes a chosen 50 + 30 split and leaves combined remaining 40', async () => {
    const entries = new Map([
      ['be-50', sourceEntry('be-50', new Decimal(50))],
      ['be-70', sourceEntry('be-70', new Decimal(70))],
    ]);
    const splits = encodePayrollAllocationSourceAmounts([
      { bonusEntryId: 'be-50', amount: new Decimal(50) },
      { bonusEntryId: 'be-70', amount: new Decimal(30) },
    ]);
    const { tx, releases } = createTx({
      drafts: [
        draft({
          bonusEntryId: 'be-50',
          amount: new Decimal(80),
          kind: 'READY',
          title: splits,
        }),
      ],
      entries,
    });

    const result = await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(result.releaseIds).toEqual(['rel-1', 'rel-2']);
    expect(tx.bonusRelease.create).toHaveBeenCalledTimes(2);
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bonusEntryId: 'be-50', amount: new Decimal(50) }),
      }),
    );
    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bonusEntryId: 'be-70', amount: new Decimal(30) }),
      }),
    );
    expect(tx.bonusRelease.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bonusEntryId: 'be-50', amount: new Decimal(80) }),
      }),
    );
    const remaining = economicRemaining(
      new Decimal(50),
      releases.filter((r) => r.bonusEntryId === 'be-50'),
    ).plus(
      economicRemaining(
        new Decimal(70),
        releases.filter((r) => r.bonusEntryId === 'be-70'),
      ),
    );
    expect(remaining.toFixed(2)).toBe('40.00');
  });

  it('rejects 80 against the first 50 entry when no per-source split is stored', async () => {
    const entries = new Map([
      ['be-50', sourceEntry('be-50', new Decimal(50))],
      ['be-70', sourceEntry('be-70', new Decimal(70))],
    ]);
    const { tx } = createTx({
      drafts: [
        draft({
          bonusEntryId: 'be-50',
          amount: new Decimal(80),
          kind: 'READY',
        }),
      ],
      entries,
    });

    await expect(
      materializePayrollBonusAllocationDrafts(tx as never, {
        payrollRunId: 'pr1',
        payrollMonth: '2026-05',
        actorUserId: 'emp1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.bonusRelease.create).not.toHaveBeenCalled();
  });

  it('allows a reasoned early Development release that is not PAID', async () => {
    const entries = new Map([['be-plan', planEntry()]]);
    const { tx } = createTx({
      drafts: [
        draft({
          amount: new Decimal('40000.00'),
          kind: 'PROGRESS',
          reason: 'pay before done',
        }),
      ],
      entries,
    });

    await materializePayrollBonusAllocationDrafts(tx as never, {
      payrollRunId: 'pr1',
      payrollMonth: '2026-05',
      actorUserId: 'emp1',
    });

    expect(tx.bonusRelease.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          releaseType: 'EARLY',
          status: 'APPROVED',
          reason: 'pay before done',
          approvedById: 'emp1',
        }),
      }),
    );
    expect(tx.bonusRelease.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID' }),
      }),
    );
  });
});
