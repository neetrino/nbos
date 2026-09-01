import { BadRequestException } from '@nestjs/common';
import type { PartnerAccrualStatusEnum, PrismaClient } from '@nbos/database';
import { partnerAccrualJournalKey } from '../../../common/lifecycle/finance-record-lifecycle-guards';

const SETTLED_PARTNER_ACCRUAL_STATUSES: ReadonlySet<PartnerAccrualStatusEnum> = new Set([
  'IN_BATCH',
  'PAID',
]);

export const PARTNER_PAYOUT_BLOCKS_PAYMENT_REMOVAL =
  'Cannot remove this payment: the partner accrual is already in a payout batch.';

export const PARTNER_ACCRUAL_REMOVED_JOURNAL_NOTE =
  'Partner accrual voided because the client payment was removed';

export interface PartnerAccrualJournalPort {
  reverseJournalLineByIdempotencyKey(idempotencyKey: string, reversalNote: string): Promise<void>;
}

/**
 * Drops the inbound partner accrual tied to a payment so Payment delete is not
 * blocked by `onDelete: Restrict`. Settled payouts stay blocked.
 */
export async function voidPartnerAccrualForRemovedPayment(
  prisma: InstanceType<typeof PrismaClient>,
  journal: PartnerAccrualJournalPort,
  paymentId: string,
): Promise<void> {
  const accrual = await prisma.partnerAccrual.findUnique({
    where: { paymentId },
    select: { id: true, status: true },
  });
  if (!accrual) return;

  if (SETTLED_PARTNER_ACCRUAL_STATUSES.has(accrual.status)) {
    throw new BadRequestException(PARTNER_PAYOUT_BLOCKS_PAYMENT_REMOVAL);
  }

  await journal.reverseJournalLineByIdempotencyKey(
    partnerAccrualJournalKey(accrual.id),
    PARTNER_ACCRUAL_REMOVED_JOURNAL_NOTE,
  );
  await prisma.partnerAccrual.delete({ where: { id: accrual.id } });
}
