import { describe, expect, it } from 'vitest';
import { actorProvenanceFields, createTaskInputFromHttpBody } from './task-create.input';

describe('createTaskInputFromHttpBody', () => {
  it('does not copy forged actor provenance from a client body', () => {
    const body = {
      title: 'Fix',
      creatorId: 'emp-1',
      createdByActorType: 'EXTERNAL_AGENT',
      createdByActorId: 'agent-forged',
    };
    const input = createTaskInputFromHttpBody(body as never);
    expect(input.title).toBe('Fix');
    expect(input.creatorId).toBe('emp-1');
    expect(input).not.toHaveProperty('createdByActorType');
    expect(input).not.toHaveProperty('createdByActorId');
  });
});

describe('actorProvenanceFields', () => {
  it('only emits columns from a trusted actor argument', () => {
    expect(actorProvenanceFields(undefined)).toEqual({});
    expect(actorProvenanceFields({ type: 'EXTERNAL_AGENT', id: 'agent-1' })).toEqual({
      createdByActorType: 'EXTERNAL_AGENT',
      createdByActorId: 'agent-1',
    });
  });
});
