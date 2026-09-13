import { describe, expect, it } from 'vitest';
import {
  resolveQuickCreateTaskLinks,
  resolveQuickCreateWorkspaceId,
} from './resolve-quick-create-task-links';

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

  it('merges picked project and product links without duplicating defaults', () => {
    const picked = [
      { kind: 'PROJECT' as const, entityId: 'p1', label: 'Alpha', contextLabel: null },
      { kind: 'PRODUCT' as const, entityId: 'prod-1', label: 'Site', contextLabel: 'Alpha' },
    ];
    expect(
      resolveQuickCreateTaskLinks(undefined, { entityType: 'PROJECT', entityId: 'p1' }, picked),
    ).toEqual([
      { entityType: 'PROJECT', entityId: 'p1' },
      { entityType: 'PRODUCT', entityId: 'prod-1' },
    ]);
  });

  it('does not put a work space into links', () => {
    const picked = [
      { kind: 'WORK_SPACE' as const, entityId: 'ws-1', label: 'Board', contextLabel: null },
    ];
    expect(resolveQuickCreateTaskLinks(undefined, undefined, picked)).toBeUndefined();
  });
});

describe('resolveQuickCreateWorkspaceId', () => {
  it('lets a manual work space override the contextual default', () => {
    expect(resolveQuickCreateWorkspaceId('ws-default', 'ws-picked')).toBe('ws-picked');
  });

  it('keeps the contextual work space when the user does not pick one', () => {
    expect(resolveQuickCreateWorkspaceId('ws-default', undefined)).toBe('ws-default');
  });
});
