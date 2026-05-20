import { BadRequestException } from '@nestjs/common';
import { getDealStageGateErrors, type DealStageGateInput } from '@nbos/shared';

export type { DealStageGateInput };

/**
 * Validates required fields when moving a Deal to a target stage.
 * @throws BadRequestException with field errors when validation fails
 */
export function validateDealStageGate(deal: DealStageGateInput, targetStatus: string) {
  const errors = getDealStageGateErrors(deal, targetStatus);
  if (errors.length === 0) return;

  throw new BadRequestException({
    statusCode: 400,
    code: 'STAGE_GATE_VALIDATION',
    message: `Cannot move to ${targetStatus}: missing required fields`,
    errors,
  });
}
