import { BadRequestException } from '@nestjs/common';
import type { InternalAiAgentStatusEnum } from '@nbos/database';

export function nextInternalAgentPolicyId(
  currentPolicyId: string | null,
  inputPolicyId: string | null | undefined,
): string | null {
  return inputPolicyId === undefined ? currentPolicyId : inputPolicyId;
}

export function assertActiveAgentKeepsPolicy(
  status: InternalAiAgentStatusEnum,
  nextPolicyId: string | null,
): void {
  if (status === 'ACTIVE' && !nextPolicyId) {
    throw new BadRequestException('An ACTIVE Internal Agent requires a Model Policy');
  }
}
