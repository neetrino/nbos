import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  PARTNER_PAYOUT_BLOCKS_PAYMENT_REMOVAL,
  voidPartnerAccrualForRemovedPayment,
} from './void-partner-accrual-for-payment';

describe('voidPartnerAccrualForRemovedPayment', () => {
  it('no-ops when the payment has no partner accrual', async () => {
    const prisma = {
      partnerAccrual: {
        findUnique: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      },
    };
    const journal = { reverseJournalLineByIdempotencyKey: vi.fn() };

    await voidPartnerAccrualForRemovedPayment(prisma as never, journal, 'pay-1');

    expect(journal.reverseJournalLineByIdempotencyKey).not.toHaveBeenCalled();
    expect(prisma.partnerAccrual.delete).not.toHaveBeenCalled();
  });

  it('rejects when the accrual is already in a payout batch', async () => {
    const prisma = {
      partnerAccrual: {
        findUnique: vi.fn().mockResolvedValue({ id: 'acc-1', status: 'IN_BATCH' }),
        delete: vi.fn(),
      },
    };
    const journal = { reverseJournalLineByIdempotencyKey: vi.fn() };

    await expect(
      voidPartnerAccrualForRemovedPayment(prisma as never, journal, 'pay-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      voidPartnerAccrualForRemovedPayment(prisma as never, journal, 'pay-1'),
    ).rejects.toThrow(PARTNER_PAYOUT_BLOCKS_PAYMENT_REMOVAL);
    expect(prisma.partnerAccrual.delete).not.toHaveBeenCalled();
  });

  it('reverses the journal and deletes an eligible accrual', async () => {
    const prisma = {
      partnerAccrual: {
        findUnique: vi.fn().mockResolvedValue({ id: 'acc-1', status: 'ELIGIBLE' }),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    };
    const journal = { reverseJournalLineByIdempotencyKey: vi.fn().mockResolvedValue(undefined) };

    await voidPartnerAccrualForRemovedPayment(prisma as never, journal, 'pay-1');

    expect(journal.reverseJournalLineByIdempotencyKey).toHaveBeenCalledWith(
      'partner-accrual:acc-1',
      expect.stringContaining('removed'),
    );
    expect(prisma.partnerAccrual.delete).toHaveBeenCalledWith({ where: { id: 'acc-1' } });
  });
});
