import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  coveringApprovedProfiles,
  hasApprovedProfileStartingAfterPayrollMonth,
  hasHistoricalProfileStartingOnOrBeforePayrollMonth,
  resolveCompensationProfileForPayrollMonth,
} from './resolve-active-compensation-profile';

describe('resolveCompensationProfileForPayrollMonth', () => {
  it('queries approved profiles overlapping the payroll month without picking by row order', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'cp-1',
        baseSalary: { toString: () => '100000' },
        currency: 'AMD',
        kpiPolicyId: 'pol-1',
      },
    ]);
    const db = { compensationProfile: { findMany } };

    const result = await resolveCompensationProfileForPayrollMonth(db as never, 'emp-1', '2026-09');

    expect(result?.id).toBe('cp-1');
    expect(result?.baseSalary.toString()).toBe('100000');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employeeId: 'emp-1',
          status: 'ACTIVE',
          effectiveFrom: { lte: expect.any(Date) },
        }),
      }),
    );
  });

  it('returns the current 100000 profile for today when a later 200000 profile also exists', () => {
    const profiles = [
      range('p-current', 'emp-1', '100000', '2026-01-01', '2026-11-30'),
      range('p-future', 'emp-1', '200000', '2026-12-01', null),
    ];
    const coveringToday = coveringApprovedProfiles(profiles, 'emp-1', '2026-09');
    expect(coveringToday).toHaveLength(1);
    expect(coveringToday[0]?.id).toBe('p-current');
    expect(coveringToday[0]?.baseSalary.toString()).toBe('100000');

    const coveringFuture = coveringApprovedProfiles(profiles, 'emp-1', '2026-12');
    expect(coveringFuture).toHaveLength(1);
    expect(coveringFuture[0]?.baseSalary.toString()).toBe('200000');
  });

  it('rejects two approved ranges that cover the same month', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: 'a', baseSalary: { toString: () => '1' }, currency: 'AMD', kpiPolicyId: null },
      { id: 'b', baseSalary: { toString: () => '2' }, currency: 'AMD', kpiPolicyId: null },
    ]);
    const db = { compensationProfile: { findMany } };

    await expect(
      resolveCompensationProfileForPayrollMonth(db as never, 'emp-1', '2026-09'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('treats a later approved start as explaining the absence of a current profile', () => {
    const profiles = [range('p-future', 'emp-1', '200000', '2026-12-01', null)];
    expect(coveringApprovedProfiles(profiles, 'emp-1', '2026-09')).toEqual([]);
    expect(hasApprovedProfileStartingAfterPayrollMonth(profiles, 'emp-1', '2026-09')).toBe(true);
    expect(hasHistoricalProfileStartingOnOrBeforePayrollMonth(profiles, 'emp-1', '2026-09')).toBe(
      false,
    );
  });

  it('does not treat an archived earlier range plus a later approved start as a new-hire gap', () => {
    const profiles = [
      {
        ...range('p-old', 'emp-1', '300000', '2026-01-01', '2026-06-30'),
        status: 'ARCHIVED' as const,
      },
      range('p-aug', 'emp-1', '350000', '2026-08-01', null),
    ];
    expect(coveringApprovedProfiles(profiles, 'emp-1', '2026-07')).toEqual([]);
    expect(hasApprovedProfileStartingAfterPayrollMonth(profiles, 'emp-1', '2026-07')).toBe(true);
    expect(hasHistoricalProfileStartingOnOrBeforePayrollMonth(profiles, 'emp-1', '2026-07')).toBe(
      true,
    );
  });
});

function range(id: string, employeeId: string, salary: string, from: string, to: string | null) {
  return {
    id,
    employeeId,
    baseSalary: { toString: () => salary },
    currency: 'AMD',
    kpiPolicyId: null,
    effectiveFrom: new Date(`${from}T00:00:00.000Z`),
    effectiveTo: to == null ? null : new Date(`${to}T00:00:00.000Z`),
  };
}
