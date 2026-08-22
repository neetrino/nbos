import type { ActorChannelSource } from '../actor/actor-types';
import { isActorChannelSource } from '../actor/actor-types';

export const AI_SESSION_SUBJECT_TYPES = ['EMPLOYEE', 'CUSTOMER', 'TASK', 'CONVERSATION'] as const;

export type AiSessionSubjectType = (typeof AI_SESSION_SUBJECT_TYPES)[number];

export const AI_SESSION_DEFAULT_TTL_MS = 8 * 60 * 60 * 1_000;

/**
 * Temporary conversation/session state. Must not become organization-wide
 * persistent memory.
 */
export interface AiSessionContext {
  sessionId: string;
  subjectType: AiSessionSubjectType;
  subjectId: string;
  channel: ActorChannelSource;
  internalAgentId?: string;
  createdAt: string;
  expiresAt: string;
  persistence: 'SESSION_ONLY';
}

export interface AiSessionContextInput {
  sessionId: string;
  subjectType: string;
  subjectId: string;
  channel: string;
  internalAgentId?: string;
  createdAt?: Date;
  ttlMs?: number;
}

export type AiSessionContextResult =
  | { ok: true; session: AiSessionContext }
  | { ok: false; reason: 'SESSION_INVALID' };

export function isAiSessionSubjectType(value: string): value is AiSessionSubjectType {
  return (AI_SESSION_SUBJECT_TYPES as readonly string[]).includes(value);
}

export function buildSessionContext(input: AiSessionContextInput): AiSessionContextResult {
  const sessionId = input.sessionId.trim();
  const subjectId = input.subjectId.trim();
  if (!sessionId || !subjectId) {
    return { ok: false, reason: 'SESSION_INVALID' };
  }
  if (!isAiSessionSubjectType(input.subjectType) || !isActorChannelSource(input.channel)) {
    return { ok: false, reason: 'SESSION_INVALID' };
  }
  const createdAt = input.createdAt ?? new Date();
  const ttlMs = input.ttlMs ?? AI_SESSION_DEFAULT_TTL_MS;
  if (ttlMs <= 0) {
    return { ok: false, reason: 'SESSION_INVALID' };
  }
  return {
    ok: true,
    session: {
      sessionId,
      subjectType: input.subjectType,
      subjectId,
      channel: input.channel,
      internalAgentId: input.internalAgentId,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + ttlMs).toISOString(),
      persistence: 'SESSION_ONLY',
    },
  };
}

export function isSessionExpired(session: AiSessionContext, now: Date = new Date()): boolean {
  return now.getTime() >= Date.parse(session.expiresAt);
}
