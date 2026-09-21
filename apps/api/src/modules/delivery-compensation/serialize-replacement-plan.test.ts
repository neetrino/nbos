import { describe, expect, it } from 'vitest';
import { serializeReplacementPlan } from './serialize-replacement-plan';

function buildComponent(overrides?: { releaseStatus?: string }) {
  return {
    id: 'cmp-1',
    componentKey: 'BASE',
    kind: 'BASE_PROFILE',
    allocations: [
      {
        id: 'alloc-1',
        employeeId: 'emp-1',
        employee: { firstName: 'Anna', lastName: 'Petrosyan' },
        bonusEntry: overrides?.releaseStatus
          ? { bonusReleases: [{ status: overrides.releaseStatus }] }
          : { bonusReleases: [] },
      },
    ],
  };
}

describe('serializeReplacementPlan', () => {
  it('lists holders of each component without any money field', () => {
    const dto = serializeReplacementPlan({
      configurationId: 'cfg-1',
      roleKey: 'BACKEND',
      expectedRevision: 3,
      components: [buildComponent()],
    });

    expect(dto).toEqual({
      configurationId: 'cfg-1',
      roleKey: 'BACKEND',
      expectedRevision: 3,
      components: [
        {
          componentId: 'cmp-1',
          componentKey: 'BASE',
          kind: 'BASE_PROFILE',
          holders: [
            {
              allocationId: 'alloc-1',
              employeeId: 'emp-1',
              employeeName: 'Anna Petrosyan',
              hasReleases: false,
            },
          ],
        },
      ],
    });
  });

  it('marks an allocation that payroll already released', () => {
    const dto = serializeReplacementPlan({
      configurationId: 'cfg-1',
      roleKey: 'BACKEND',
      expectedRevision: null,
      components: [buildComponent({ releaseStatus: 'PAID' })],
    });

    expect(dto.components[0]?.holders[0]?.hasReleases).toBe(true);
  });

  it('ignores a draft release, which payroll has not committed yet', () => {
    const dto = serializeReplacementPlan({
      configurationId: 'cfg-1',
      roleKey: 'BACKEND',
      expectedRevision: null,
      components: [buildComponent({ releaseStatus: 'DRAFT' })],
    });

    expect(dto.components[0]?.holders[0]?.hasReleases).toBe(false);
  });
});
