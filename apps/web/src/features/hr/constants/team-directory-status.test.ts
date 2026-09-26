import { describe, expect, it } from 'vitest';
import {
  isDefaultTeamDirectoryScope,
  resolveTeamDirectoryStatusQuery,
  TEAM_DIRECTORY_STATUS_EVERYONE,
} from './team-directory-status';

const idle = { quickStatus: null, filterStatus: undefined, showTerminated: false };

describe('resolveTeamDirectoryStatusQuery', () => {
  it('hides terminated people by default', () => {
    expect(resolveTeamDirectoryStatusQuery(idle)).toEqual({ excludeStatus: 'TERMINATED' });
    expect(isDefaultTeamDirectoryScope(idle)).toBe(true);
  });

  it('shows only terminated people from the chip', () => {
    const input = { ...idle, showTerminated: true };
    expect(resolveTeamDirectoryStatusQuery(input)).toEqual({ status: 'TERMINATED' });
    expect(isDefaultTeamDirectoryScope(input)).toBe(false);
  });

  it('shows every status when the include-terminated filter is set', () => {
    const input = { ...idle, filterStatus: TEAM_DIRECTORY_STATUS_EVERYONE };
    expect(resolveTeamDirectoryStatusQuery(input)).toEqual({});
    expect(isDefaultTeamDirectoryScope(input)).toBe(false);
  });

  it('prefers a quick status chip over the default exclusion', () => {
    expect(resolveTeamDirectoryStatusQuery({ ...idle, quickStatus: 'PROBATION' })).toEqual({
      status: 'PROBATION',
    });
  });
});
