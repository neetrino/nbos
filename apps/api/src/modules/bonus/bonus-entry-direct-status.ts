import { BadRequestException } from '@nestjs/common';

/** Direct bonus-entry create/status cannot mark money paid without payout evidence. */
export function assertBonusEntryStatusNotPaidWithoutPayout(status: string | undefined): void {
  if (status === 'PAID') {
    throw new BadRequestException('Bonus entry cannot be marked PAID without payout evidence');
  }
}
