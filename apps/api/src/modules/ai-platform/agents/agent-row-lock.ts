import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

export type PrismaTransaction = Parameters<
  Parameters<InstanceType<typeof PrismaClient>['$transaction']>[0]
>[0];

export interface LockedAgent {
  id: string;
  status: string;
  revokedAt: Date | null;
  expiresAt: Date | null;
}

/**
 * Locks one agent row for the rest of the transaction.
 *
 * Every writer that depends on the agent still being alive — lifecycle
 * transitions, credential issuance, capability and scope grants — takes this
 * lock first. That is what serializes them against a concurrent revoke: the
 * revoke either commits before the lock is granted (and the caller then sees
 * terminal state) or waits until the caller's transaction finishes.
 *
 * This is also the first step of the module-wide lock order
 * **agent row → credential row → grant/scope rows**. Any new writer must follow
 * it; acquiring a child row first and the agent afterwards can deadlock against
 * agent revoke, which PostgreSQL settles by aborting a transaction rather than
 * by returning a domain error.
 */
export async function lockAgentRow(tx: PrismaTransaction, agentId: string): Promise<LockedAgent> {
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM external_agents WHERE id = ${agentId} FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new NotFoundException('External agent not found');
  }
  return tx.externalAgent.findUniqueOrThrow({
    where: { id: agentId },
    select: { id: true, status: true, revokedAt: true, expiresAt: true },
  });
}

export function isAgentRevoked(agent: Pick<LockedAgent, 'status' | 'revokedAt'>): boolean {
  return agent.status === 'REVOKED' || agent.revokedAt !== null;
}

/**
 * Locks the agent and refuses to proceed once revocation is recorded.
 * `reason` names the operation, because "cannot receive credentials" and
 * "cannot receive grants" are different answers to the caller.
 */
export async function lockLiveAgent(
  tx: PrismaTransaction,
  agentId: string,
  reason: string,
): Promise<LockedAgent> {
  const agent = await lockAgentRow(tx, agentId);
  if (isAgentRevoked(agent)) {
    throw new BadRequestException(reason);
  }
  return agent;
}
