import { describe, expect, it } from 'vitest';
import { formatAuditActorLabel, type AuditLogEntry } from './audit';

function entry(overrides: Partial<AuditLogEntry>): AuditLogEntry {
  return {
    id: 'log-1',
    projectId: null,
    entityType: 'Task',
    entityId: 't1',
    action: 'update',
    userId: 'emp-1',
    changes: null,
    ipAddress: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    actor: null,
    ...overrides,
  };
}

describe('formatAuditActorLabel', () => {
  it('uses employee first/last name', () => {
    expect(
      formatAuditActorLabel(
        entry({
          actor: { id: 'emp-1', firstName: 'Sam', lastName: 'Lee', type: 'USER' },
        }),
      ),
    ).toBe('Sam Lee');
  });

  it('prefers displayName for machine actors', () => {
    expect(
      formatAuditActorLabel(
        entry({
          userId: null,
          actorId: 'agent-1',
          actor: {
            id: 'agent-1',
            type: 'EXTERNAL_AGENT',
            displayName: 'Cursor Agent',
            firstName: 'Cursor Agent',
            lastName: '',
          },
        }),
      ),
    ).toBe('Cursor Agent');
  });

  it('does not throw when userId is null', () => {
    expect(formatAuditActorLabel(entry({ userId: null, actorId: 'agent-9' }))).toBe('agent-9');
    expect(formatAuditActorLabel(entry({ userId: null, actorId: null }))).toBe('Unknown actor');
  });
});
