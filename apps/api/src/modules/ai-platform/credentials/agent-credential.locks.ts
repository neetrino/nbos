import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { lockLiveAgent, type PrismaTransaction } from '../agents/agent-row-lock';

const REVOKED_AGENT_HAS_NO_CREDENTIALS = 'A revoked agent cannot receive credentials';

/**
 * Row locking for credential writes.
 *
 * The module-wide order is **agent row → credential row**. Agent revoke locks
 * the agent and then updates its credentials, so a credential writer that took
 * the credential lock first could deadlock against it; PostgreSQL would settle
 * that by aborting one transaction instead of returning a domain error.
 */
export async function lockIssuableAgent(tx: PrismaTransaction, agentId: string): Promise<void> {
  await lockLiveAgent(tx, agentId, REVOKED_AGENT_HAS_NO_CREDENTIALS);
}

export async function lockCredentialRow(
  tx: PrismaTransaction,
  credentialId: string,
): Promise<void> {
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM external_agent_credentials WHERE id = ${credentialId} FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new NotFoundException('Credential not found');
  }
}

/**
 * Reads the owning agent without taking a lock, so the agent row can be locked
 * first. `agentId` is immutable for a credential, and the value is re-checked
 * under the credential lock before anything is written.
 */
export async function resolveCredentialAgent(
  tx: PrismaTransaction,
  credentialId: string,
): Promise<string> {
  const credential = await tx.externalAgentCredential.findUnique({
    where: { id: credentialId },
    select: { agentId: true },
  });
  if (!credential) {
    throw new NotFoundException('Credential not found');
  }
  return credential.agentId;
}

/**
 * Locks the predecessor and proves it is rotatable exactly once. `rotatedFromId`
 * is unique, so without this the second concurrent rotation would surface as a
 * raw unique-constraint error instead of a deterministic conflict.
 */
export async function claimRotationPredecessor(
  tx: PrismaTransaction,
  credentialId: string,
  lockedAgentId: string,
) {
  await lockCredentialRow(tx, credentialId);
  const previous = await tx.externalAgentCredential.findUniqueOrThrow({
    where: { id: credentialId },
  });
  if (previous.agentId !== lockedAgentId) {
    // Unreachable while agentId stays immutable, but the write that follows is
    // only safe under the agent lock this transaction actually holds.
    throw new ConflictException('Credential ownership changed during rotation');
  }
  if (previous.revokedAt !== null) {
    throw new BadRequestException('A revoked credential cannot be rotated');
  }

  const successor = await tx.externalAgentCredential.findFirst({
    where: { rotatedFromId: credentialId },
    select: { id: true },
  });
  if (successor) {
    throw new ConflictException('This credential has already been rotated');
  }
  return previous;
}
