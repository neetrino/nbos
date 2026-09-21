import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { assertTeamPatchAllowedAfterPlan } from './assert-team-patch-after-plan';

describe('assertTeamPatchAllowedAfterPlan', () => {
  it('allows ordinary team edits before a plan exists (H01)', async () => {
    const db = {
      deliveryConfiguration: { findFirst: vi.fn().mockResolvedValue(null) },
      product: { findUnique: vi.fn() },
    };
    await expect(
      assertTeamPatchAllowedAfterPlan(db as never, 'p-1', { developerId: 'emp-2' }),
    ).resolves.toBeUndefined();
    expect(db.product.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a direct team PATCH after the plan (H03)', async () => {
    const db = {
      deliveryConfiguration: { findFirst: vi.fn().mockResolvedValue({ id: 'cfg-1' }) },
      product: {
        findUnique: vi.fn().mockResolvedValue({
          pmId: 'pm-1',
          developerId: 'emp-old',
          frontendDeveloperId: null,
          designerId: null,
          qaLeadId: null,
          technicalSpecialistId: null,
        }),
      },
    };
    await expect(
      assertTeamPatchAllowedAfterPlan(db as never, 'p-1', { developerId: 'emp-new' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
