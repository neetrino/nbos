import { beforeEach, describe, expect, it } from 'vitest';
import {
  AGENT_CAPABILITY_LIMIT_PER_WINDOW,
  AGENT_CONCURRENCY_LIMIT,
  AGENT_RATE_LIMIT_RETENTION_MS,
  AGENT_RATE_LIMIT_WINDOW_MS,
  AGENT_REQUEST_LIMIT_PER_WINDOW,
} from './agent-rate-limit.constants';
import { AgentRateLimitService } from './agent-rate-limit.service';

const NOW = 1_700_000_000_000;
const AGENT = 'agent-a';
const OTHER_AGENT = 'agent-b';

function drainRequests(service: AgentRateLimitService, agentId: string, now: number): void {
  for (let call = 0; call < AGENT_REQUEST_LIMIT_PER_WINDOW; call += 1) {
    service.consumeRequest(agentId, now);
  }
}

describe('AgentRateLimitService', () => {
  let service: AgentRateLimitService;

  beforeEach(() => {
    service = new AgentRateLimitService();
  });

  describe('per-agent request budget', () => {
    it('refuses the request after the configured ceiling', () => {
      drainRequests(service, AGENT, NOW);

      expect(service.consumeRequest(AGENT, NOW).allowed).toBe(false);
    });

    it('meters each agent separately', () => {
      drainRequests(service, AGENT, NOW);

      expect(service.consumeRequest(OTHER_AGENT, NOW).allowed).toBe(true);
    });

    it('recovers in the next window', () => {
      drainRequests(service, AGENT, NOW);

      expect(service.consumeRequest(AGENT, NOW + AGENT_RATE_LIMIT_WINDOW_MS).allowed).toBe(true);
    });
  });

  describe('per-capability budget', () => {
    it('applies the tighter sensitive-write ceiling before the request ceiling', () => {
      for (let call = 0; call < AGENT_CAPABILITY_LIMIT_PER_WINDOW.WRITE_SENSITIVE; call += 1) {
        expect(service.consumeCapability(AGENT, 'WRITE_SENSITIVE', NOW).allowed).toBe(true);
      }

      expect(service.consumeCapability(AGENT, 'WRITE_SENSITIVE', NOW).allowed).toBe(false);
      expect(service.consumeRequest(AGENT, NOW).allowed).toBe(true);
    });

    it('keeps read and write classes in separate buckets', () => {
      for (let call = 0; call < AGENT_CAPABILITY_LIMIT_PER_WINDOW.WRITE_SENSITIVE; call += 1) {
        service.consumeCapability(AGENT, 'WRITE_SENSITIVE', NOW);
      }

      expect(service.consumeCapability(AGENT, 'READ_STANDARD', NOW).allowed).toBe(true);
    });

    it('gives a denied caller a positive retry hint', () => {
      for (let call = 0; call < AGENT_CAPABILITY_LIMIT_PER_WINDOW.WRITE_SENSITIVE; call += 1) {
        service.consumeCapability(AGENT, 'WRITE_SENSITIVE', NOW);
      }

      const denied = service.consumeCapability(AGENT, 'WRITE_SENSITIVE', NOW);

      expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('concurrency', () => {
    it('refuses a slot beyond the in-flight ceiling', () => {
      for (let slot = 0; slot < AGENT_CONCURRENCY_LIMIT; slot += 1) {
        expect(service.acquireSlot(AGENT, NOW).allowed).toBe(true);
      }

      expect(service.acquireSlot(AGENT, NOW).allowed).toBe(false);
    });

    it('frees capacity when a slot is released', () => {
      for (let slot = 0; slot < AGENT_CONCURRENCY_LIMIT; slot += 1) {
        service.acquireSlot(AGENT, NOW);
      }
      service.releaseSlot(AGENT);

      expect(service.acquireSlot(AGENT, NOW).allowed).toBe(true);
    });

    it('does not let one agent occupy another agent slots', () => {
      for (let slot = 0; slot < AGENT_CONCURRENCY_LIMIT; slot += 1) {
        service.acquireSlot(AGENT, NOW);
      }

      expect(service.acquireSlot(OTHER_AGENT, NOW).allowed).toBe(true);
    });

    it('ignores a release for an agent that holds nothing', () => {
      service.releaseSlot(AGENT);

      expect(service.acquireSlot(AGENT, NOW).remaining).toBe(AGENT_CONCURRENCY_LIMIT - 1);
    });
  });

  describe('retention', () => {
    it('forgets an idle agent so the map cannot grow without bound', () => {
      drainRequests(service, AGENT, NOW);
      const later = NOW + AGENT_RATE_LIMIT_RETENTION_MS * 2;

      service.consumeRequest(OTHER_AGENT, later);

      expect(service.consumeRequest(AGENT, later).remaining).toBe(
        AGENT_REQUEST_LIMIT_PER_WINDOW - 1,
      );
    });

    it('does not forget an agent that still has work in flight', () => {
      for (let slot = 0; slot < AGENT_CONCURRENCY_LIMIT; slot += 1) {
        service.acquireSlot(AGENT, NOW);
      }
      const later = NOW + AGENT_RATE_LIMIT_RETENTION_MS * 2;

      service.consumeRequest(OTHER_AGENT, later);

      // A swept budget would reset `inFlight` to zero and hand out a slot the
      // agent is not entitled to while its earlier calls are still running.
      expect(service.acquireSlot(AGENT, later).allowed).toBe(false);
    });
  });
});
