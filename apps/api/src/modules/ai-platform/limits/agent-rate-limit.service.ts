import { Inject, Injectable, Optional, type OnModuleDestroy } from '@nestjs/common';
import type { AiRateLimitClass } from '@nbos/shared';
import {
  AGENT_CAPABILITY_LIMIT_PER_WINDOW,
  AGENT_CONCURRENCY_LIMIT,
  AGENT_RATE_LIMIT_WINDOW_MS,
  AGENT_REQUEST_LIMIT_PER_WINDOW,
} from './agent-rate-limit.constants';
import { MemoryAgentRateLimitStore } from './agent-rate-limit.memory-store';
import { AGENT_RATE_LIMIT_STORE, type AgentRateLimitStore } from './agent-rate-limit.store';
import type { AgentRateLimitDecision } from './agent-rate-limit.window';

/**
 * Per-agent abuse controls for the External Agent protocols (checklist U).
 *
 * Deliberately a separate budget from the employee `ThrottlerGuard`: agent
 * routes skip the global throttler entirely, so a runaway agent exhausts only
 * its own ceiling and never the capacity employees share (checklist U 329).
 *
 * Counters live in `AgentRateLimitStore`. Redis is used when a state URL is
 * configured so multiple API instances share one ceiling; otherwise the
 * process-local memory store is used.
 */
@Injectable()
export class AgentRateLimitService implements OnModuleDestroy {
  constructor(@Optional() @Inject(AGENT_RATE_LIMIT_STORE) store?: AgentRateLimitStore) {
    this.store = store ?? new MemoryAgentRateLimitStore();
  }

  private readonly store: AgentRateLimitStore;

  async onModuleDestroy(): Promise<void> {
    await this.store.close?.();
  }

  async consumeRequest(agentId: string, now = Date.now()): Promise<AgentRateLimitDecision> {
    return this.store.consumeWindow(
      'req',
      agentId,
      AGENT_REQUEST_LIMIT_PER_WINDOW,
      AGENT_RATE_LIMIT_WINDOW_MS,
      now,
    );
  }

  async consumeCapability(
    agentId: string,
    rateLimitClass: AiRateLimitClass,
    now = Date.now(),
  ): Promise<AgentRateLimitDecision> {
    return this.store.consumeWindow(
      'cap',
      `${agentId}:${rateLimitClass}`,
      AGENT_CAPABILITY_LIMIT_PER_WINDOW[rateLimitClass],
      AGENT_RATE_LIMIT_WINDOW_MS,
      now,
    );
  }

  async acquireSlot(agentId: string, now = Date.now()): Promise<AgentRateLimitDecision> {
    return this.store.acquireSlot(agentId, AGENT_CONCURRENCY_LIMIT, now);
  }

  async releaseSlot(agentId: string): Promise<void> {
    await this.store.releaseSlot(agentId);
  }
}
