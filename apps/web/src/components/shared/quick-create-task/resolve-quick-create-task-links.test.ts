import { describe, expect, it } from 'vitest';
import { resolveQuickCreateTaskLinks } from './resolve-quick-create-task-links';

describe('resolveQuickCreateTaskLinks', () => {
  it('omits links for an unsorted task', () => {
    expect(resolveQuickCreateTaskLinks()).toBeUndefined();
  });

  it('prefers defaultLinks over a single defaultLink', () => {
    const links = [{ entityType: 'DEAL', entityId: 'd1' }];
    expect(resolveQuickCreateTaskLinks(links, { entityType: 'LEAD', entityId: 'l1' })).toEqual(
      links,
    );
  });

  it('wraps a single defaultLink', () => {
    const link = { entityType: 'PROJECT', entityId: 'p1' };
    expect(resolveQuickCreateTaskLinks(undefined, link)).toEqual([link]);
  });
});
