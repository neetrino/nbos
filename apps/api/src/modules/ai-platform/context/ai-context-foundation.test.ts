import { describe, expect, it } from 'vitest';
import { getAiCapability } from '@nbos/shared';
import { AiContextAssemblerService } from './ai-context-assembler.service';
import { AiKnowledgeService } from './ai-knowledge.service';
import { AiPersistentMemoryService } from './ai-persistent-memory.service';

describe('AI context foundation services', () => {
  it('assembles only after ALLOW and never from a Prisma-shaped source contract', () => {
    const assembler = new AiContextAssemblerService();
    const capability = getAiCapability('tasks.read');
    expect(capability).not.toBeNull();
    if (!capability) {
      return;
    }
    const denied = assembler.assemble({
      actorId: 'ia-1',
      actorType: 'INTERNAL_AI',
      authorization: { outcome: 'DENY', reason: 'CAPABILITY_NOT_GRANTED' },
      sources: [],
      maxDataClassification: 'INTERNAL',
    });
    expect(denied).toEqual({ ok: false, reason: 'AUTHORIZATION_DENIED' });

    const allowed = assembler.assemble({
      actorId: 'ia-1',
      actorType: 'INTERNAL_AI',
      authorization: {
        outcome: 'ALLOW',
        actorId: 'ia-1',
        actorType: 'INTERNAL_AI',
        capability,
        matchedScope: { scopeType: 'WORKSPACE', scopeId: 'ws-1' },
      },
      sources: [
        {
          sourceType: 'TASK',
          sourceId: 'task-1',
          projection: { id: 'task-1', title: 'Allowed projection' },
          classification: 'INTERNAL',
          accessBasis: {
            capabilityKey: 'tasks.read',
            scopeType: 'WORKSPACE',
            scopeId: 'ws-1',
          },
        },
      ],
      maxDataClassification: 'INTERNAL',
    });
    expect(allowed.ok).toBe(true);
  });

  it('keeps memory and knowledge disabled and authorization-first', () => {
    const memory = new AiPersistentMemoryService();
    const knowledge = new AiKnowledgeService();
    expect(memory.isEnabled()).toBe(false);
    expect(
      knowledge.retrieve({
        actorId: 'ia-1',
        actorType: 'INTERNAL_AI',
        authorization: { outcome: 'DENY', reason: 'RESOURCE_OUT_OF_SCOPE' },
        source: {
          sourceType: 'DOCUMENTS',
          sourceId: 'doc-1',
          requiredCapability: 'tasks.read',
          classification: 'INTERNAL',
          scopeType: 'WORKSPACE',
          scopeId: 'ws-1',
        },
        query: 'bypass auth',
      }),
    ).toEqual({ ok: false, reason: 'AUTHORIZATION_DENIED' });
  });
});
