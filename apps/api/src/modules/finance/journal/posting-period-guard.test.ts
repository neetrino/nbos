import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { assertPostingPeriodOpenForBookedAt } from './posting-period-guard';

describe('assertPostingPeriodOpenForBookedAt', () => {
  it('allows dates when period is open or missing', async () => {
    const prisma = createMockPrisma();
    prisma.financePostingPeriod.findUnique.mockResolvedValue({ status: 'OPEN' });

    await expect(
      assertPostingPeriodOpenForBookedAt(prisma as never, new Date('2026-05-10T00:00:00.000Z')),
    ).resolves.toBeUndefined();
  });

  it('rejects dates in a closed period', async () => {
    const prisma = createMockPrisma();
    prisma.financePostingPeriod.findUnique.mockResolvedValue({
      status: 'CLOSED',
      monthKey: '2026-05',
    });

    await expect(
      assertPostingPeriodOpenForBookedAt(prisma as never, new Date('2026-05-10T00:00:00.000Z')),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
