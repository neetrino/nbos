import { describe, expect, it, vi } from 'vitest';
import {
  holdsDeliveryRole,
  linkedEmployeeIdsForUnit,
  resolveDeliveryPayableUnits,
} from './delivery-payable-unit.resolver';

describe('resolveDeliveryPayableUnits', () => {
  it('includes open delivery units and excludes closed units with no unpaid bonus', async () => {
    const prisma = {
      payrollRun: {
        findUnique: vi.fn().mockResolvedValue({ payrollMonth: '2026-05' }),
      },
      bonusRelease: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'o-open',
            code: 'ORD-1',
            type: 'PRODUCT',
            projectId: 'p1',
            productId: 'prod1',
            extensionId: null,
            project: { code: 'PRJ' },
            product: { name: 'Website', status: 'DEVELOPMENT' },
            extension: null,
            productBonusPool: {
              totalPlannedAmount: '100000',
              totalReleasedAmount: '0',
              totalPaidAmount: '0',
              totalRemainingAmount: '100000',
              availableFunding: '50000',
              overFundingAmount: '0',
            },
            bonusEntries: [],
          },
          {
            id: 'o-closed-paid',
            code: 'ORD-2',
            type: 'EXTENSION',
            projectId: 'p1',
            productId: null,
            extensionId: 'ext1',
            project: { code: 'PRJ' },
            product: null,
            extension: { name: 'CRM tweak', status: 'DONE' },
            productBonusPool: {
              totalPlannedAmount: '50000',
              totalReleasedAmount: '50000',
              totalPaidAmount: '50000',
              totalRemainingAmount: '0',
              availableFunding: '0',
              overFundingAmount: '0',
            },
            bonusEntries: [],
          },
        ]),
      },
    } as unknown as Parameters<typeof resolveDeliveryPayableUnits>[0];

    const units = await resolveDeliveryPayableUnits(prisma, 'run-1', []);

    expect(units.map((u) => u.orderId)).toEqual(['o-open']);
    expect(units[0]?.inclusionReason).toBe('DELIVERY_OPEN');
  });

  it('includes pinned closed units even when fully paid', async () => {
    const prisma = {
      payrollRun: {
        findUnique: vi.fn().mockResolvedValue({ payrollMonth: '2026-05' }),
      },
      bonusRelease: { findMany: vi.fn().mockResolvedValue([]) },
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'o-pinned',
            code: 'ORD-3',
            type: 'PRODUCT',
            projectId: 'p1',
            productId: 'prod2',
            extensionId: null,
            project: { code: 'PRJ' },
            product: { name: 'App', status: 'DONE' },
            extension: null,
            productBonusPool: {
              totalPlannedAmount: '20000',
              totalReleasedAmount: '20000',
              totalPaidAmount: '20000',
              totalRemainingAmount: '0',
              availableFunding: '0',
              overFundingAmount: '0',
            },
            bonusEntries: [],
          },
        ]),
      },
    } as unknown as Parameters<typeof resolveDeliveryPayableUnits>[0];

    const units = await resolveDeliveryPayableUnits(prisma, 'run-1', ['o-pinned']);

    expect(units).toHaveLength(1);
    expect(units[0]?.inclusionReason).toBe('PINNED');
  });

  it('does not show a historical PAID entry with no release as remaining debt', async () => {
    const prisma = {
      payrollRun: {
        findUnique: vi.fn().mockResolvedValue({ payrollMonth: '2026-05' }),
      },
      bonusRelease: { findMany: vi.fn().mockResolvedValue([]) },
      order: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'o-old',
            code: 'ORD-OLD',
            type: 'PRODUCT',
            projectId: 'p1',
            productId: 'prod-old',
            extensionId: null,
            project: { code: 'PRJ' },
            product: { name: 'Legacy', status: 'DONE' },
            extension: null,
            productBonusPool: {
              totalPlannedAmount: '20000',
              totalReleasedAmount: '0',
              totalPaidAmount: '20000',
              totalRemainingAmount: '20000',
              availableFunding: '0',
              overFundingAmount: '0',
            },
            bonusEntries: [
              {
                type: 'DELIVERY',
                amount: '20000',
                payableAmount: '20000',
                earnedPeriod: '2020-01',
                status: 'PAID',
              },
            ],
          },
        ]),
      },
    } as unknown as Parameters<typeof resolveDeliveryPayableUnits>[0];

    const units = await resolveDeliveryPayableUnits(prisma, 'run-1', ['o-old']);

    expect(units).toHaveLength(1);
    expect(units[0]?.paidCashState).toBe('UNCONFIRMED');
    expect(units[0]?.totalPaidBonus).toBe('0.00');
    expect(units[0]?.totalRemainingBonus).toBe('0.00');
    expect(units[0]?.totalPlannedBonus).toBe('20000.00');
  });

  it('drops a releaseless PAID entry from remaining when the order also has a release', async () => {
    const units = await resolveDeliveryPayableUnits(orderPrisma(mixedOrder()), 'run-1', ['o-mix']);
    expect(units[0]?.paidCashState).toBe('CONFIRMED');
    expect(units[0]?.totalPaidBonus).toBe('10000.00');
    expect(units[0]?.totalRemainingBonus).toBe('20000.00');
  });

  it('does not subtract a historical PAID amount twice when the order has no pool', async () => {
    const units = await resolveDeliveryPayableUnits(orderPrisma(noPoolOrder()), 'run-1', [
      'o-none',
    ]);
    expect(units[0]?.totalRemainingBonus).toBe('30000.00');
  });
});

