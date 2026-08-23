import type { AgentRateLimitDecision } from './agent-rate-limit.window';

export const AGENT_RATE_LIMIT_STORE = 'AGENT_RATE_LIMIT_STORE';

export const AGENT_RATE_LIMIT_REDIS_PREFIX = 'nbos:ai:rl:';

export type AgentRateLimitWindowKind = 'req' | 'cap' | 'preauth-att' | 'preauth-fail';

export interface AgentRateLimitStore {
  consumeWindow(
    kind: AgentRateLimitWindowKind,
    id: string,
    limit: number,
    windowMs: number,
    now: number,
  ): Promise<AgentRateLimitDecision>;
  peekWindow(
    kind: AgentRateLimitWindowKind,
    id: string,
    limit: number,
    windowMs: number,
    now: number,
  ): Promise<AgentRateLimitDecision>;
  acquireSlot(agentId: string, limit: number, now: number): Promise<AgentRateLimitDecision>;
  releaseSlot(agentId: string): Promise<void>;
  close?(): Promise<void>;
}
