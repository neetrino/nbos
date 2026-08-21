import { describe, expect, it } from 'vitest';
import { toAgentTaskProjection } from './agent-task-projection';

describe('agent task projection', () => {
  it('exposes the purpose-built fields and no finance or credential data', () => {
    const projection = toAgentTaskProjection({
      id: 't1',
      code: 'T-2026-1',
      title: 'Fix',
      description: 'Details',
      status: 'OPEN',
      priority: 'HIGH',
      dueDate: new Date('2026-08-21T00:00:00.000Z'),
      workspaceId: 'ws-1',
      sprintId: 's1',
      updatedAt: new Date('2026-08-21T00:00:00.000Z'),
    });
    expect(Object.keys(projection).sort()).toEqual(
      [
        'code',
        'description',
        'dueDate',
        'id',
        'priority',
        'reviewRequestedAt',
        'sprintId',
        'status',
        'title',
        'updatedAt',
        'workspaceId',
      ].sort(),
    );
    expect(projection.updatedAt).toBe('2026-08-21T00:00:00.000Z');
    expect(projection).not.toHaveProperty('invoiceId');
    expect(projection).not.toHaveProperty('credentialId');
  });
});
