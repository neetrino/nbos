import { describe, expect, it } from 'vitest';
import { getAiCapability } from './capability-registry';
import { projectCapabilityOutput } from './capability-output';
import { evaluateAiBudget, shouldHardStopAiBudget } from './budget-evaluate';
import { assertExecutionRecordSafe, findExecutionRecordSafetyIssues } from './execution-record';
import type { AiBudgetLimitRecord } from './budget-types';
import type { AiExecutionRecord } from './execution-types';
import {
  canTransitionEvaluationRun,
  evaluationScoreMayAutoActivateModel,
} from './evaluation-lifecycle';

function budget(overrides: Partial<AiBudgetLimitRecord> = {}): AiBudgetLimitRecord {
  return {
    id: 'budget-1',
    name: 'Org monthly',
    scopeType: 'ORGANIZATION',
    scopeId: 'PLATFORM',
    metric: 'ESTIMATED_COST',
    period: 'MONTHLY',
    ceiling: '100',
    currency: 'USD',
    behavior: 'HARD_STOP',
    enabled: true,
    ...overrides,
  };
}

function execution(overrides: Partial<AiExecutionRecord> = {}): AiExecutionRecord {
  return {
    id: 'exec-1',
    kind: 'CAPABILITY',
    status: 'SUCCEEDED',
    actor: { actorType: 'EXTERNAL_AGENT', actorId: 'agent-1' },
    onBehalfOf: null,
    externalAgentId: 'agent-1',
    internalAgentId: null,
    providerConnectionId: null,
    modelId: null,
    modelPolicyId: null,
    modelPolicyVersion: null,
    promptPolicyId: null,
    promptVersionId: null,
    capabilityKey: 'tasks.read',
    domainModule: 'Tasks',
    channel: 'rest',
    correlationId: 'corr-1',
    inputUnits: 12,
    outputUnits: 4,
    cachedUnits: null,
    reasoningUnits: null,
    otherUnits: null,
    providerReportedCost: null,
    estimatedCost: null,
    currency: null,
    pricingVersion: 'openai-2026-08-01',
    pricingEffectiveOn: new Date('2026-08-01T00:00:00.000Z'),
    retryCount: 0,
    fallbackOccurred: false,
    fallbackReason: null,
    selectedPrimaryModelId: null,
    selectedFallbackModelId: null,
    latencyMs: 42,
    errorCode: null,
    startedAt: new Date(),
    completedAt: new Date(),
    ...overrides,
  };
}

describe('AI execution/usage contracts', () => {
  it('accepts an attribution row without prompt or secret fields', () => {
    expect(findExecutionRecordSafetyIssues(execution())).toEqual([]);
    expect(() => assertExecutionRecordSafe(execution())).not.toThrow();
  });

  it('rejects prompt bodies stored as metrics', () => {
    expect(findExecutionRecordSafetyIssues({ ...execution(), prompt: 'system: ...' })).toEqual([
      { code: 'PROMPT_BODY_FIELD', field: 'prompt' },
    ]);
  });

  it('rejects secret-shaped metrics metadata', () => {
    expect(findExecutionRecordSafetyIssues({ ...execution(), apiKey: 'sk-test' })).toEqual(
      expect.arrayContaining([{ code: 'SECRET_SHAPED_FIELD', field: '*' }]),
    );
  });
});

describe('AI budget evaluation', () => {
  it('stays within the ceiling below the alert ratio', () => {
    expect(evaluateAiBudget(budget(), '10').verdict).toBe('WITHIN_LIMIT');
  });

  it('alerts before a hard stop', () => {
    const reached = evaluateAiBudget(budget(), '80');
    expect(reached.verdict).toBe('THRESHOLD_REACHED');
    expect(shouldHardStopAiBudget(reached)).toBe(false);
  });

  it('hard-stops only after the ceiling is exceeded', () => {
    const exceeded = evaluateAiBudget(budget(), '101');
    expect(exceeded.verdict).toBe('EXCEEDED');
    expect(shouldHardStopAiBudget(exceeded)).toBe(true);
    expect(
      shouldHardStopAiBudget(evaluateAiBudget(budget({ behavior: 'ALERT_ONLY' }), '101')),
    ).toBe(false);
  });
});

describe('AI evaluation lifecycle', () => {
  it('keeps run transitions terminal after completion', () => {
    expect(canTransitionEvaluationRun('PENDING', 'RUNNING')).toBe(true);
    expect(canTransitionEvaluationRun('COMPLETED', 'RUNNING')).toBe(false);
  });

  it('never treats an evaluation score as model activation', () => {
    expect(evaluationScoreMayAutoActivateModel()).toBe(false);
  });
});

describe('capability output projection', () => {
  it('strips undeclared fields from a task projection', () => {
    const capability = getAiCapability('tasks.read');
    if (!capability) throw new Error('missing tasks.read');
    const projected = projectCapabilityOutput(capability, {
      id: 'task-1',
      code: 'T-1',
      title: 'A',
      description: null,
      status: 'OPEN',
      priority: 'NORMAL',
      dueDate: null,
      workspaceId: 'ws-1',
      sprintId: null,
      updatedAt: '2026-08-22T00:00:00.000Z',
      secretNotes: 'nope',
    });
    expect(projected).toMatchObject({ id: 'task-1', code: 'T-1' });
    expect(projected).not.toHaveProperty('secretNotes');
  });

  it('preserves handler { items, meta } and strips extra item fields', () => {
    const capability = getAiCapability('tasks.list');
    if (!capability) throw new Error('missing tasks.list');
    const projected = projectCapabilityOutput(capability, {
      items: [{ id: 't1', code: 'T-1', title: 'A', extra: true }],
      meta: { page: 1, pageSize: 20, total: 1 },
    }) as { items: Array<Record<string, unknown>>; meta: unknown };
    expect(projected.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(projected).not.toHaveProperty('page');
    const first = projected.items[0];
    expect(first).toBeDefined();
    if (!first) throw new Error('expected projected item');
    expect(first).not.toHaveProperty('extra');
    expect(first.id).toBe('t1');
  });

  it('does not treat a top-level page key as the live list envelope', () => {
    const capability = getAiCapability('tasks.list');
    if (!capability) throw new Error('missing tasks.list');
    const projected = projectCapabilityOutput(capability, {
      items: [{ id: 't1', code: 'T-1', title: 'A' }],
      page: { page: 1, pageSize: 20, total: 1 },
    }) as Record<string, unknown>;
    expect(projected).not.toHaveProperty('page');
    expect(projected).not.toHaveProperty('meta');
    expect(projected.items).toEqual([expect.objectContaining({ id: 't1' })]);
  });
});
