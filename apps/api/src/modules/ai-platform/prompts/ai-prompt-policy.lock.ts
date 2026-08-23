import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AiPromptPolicyStatusEnum } from '@nbos/database';
import type { PrismaTransaction } from '../agents/agent-row-lock';

export interface LockedPromptPolicy {
  id: string;
  status: AiPromptPolicyStatusEnum;
}

export async function lockPromptPolicyRow(
  tx: PrismaTransaction,
  policyId: string,
): Promise<LockedPromptPolicy> {
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM ai_prompt_policies WHERE id = ${policyId} FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new NotFoundException('Prompt policy not found');
  }
  return tx.aiPromptPolicy.findUniqueOrThrow({
    where: { id: policyId },
    select: { id: true, status: true },
  });
}

export function assertPromptPolicyMutable(status: AiPromptPolicyStatusEnum): void {
  if (status === 'ARCHIVED') {
    throw new BadRequestException('An archived prompt policy cannot change');
  }
}
