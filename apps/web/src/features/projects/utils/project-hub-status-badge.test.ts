import { describe, expect, it } from 'vitest';
import type { Project } from '@/lib/api/projects';
import { resolveProjectHubStatus } from './project-hub-status-badge';

function project(partial: Partial<Project>): Project {
  return {
    id: 'p1',
    code: 'P-2026-0001',
    name: 'Test',
    description: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    company: null,
    contact: { id: 'c1', firstName: 'A', lastName: 'B' },
    _count: { orders: 0, products: 0 },
    ...partial,
  };
}

describe('resolveProjectHubStatus', () => {
  it('prefers trash, then API hubView', () => {
    expect(resolveProjectHubStatus(project({ trashedAt: '2026-01-01T00:00:00.000Z' }))).toBe(
      'trash',
    );
    expect(
      resolveProjectHubStatus(project({ hubView: 'closed', _count: { orders: 0, products: 1 } })),
    ).toBe('closed');
  });

  it('falls back to incoming when the list item has no children', () => {
    expect(resolveProjectHubStatus(project({}))).toBe('incoming');
  });

  it('uses the current Hub tab when API hubView is missing', () => {
    expect(resolveProjectHubStatus(project({ _count: { orders: 1, products: 1 } }), 'closed')).toBe(
      'closed',
    );
  });
});
