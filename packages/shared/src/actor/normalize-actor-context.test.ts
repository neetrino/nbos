import { describe, expect, it } from 'vitest';
import {
  actorContextFromEmployee,
  actorContextFromInternalAgent,
  actorContextFromMachine,
  actorContextFromUserId,
  ActorContextError,
  legacyUserIdFromActor,
  normalizeActorContext,
} from './normalize-actor-context';

describe('normalizeActorContext', () => {
  it('normalizes a USER actor with display identity', () => {
    const ctx = normalizeActorContext({
      actor: { id: ' emp-1 ', type: 'USER', displayName: '  Sam Lee ' },
      organizationId: ' org-1 ',
      correlationId: ' corr-1 ',
      requestId: ' req-1 ',
      channel: { source: 'web', protocol: 'http' },
    });

    expect(ctx.actor).toEqual({ id: 'emp-1', type: 'USER', displayName: 'Sam Lee' });
    expect(ctx.organizationId).toBe('org-1');
    expect(ctx.correlationId).toBe('corr-1');
    expect(ctx.requestId).toBe('req-1');
    expect(ctx.channel).toEqual({ source: 'web', protocol: 'http' });
  });

  it('fills display name for machine actors', () => {
    const ctx = normalizeActorContext({
      actor: { id: 'agent-1', type: 'EXTERNAL_AGENT' },
    });
    expect(ctx.actor.displayName).toBe('External Agent');
  });

  it('keeps onBehalfOf without widening actor rights', () => {
    const ctx = normalizeActorContext({
      actor: { id: 'ai-1', type: 'INTERNAL_AI', displayName: 'Messenger Agent' },
      onBehalfOf: { id: 'emp-9', type: 'USER' },
    });
    expect(ctx.actor.type).toBe('INTERNAL_AI');
    expect(ctx.onBehalfOf).toEqual({
      id: 'emp-9',
      type: 'USER',
      displayName: 'Employee',
    });
  });

  it('rejects missing actor id', () => {
    expect(() => normalizeActorContext({ actor: { id: '  ', type: 'USER' } })).toThrow(
      ActorContextError,
    );
  });

  it('rejects unknown actor type', () => {
    expect(() =>
      normalizeActorContext({
        actor: { id: 'x', type: 'EMPLOYEE' as never },
      }),
    ).toThrow(/supported ActorType/);
  });
});

describe('actor helpers', () => {
  it('builds employee context without inventing a machine identity', () => {
    const ctx = actorContextFromEmployee({
      id: 'emp-2',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    expect(ctx.actor).toEqual({
      id: 'emp-2',
      type: 'USER',
      displayName: 'Ada Lovelace',
    });
    expect(legacyUserIdFromActor(ctx)).toBe('emp-2');
  });

  it('builds machine context and never maps it to userId', () => {
    const ctx = actorContextFromMachine({
      id: 'ext-1',
      type: 'EXTERNAL_AGENT',
      displayName: 'Cursor WS Agent',
    });
    expect(ctx.actor.type).toBe('EXTERNAL_AGENT');
    expect(legacyUserIdFromActor(ctx)).toBeNull();
  });

  it('rejects USER through the machine helper', () => {
    expect(() => actorContextFromMachine({ id: 'emp-1', type: 'USER' })).toThrow(
      /cannot create a USER actor/,
    );
  });

  it('supports SYSTEM and AUTOMATION actors', () => {
    expect(actorContextFromMachine({ id: 'sys', type: 'SYSTEM' }).actor.type).toBe('SYSTEM');
    expect(actorContextFromMachine({ id: 'auto', type: 'AUTOMATION' }).actor.type).toBe(
      'AUTOMATION',
    );
  });

  it('legacy userId helper matches actorContextFromUserId', () => {
    const ctx = actorContextFromUserId('emp-3', { channel: { source: 'web' } });
    expect(legacyUserIdFromActor(ctx)).toBe('emp-3');
    expect(ctx.channel?.source).toBe('web');
  });

  it('builds INTERNAL_AI from an agent identity without a userId', () => {
    const ctx = actorContextFromInternalAgent(
      { id: 'ia-1', name: 'Delivery Assistant' },
      { onBehalfOf: { id: 'emp-9', type: 'USER' }, channel: { source: 'messenger' } },
    );
    expect(ctx.actor).toEqual({
      id: 'ia-1',
      type: 'INTERNAL_AI',
      displayName: 'Delivery Assistant',
    });
    expect(ctx.channel?.source).toBe('messenger');
    expect(legacyUserIdFromActor(ctx)).toBeNull();
  });
});
