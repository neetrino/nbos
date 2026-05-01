import { describe, expect, it } from 'vitest';
import type { WorkSpace } from '@/lib/api/tasks';
import {
  filterWorkSpaces,
  groupWorkSpaces,
  summarizeWorkSpaces,
  buildWorkSpaceContextHref,
} from './work-space-utils';

const STANDALONE_WORKSPACE: WorkSpace = {
  id: 'ws-standalone',
  projectId: null,
  productId: null,
  extensionId: null,
  name: 'Finance Ops',
  type: 'STANDALONE_OPERATIONAL',
  scrumEnabled: false,
  description: 'Monthly close',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  _count: { tasks: 2 },
};

const PRODUCT_WORKSPACE: WorkSpace = {
  id: 'ws-product',
  projectId: 'project-1',
  productId: 'product-1',
  extensionId: null,
  name: 'Website Work Space',
  type: 'PRODUCT_DELIVERY',
  scrumEnabled: true,
  description: null,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  project: { id: 'project-1', code: 'PRJ', name: 'Marco' },
  product: { id: 'product-1', name: 'Website', status: 'ACTIVE' },
  _count: { tasks: 5 },
};

const LEGACY_EXTENSION_WORKSPACE: WorkSpace = {
  id: 'ws-extension',
  projectId: 'project-1',
  productId: null,
  extensionId: 'extension-1',
  name: 'Legacy Extension Work Space',
  type: 'EXTENSION_DELIVERY',
  scrumEnabled: false,
  description: null,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  _count: { tasks: 1 },
};

const WORKSPACES: WorkSpace[] = [STANDALONE_WORKSPACE, PRODUCT_WORKSPACE];

describe('work-space-utils', () => {
  it('summarizes Work Spaces by type', () => {
    expect(summarizeWorkSpaces(WORKSPACES)).toEqual({
      total: 2,
      standalone: 1,
      product: 1,
    });
  });

  it('groups Work Spaces for list sections', () => {
    const groups = groupWorkSpaces(WORKSPACES);

    expect(groups.standalone).toHaveLength(1);
    expect(groups.product).toHaveLength(1);
  });

  it('hides legacy Extension Work Spaces from standalone UI collections', () => {
    const withLegacyExtension = [...WORKSPACES, LEGACY_EXTENSION_WORKSPACE];

    expect(filterWorkSpaces(withLegacyExtension, '', {})).toEqual(WORKSPACES);
    expect(summarizeWorkSpaces(withLegacyExtension).total).toBe(2);
    expect(groupWorkSpaces(withLegacyExtension).product).toEqual([PRODUCT_WORKSPACE]);
  });

  it('filters by search and mode', () => {
    expect(filterWorkSpaces(WORKSPACES, 'website', { mode: 'scrum' })).toEqual([PRODUCT_WORKSPACE]);
  });

  it('builds Product context href', () => {
    expect(buildWorkSpaceContextHref(PRODUCT_WORKSPACE)).toBe(
      '/projects/project-1/products/product-1?tab=tasks',
    );
  });
});
