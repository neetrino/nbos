import { describe, expect, it } from 'vitest';
import { actorContextFromMachine } from '../actor';
import { getAiCapability } from './capability-registry';
import { assembleAuthorizedContext } from './context-assembler';
import type { AiAuthorizedContextSource, AiContextAssembleRequest } from './context-types';
import type { AiPolicyAllowDecision, AiPolicyDecision } from './policy-decision';

const ACTOR = actorContextFromMachine({
  id: 'ia-1',
  type: 'INTERNAL_AI',
  displayName: 'Delivery Assistant',
});

const ALLOW: AiPolicyAllowDecision = {
  outcome: 'ALLOW',
  actorId: ACTOR.actor.id,
  actorType: ACTOR.actor.type,
  capability: getAiCapability('tasks.read')!,
  matchedScope: { scopeType: 'WORKSPACE', scopeId: 'ws-1' },
};

const ALLOW_AUTHORIZED_WS: AiPolicyAllowDecision = {
  ...ALLOW,
  matchedScope: { scopeType: 'WORKSPACE', scopeId: 'ws-authorized' },
};

function source(overrides: Partial<AiAuthorizedContextSource> = {}): AiAuthorizedContextSource {
  return {
    sourceType: 'TASK',
    sourceId: 'task-1',
    projection: { id: 'task-1', title: 'Ship prompt foundation' },
    classification: 'INTERNAL',
    sourceUpdatedAt: '2026-08-22T10:00:00.000Z',
    accessBasis: { capabilityKey: 'tasks.read', scopeType: 'WORKSPACE', scopeId: 'ws-1' },
    ...overrides,
  };
}

function request(overrides: Partial<AiContextAssembleRequest> = {}): AiContextAssembleRequest {
  return {
    actorId: ACTOR.actor.id,
    actorType: ACTOR.actor.type,
    authorization: ALLOW,
    sources: [source()],
    maxDataClassification: 'SENSITIVE',
    now: new Date('2026-08-22T12:00:00.000Z'),
    ...overrides,
  };
}

