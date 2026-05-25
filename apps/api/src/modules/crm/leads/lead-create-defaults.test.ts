import { describe, it, expect } from 'vitest';
import { resolveLeadCreateDefaults } from './lead-create-defaults.op';

describe('resolveLeadCreateDefaults', () => {
  it('uses actor as assigned seller when omitted', () => {
    const resolved = resolveLeadCreateDefaults({ name: 'Website redesign' }, { actorId: 'emp-1' });
    expect(resolved.assignedTo).toBe('emp-1');
  });

  it('keeps explicit assignedTo', () => {
    const resolved = resolveLeadCreateDefaults(
      { name: 'Jane', assignedTo: 'emp-2' },
      { actorId: 'emp-1' },
    );
    expect(resolved.assignedTo).toBe('emp-2');
  });

  it('leaves seller unset when no actor and no assignee', () => {
    const resolved = resolveLeadCreateDefaults({ name: 'Inbound form' }, {});
    expect(resolved.assignedTo).toBeUndefined();
  });
});
