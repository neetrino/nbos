import { BadRequestException } from '@nestjs/common';
import { getLeadStageGateErrors, type LeadStageGateInput } from '@nbos/shared';

export type { LeadStageGateInput };

/**
 * Validates required Lead fields when moving to a target status.
 */
export function validateLeadStageGate(lead: LeadStageGateInput, targetStatus: string) {
  const errors = getLeadStageGateErrors(lead, targetStatus);
  if (errors.length === 0) return;

  throw new BadRequestException({
    statusCode: 400,
    code: 'STAGE_GATE_VALIDATION',
    message: `Cannot move to ${targetStatus}: missing required fields`,
    errors,
  });
}
