import { BadRequestException } from '@nestjs/common';
import type { LockedAgent } from './agent-row-lock';
import { isTimestampPast } from './external-agent-state';

export const EXPIRED_AGENT_HAS_NO_CREDENTIALS =
  'An expired agent cannot receive credentials until expiry is extended';
export const EXPIRED_AGENT_HAS_NO_GRANTS =
  'An expired agent cannot receive grants until expiry is extended';
export const EXPIRY_MUST_BE_FUTURE = 'expiresAt must be in the future';

export function assertAgentNotExpired(agent: LockedAgent, reason: string): void {
  if (agent.status === 'EXPIRED' || isTimestampPast(agent.expiresAt, new Date())) {
    throw new BadRequestException(reason);
  }
}

export function assertFutureExpiry(
  expiresAt: Date | null | undefined,
  now: Date = new Date(),
): void {
  if (expiresAt != null && isTimestampPast(expiresAt, now)) {
    throw new BadRequestException(EXPIRY_MUST_BE_FUTURE);
  }
}
