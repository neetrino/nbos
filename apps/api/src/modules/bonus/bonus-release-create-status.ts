import { BadRequestException } from '@nestjs/common';
import type { BonusReleaseStatusEnum } from '@nbos/database';

const DIRECT_CREATE_STATUSES = new Set<BonusReleaseStatusEnum>(['DRAFT', 'APPROVED']);

/**
 * Public release create may prepare a draft or an approved release.
 * PAID and payroll inclusion stay on expense-payment and payroll attach paths.
 */
export function resolveDirectBonusReleaseCreateStatus(
  status: BonusReleaseStatusEnum | undefined,
): 'DRAFT' | 'APPROVED' {
  if (status == null) {
    return 'APPROVED';
  }
  if (DIRECT_CREATE_STATUSES.has(status)) {
    return status as 'DRAFT' | 'APPROVED';
  }
  throw new BadRequestException(
    'Direct bonus release create accepts only DRAFT or APPROVED status',
  );
}
