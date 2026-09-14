import { describe, expect, it } from 'vitest';
import { readEmployeeFromApiPayload } from './post-employee-avatar';

describe('readEmployeeFromApiPayload', () => {
  it('unwraps the Nest { data } envelope', () => {
    const employee = readEmployeeFromApiPayload({
      data: { id: 'emp-1', firstName: 'Anna' },
      timestamp: 'now',
    });
    expect(employee?.id).toBe('emp-1');
  });

  it('returns null for an empty payload', () => {
    expect(readEmployeeFromApiPayload(null)).toBeNull();
    expect(readEmployeeFromApiPayload({})).toBeNull();
  });
});