describe('linkedEmployeeIdsForUnit', () => {
  it('links backend and frontend developers when both are assigned', () => {
    const ids = linkedEmployeeIdsForUnit({
      product: {
        pmId: 'pm-1',
        developerId: 'dev-be',
        frontendDeveloperId: 'dev-fe',
        designerId: null,
        qaLeadId: null,
        technicalSpecialistId: null,
      },
      bonusEmployeeIds: [],
    });
    expect([...ids]).toEqual(expect.arrayContaining(['pm-1', 'dev-be', 'dev-fe']));
  });

  it('links only backend when frontend is unset', () => {
    const ids = linkedEmployeeIdsForUnit({
      product: {
        pmId: null,
        developerId: 'dev-be',
        frontendDeveloperId: null,
        designerId: null,
        qaLeadId: null,
        technicalSpecialistId: null,
      },
      bonusEmployeeIds: [],
    });
    expect([...ids]).toEqual(['dev-be']);
  });

  it('links QA and the technical specialist so their payroll rows are not hidden', () => {
    const ids = linkedEmployeeIdsForUnit({
      product: {
        pmId: null,
        developerId: null,
        frontendDeveloperId: null,
        designerId: null,
        qaLeadId: 'qa-1',
        technicalSpecialistId: 'tech-1',
      },
      bonusEmployeeIds: [],
    });
    expect([...ids]).toEqual(['qa-1', 'tech-1']);
  });

  it('keeps one id when the same employee holds two delivery roles', () => {
    const ids = linkedEmployeeIdsForUnit({
      product: {
        pmId: 'multi-1',
        developerId: null,
        frontendDeveloperId: null,
        designerId: null,
        qaLeadId: 'multi-1',
        technicalSpecialistId: null,
      },
      bonusEmployeeIds: ['multi-1'],
    });
    expect([...ids]).toEqual(['multi-1']);
  });
});

describe('holdsDeliveryRole', () => {
  const product = {
    pmId: 'pm-1',
    developerId: null,
    frontendDeveloperId: null,
    designerId: null,
    qaLeadId: 'qa-1',
    technicalSpecialistId: 'tech-1',
  };

  it('recognizes QA and technical specialist holders', () => {
    expect(holdsDeliveryRole(product, 'qa-1')).toBe(true);
    expect(holdsDeliveryRole(product, 'tech-1')).toBe(true);
  });

  it('rejects an employee without any delivery role, and a missing product', () => {
    expect(holdsDeliveryRole(product, 'other-1')).toBe(false);
    expect(holdsDeliveryRole(null, 'pm-1')).toBe(false);
  });
});

function orderPrisma(order: object): Parameters<typeof resolveDeliveryPayableUnits>[0] {
  return {
    payrollRun: { findUnique: vi.fn().mockResolvedValue({ payrollMonth: '2026-05' }) },
    bonusRelease: { findMany: vi.fn().mockResolvedValue([]) },
    order: { findMany: vi.fn().mockResolvedValue([order]) },
  } as unknown as Parameters<typeof resolveDeliveryPayableUnits>[0];
}

function mixedOrder(): object {
  return {
    id: 'o-mix',
    code: 'ORD-MIX',
    type: 'PRODUCT',
    projectId: 'p1',
    productId: 'prod-mix',
    extensionId: null,
    project: { code: 'PRJ' },
    product: { name: 'Mixed', status: 'DONE' },
    extension: null,
    productBonusPool: {
      totalPlannedAmount: '50000',
      totalReleasedAmount: '10000',
      totalPaidAmount: '10000',
      totalRemainingAmount: '40000',
      availableFunding: '0',
      overFundingAmount: '0',
    },
    bonusEntries: [
      paidEntry('20000', []),
      { ...paidEntry('30000', [{ id: 'rel-1' }]), status: 'ACTIVE' },
    ],
  };
}

function noPoolOrder(): object {
  return {
    id: 'o-none',
    code: 'ORD-NONE',
    type: 'PRODUCT',
    projectId: 'p1',
    productId: 'prod-none',
    extensionId: null,
    project: { code: 'PRJ' },
    product: { name: 'Open', status: 'DEVELOPMENT' },
    extension: null,
    productBonusPool: null,
    bonusEntries: [paidEntry('10000', []), { ...paidEntry('30000', []), status: 'ACTIVE' }],
  };
}

function paidEntry(amount: string, bonusReleases: { id: string }[]): object {
  return {
    type: 'DELIVERY',
    amount,
    payableAmount: amount,
    earnedPeriod: '2026-04',
    status: 'PAID',
    bonusReleases,
  };
}
