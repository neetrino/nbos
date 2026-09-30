import { describe, expect, it } from 'vitest';
import { applyPresenceDelta, parsePresenceSnapshot } from './messenger-presence-payload';

describe('messenger presence payload', () => {
  it('keeps the same set when an employee is already in that state', () => {
    const online = new Set(['e1']);
    expect(applyPresenceDelta(online, 'e1', 'online')).toBe(online);
    expect(applyPresenceDelta(online, 'e2', 'offline')).toBe(online);
  });

  it('rejects a snapshot that is not a list of employee ids', () => {
    expect(parsePresenceSnapshot({ employeeIds: 'e1' })).toBeNull();
    expect(parsePresenceSnapshot({ employeeIds: ['e1', 2] })).toEqual(['e1']);
  });
});
