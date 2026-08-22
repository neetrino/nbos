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

async function drainRequests(
  service: AgentRateLimitService,
  agentId: string,
  now: number,
): Promise<void> {
  for (let call = 0; call < AGENT_REQUEST_LIMIT_PER_WINDOW; call += 1) {
    await service.consumeRequest(agentId, now);
  }
}

describe('AgentRateLimitService', () => {
  let service: AgentRateLimitService;

  beforeEach(() => {
    service = new AgentRateLimitService();
  });

  describe('per-agent request budget', () => {
    it('refuses the request after the configured ceiling', async () => {
      await drainRequests(service, AGENT, NOW);

      expect((await service.consumeRequest(AGENT, NOW)).allowed).toBe(false);
    });

    it('meters each agent separately', async () => {
      await drainRequests(service, AGENT, NOW);

      expect((await service.consumeRequest(OTHER_AGENT, NOW)).allowed).toBe(true);
    });

    it('recovers in the next window', async () => {
      await drainRequests(service, AGENT, NOW);

      expect((await service.consumeRequest(AGENT, NOW + AGENT_RATE_LIMIT_WINDOW_MS)).allowed).toBe(
        true,
      );
    });
  });

  describe('per-capability budget', () => {
    it('applies the tighter sensitive-write ceiling before the request ceiling', async () => {
      for (let call = 0; call < AGENT_CAPABILITY_LIMIT_PER_WINDOW.WRITE_SENSITIVE; call += 1) {
        expect((await service.consumeCapability(AGENT, 'WRITE_SENSITIVE', NOW)).allowed).toBe(true);
      }

      expect((await service.consumeCapability(AGENT, 'WRITE_SENSITIVE', NOW)).allowed).toBe(false);
      expect((await service.consumeRequest(AGENT, NOW)).allowed).toBe(true);
    });

    it('keeps read and write classes in separate buckets', async () => {
      for (let call = 0; call < AGENT_CAPABILITY_LIMIT_PER_WINDOW.WRITE_SENSITIVE; call += 1) {
        await service.consumeCapability(AGENT, 'WRITE_SENSITIVE', NOW);
      }

      expect((await service.consumeCapability(AGENT, 'READ_STANDARD', NOW)).allowed).toBe(true);
    });

    it('gives a denied caller a positive retry hint', async () => {
      for (let call = 0; call < AGENT_CAPABILITY_LIMIT_PER_WINDOW.WRITE_SENSITIVE; call += 1) {
        await service.consumeCapability(AGENT, 'WRITE_SENSITIVE', NOW);
      }

      const denied = await service.consumeCapability(AGENT, 'WRITE_SENSITIVE', NOW);

      expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('concurrency', () => {
    it('refuses a slot beyond the in-flight ceiling', async () => {
      for (let slot = 0; slot < AGENT_CONCURRENCY_LIMIT; slot += 1) {
        expect((await service.acquireSlot(AGENT, NOW)).allowed).toBe(true);
      }

      expect((await service.acquireSlot(AGENT, NOW)).allowed).toBe(false);
    });

    it('frees capacity when a slot is released', async () => {
      for (let slot = 0; slot < AGENT_CONCURRENCY_LIMIT; slot += 1) {
        await service.acquireSlot(AGENT, NOW);
      }
      await service.releaseSlot(AGENT);

      expect((await service.acquireSlot(AGENT, NOW)).allowed).toBe(true);
    });

    it('does not let one agent occupy another agent slots', async () => {
      for (let slot = 0; slot < AGENT_CONCURRENCY_LIMIT; slot += 1) {
        await service.acquireSlot(AGENT, NOW);
      }

      expect((await service.acquireSlot(OTHER_AGENT, NOW)).allowed).toBe(true);
    });

    it('ignores a release for an agent that holds nothing', async () => {
      await service.releaseSlot(AGENT);

      expect((await service.acquireSlot(AGENT, NOW)).remaining).toBe(AGENT_CONCURRENCY_LIMIT - 1);
    });
  });

  describe('retention', () => {
    it('forgets an idle agent so the map cannot grow without bound', async () => {
      await drainRequests(service, AGENT, NOW);
      const later = NOW + AGENT_RATE_LIMIT_RETENTION_MS * 2;

      await service.consumeRequest(OTHER_AGENT, later);

      expect((await service.consumeRequest(AGENT, later)).remaining).toBe(
        AGENT_REQUEST_LIMIT_PER_WINDOW - 1,
      );
    });

    it('does not forget an agent that still has work in flight', async () => {
      for (let slot = 0; slot < AGENT_CONCURRENCY_LIMIT; slot += 1) {
        await service.acquireSlot(AGENT, NOW);
      }
      const later = NOW + AGENT_RATE_LIMIT_RETENTION_MS * 2;

      await service.consumeRequest(OTHER_AGENT, later);

      expect((await service.acquireSlot(AGENT, later)).allowed).toBe(false);
    });
  });
});
