import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { InternalAiAgentStatusEnum } from '@nbos/database';
import type { PrismaTransaction } from '../agents/agent-row-lock';

export interface LockedInternalAgent {
  id: string;
  status: InternalAiAgentStatusEnum;
  archivedAt: Date | null;
  modelPolicyId: string | null;
}

export async function lockInternalAgentRow(
  tx: PrismaTransaction,
  agentId: string,
): Promise<LockedInternalAgent> {
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM internal_ai_agents WHERE id = ${agentId} FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new NotFoundException('Internal agent not found');
  }
  return tx.internalAiAgent.findUniqueOrThrow({
    where: { id: agentId },
    select: { id: true, status: true, archivedAt: true, modelPolicyId: true },
  });
}

export function isInternalAgentArchived(
  agent: Pick<LockedInternalAgent, 'status' | 'archivedAt'>,
): boolean {
  return agent.status === 'ARCHIVED' || agent.archivedAt !== null;
}

export async function lockLiveInternalAgent(
  tx: PrismaTransaction,
  agentId: string,
  reason: string,
): Promise<LockedInternalAgent> {
  const agent = await lockInternalAgentRow(tx, agentId);
  if (isInternalAgentArchived(agent)) {
    throw new BadRequestException(reason);
  }
  return agent;
}
