import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { legacyUserIdFromActor } from '@nbos/shared';
import {
  assertInternalAgentCanExecute,
  buildInternalAgentExecutionContext,
  buildInternalAgentExecutionRecord,
} from './internal-agent-execution';

const AGENT = { id: 'ia-1', name: 'Delivery Assistant', status: 'ACTIVE' as const };

describe('internal-agent-execution', () => {
  it('blocks new executions when paused, disabled, draft or archived', () => {
    expect(() => assertInternalAgentCanExecute({ ...AGENT, status: 'PAUSED' })).toThrow(
      BadRequestException,
    );
    expect(() => assertInternalAgentCanExecute({ ...AGENT, status: 'DISABLED' })).toThrow(
      BadRequestException,
    );
    expect(() => assertInternalAgentCanExecute({ ...AGENT, status: 'DRAFT' })).toThrow(
      BadRequestException,
    );
    expect(() => assertInternalAgentCanExecute({ ...AGENT, status: 'ARCHIVED' })).toThrow(
      BadRequestException,
    );
  });

  it('builds INTERNAL_AI context with onBehalfOf and never a userId', () => {
    const ctx = buildInternalAgentExecutionContext(AGENT, {
      surface: 'MESSENGER',
      onBehalfOfEmployeeId: 'emp-9',
      correlationId: 'corr-1',
    });
    expect(ctx.actor.type).toBe('INTERNAL_AI');
    expect(ctx.actor.id).toBe('ia-1');
    expect(ctx.channel?.source).toBe('messenger');
    expect(ctx.onBehalfOf?.id).toBe('emp-9');
    expect(legacyUserIdFromActor(ctx)).toBeNull();
  });

  it('preserves published prompt version identity without putting prompt text on the actor', () => {
    const record = buildInternalAgentExecutionRecord(
      AGENT,
      { surface: 'TASK', correlationId: 'corr-1' },
      {
        promptPolicyId: 'prompt-1',
        promptVersionId: 'ver-2',
        version: 2,
        contentDigest: 'abc123',
        status: 'PUBLISHED',
      },
    );
    expect(record.prompt?.promptVersionId).toBe('ver-2');
    expect(record.prompt?.version).toBe(2);
    expect(JSON.stringify(record.actor)).not.toContain('Never grant');
    expect(JSON.stringify(record.actor)).not.toContain('platformSafety');
  });
});
