import { describe, expect, it } from 'vitest';
import { projectsHubEmptyCopy } from './projects-hub-empty-copy';

describe('projectsHubEmptyCopy', () => {
  it('keeps create on working tabs and hides it on Closed and Trash', () => {
    expect(projectsHubEmptyCopy('all').showCreate).toBe(true);
    expect(projectsHubEmptyCopy('incoming').showCreate).toBe(true);
    expect(projectsHubEmptyCopy('active').showCreate).toBe(true);
    expect(projectsHubEmptyCopy('closed').showCreate).toBe(false);
    expect(projectsHubEmptyCopy('trash').showCreate).toBe(false);
  });
});