describe('assembleAuthorizedContext', () => {
  it('refuses to assemble without an ALLOW decision', () => {
    const denied: AiPolicyDecision = { outcome: 'DENY', reason: 'CAPABILITY_NOT_GRANTED' };
    expect(assembleAuthorizedContext({ ...request(), authorization: denied as never })).toEqual({
      ok: false,
      reason: 'AUTHORIZATION_DENIED',
    });
  });

  it('refuses a replayed ALLOW for a different actor', () => {
    expect(
      assembleAuthorizedContext(request({ actorId: 'ia-other', actorType: 'INTERNAL_AI' })),
    ).toEqual({ ok: false, reason: 'AUTHORIZATION_DENIED' });
  });

  it('omits a source whose resource is not the matched ALLOW resource', () => {
    const result = assembleAuthorizedContext(
      request({
        authorization: {
          ...ALLOW,
          matchedScope: { scopeType: 'RESOURCE', scopeId: 'task-1', resourceType: 'TASK' },
        },
        sources: [
          source({
            accessBasis: {
              capabilityKey: 'tasks.read',
              scopeType: 'RESOURCE',
              scopeId: 'task-other',
              resourceType: 'TASK',
            },
          }),
        ],
      }),
    );
    expect(result.ok && result.context.omitted[0]?.reason).toBe('UNAUTHORIZED');
  });

  it('omits a source whose workspace is not the matched ALLOW scope', () => {
    const result = assembleAuthorizedContext(
      request({
        authorization: ALLOW_AUTHORIZED_WS,
        sources: [
          source({
            accessBasis: {
              capabilityKey: 'tasks.read',
              scopeType: 'WORKSPACE',
              scopeId: 'ws-other',
            },
          }),
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.context.fragments).toHaveLength(0);
    expect(result.context.omitted[0]?.reason).toBe('UNAUTHORIZED');
  });

  it('omits sources whose capability does not match the ALLOW decision', () => {
    const result = assembleAuthorizedContext(
      request({
        sources: [source({ accessBasis: { capabilityKey: 'tasks.update' } })],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.context.fragments).toHaveLength(0);
    expect(result.context.omitted[0]?.reason).toBe('UNAUTHORIZED');
  });

  it('marks task and message content untrusted and prompt config trusted', () => {
    const result = assembleAuthorizedContext(
      request({
        sources: [
          source(),
          source({
            sourceType: 'PROMPT_POLICY',
            sourceId: 'prompt-1',
            projection: { version: 2 },
          }),
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const trust = Object.fromEntries(
      result.context.fragments.map((item) => [item.sourceType, item.classification.trust]),
    );
    expect(trust.TASK).toBe('UNTRUSTED_CONTENT');
    expect(trust.PROMPT_POLICY).toBe('TRUSTED_CONFIG');
  });

  it('omits SECRET classification and secret-shaped fields', () => {
    const secretClass = assembleAuthorizedContext(
      request({ sources: [source({ classification: 'SECRET' })] }),
    );
    expect(secretClass.ok && secretClass.context.omitted[0]?.reason).toBe('SECRET');

    const secretField = assembleAuthorizedContext(
      request({
        sources: [source({ projection: { id: 't-1', apiKey: 'sk-secret' } })],
      }),
    );
    expect(secretField.ok && secretField.context.omitted[0]?.reason).toBe('SECRET');
  });

  it('omits nested secret-shaped fields and keeps safe siblings', () => {
    const nested = assembleAuthorizedContext(
      request({
        sources: [source({ projection: { id: 't-1', metadata: { apiKey: 'sk-secret' } } })],
      }),
    );
    expect(nested.ok && nested.context.omitted[0]?.reason).toBe('SECRET');

    const nestedArray = assembleAuthorizedContext(
      request({
        sources: [source({ projection: { id: 't-2', items: [{ token: 'abc' }] } })],
      }),
    );
    expect(nestedArray.ok && nestedArray.context.omitted[0]?.reason).toBe('SECRET');

    const variant = assembleAuthorizedContext(
      request({
        sources: [source({ projection: { id: 't-3', extra: { 'API-Key': 'sk' } } })],
      }),
    );
    expect(variant.ok && variant.context.omitted[0]?.reason).toBe('SECRET');

    const safe = assembleAuthorizedContext(
      request({
        sources: [source({ projection: { id: 't-4', metadata: { note: 'safe sibling' } } })],
      }),
    );
    expect(safe.ok && safe.context.fragments[0]?.projection).toEqual({
      id: 't-4',
      metadata: { note: 'safe sibling' },
    });
  });

  it('rejects the verifier probe: foreign workspace plus nested apiKey', () => {
    const result = assembleAuthorizedContext(
      request({
        authorization: ALLOW_AUTHORIZED_WS,
        sources: [
          source({
            accessBasis: {
              capabilityKey: 'tasks.read',
              scopeType: 'WORKSPACE',
              scopeId: 'ws-other',
            },
            projection: { id: 'task-x', metadata: { apiKey: 'sk-nested' } },
          }),
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.context.fragments).toHaveLength(0);
    expect(result.context.omitted[0]).toEqual({
      sourceId: 'task-1',
      sourceType: 'TASK',
      reason: 'UNAUTHORIZED',
    });
  });

  it('omits sources above the capability classification ceiling', () => {
    const result = assembleAuthorizedContext(
      request({
        maxDataClassification: 'SECRET',
        sources: [source({ classification: 'SENSITIVE' })],
      }),
    );
    expect(result.ok && result.context.omitted[0]?.reason).toBe('CLASSIFICATION');
  });

  it('omits fragments above the classification ceiling', () => {
    const result = assembleAuthorizedContext(
      request({
        maxDataClassification: 'INTERNAL',
        sources: [source({ classification: 'SENSITIVE' })],
      }),
    );
    expect(result.ok && result.context.omitted[0]?.reason).toBe('CLASSIFICATION');
  });

  it('records provenance, freshness and budget truncation', () => {
    const result = assembleAuthorizedContext(
      request({
        budget: { maxFragments: 1, maxChars: 12_000 },
        sources: [
          source({ sourceType: 'PROMPT_POLICY', sourceId: 'prompt-1', projection: { v: 1 } }),
          source({ sourceId: 'task-2', projection: { id: 'task-2', title: 'Later' } }),
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.context.fragments).toHaveLength(1);
    expect(result.context.fragments[0]?.sourceType).toBe('PROMPT_POLICY');
    expect(result.context.fragments[0]?.provenance.accessBasis.capabilityKey).toBe('tasks.read');
    expect(result.context.fragments[0]?.freshness.retrievedAt).toBe('2026-08-22T12:00:00.000Z');
    expect(result.context.budget.truncated).toBe(true);
    expect(result.context.omitted.some((item) => item.reason === 'BUDGET')).toBe(true);
  });
});
