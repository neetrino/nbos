import { describe, expect, it } from 'vitest';
import { AgentAccessException } from '../auth/agent-auth.errors';
import {
  readOptionalIsoDate,
  readOptionalSortBy,
  readOptionalTaskPriority,
  readOptionalTaskStatus,
  readRequiredIsoDateTime,
} from './agent-capability.validators';

describe('agent capability validators', () => {
  it('rejects invalid status, priority, sortBy and dates', () => {
    expect(() => readOptionalTaskStatus({ status: 'DONE' })).toThrow(AgentAccessException);
    expect(() => readOptionalTaskPriority({ priority: 'URGENT' })).toThrow(AgentAccessException);
    expect(() => readOptionalSortBy({ sortBy: 'secret' })).toThrow(AgentAccessException);
    expect(() => readOptionalIsoDate({ dueDate: 'not-a-date' }, 'dueDate')).toThrow(
      AgentAccessException,
    );
    expect(() =>
      readRequiredIsoDateTime({ expectedUpdatedAt: '2020-01-01' }, 'expectedUpdatedAt'),
    ).toThrow(AgentAccessException);
  });

  it('accepts catalog enums and ISO timestamps', () => {
    expect(readOptionalTaskStatus({ status: 'OPEN' })).toBe('OPEN');
    expect(readOptionalTaskPriority({ priority: 'HIGH' })).toBe('HIGH');
    expect(readOptionalSortBy({ sortBy: 'updatedAt' })).toBe('updatedAt');
    expect(readOptionalIsoDate({ dueDate: '2026-12-31' }, 'dueDate')).toBe('2026-12-31');
    const iso = '2026-08-21T00:00:00.000Z';
    expect(
      readRequiredIsoDateTime({ expectedUpdatedAt: iso }, 'expectedUpdatedAt').toISOString(),
    ).toBe(iso);
  });
});
