import { describe, expect, it } from 'vitest';
import type { Product } from '@/lib/api/products';
import type { Project } from '@/lib/api/projects';
import type { WorkSpace } from '@/lib/api/tasks';
import {
  buildTaskDeliveryContextOptions,
  parseTaskDeliveryContextValue,
  rankTaskDeliveryContextOptions,
  scoreTaskDeliveryContextMatch,
} from './search-task-delivery-context';

function project(id: string, name: string): Project {
  return { id, name } as Project;
}

function product(id: string, name: string, projectId: string, projectName: string): Product {
  return {
    id,
    name,
    projectId,
    project: { id: projectId, name: projectName, code: 'P' },
  } as Product;
}

function workSpace(partial: Partial<WorkSpace> & Pick<WorkSpace, 'id' | 'name'>): WorkSpace {
  return {
    projectId: null,
    productId: null,
    extensionId: null,
    type: 'STANDALONE_OPERATIONAL',
    scrumEnabled: false,
    description: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('buildTaskDeliveryContextOptions', () => {
  it('nests products and product work spaces under project', () => {
    const options = buildTaskDeliveryContextOptions({
      projects: [project('proj-1', 'Acme Hub')],
      products: [product('prod-1', 'Website', 'proj-1', 'Acme Hub')],
      workSpaces: [
        workSpace({
          id: 'ws-1',
          name: 'Website Delivery',
          productId: 'prod-1',
          type: 'PRODUCT_DELIVERY',
        }),
      ],
    });

    expect(options.map((row) => row.value)).toEqual([
      'PROJECT:proj-1',
      'PRODUCT:prod-1',
      'WORK_SPACE:ws-1',
    ]);
    expect(options[2]?.nestLevel).toBe(2);
    expect(options[2]?.contextLabel).toBe('Website');
  });

  it('lists standalone work spaces at the root', () => {
    const options = buildTaskDeliveryContextOptions({
      projects: [],
      products: [],
      workSpaces: [workSpace({ id: 'ws-ops', name: 'Finance Ops' })],
    });

    expect(options).toEqual([
      expect.objectContaining({
        value: 'WORK_SPACE:ws-ops',
        kind: 'WORK_SPACE',
        nestLevel: 0,
        contextLabel: 'Standalone',
      }),
    ]);
  });
});

describe('parseTaskDeliveryContextValue', () => {
  it('parses project, product and work space values', () => {
    expect(parseTaskDeliveryContextValue('PROJECT:abc')).toEqual({
      kind: 'PROJECT',
      entityId: 'abc',
    });
    expect(parseTaskDeliveryContextValue('PRODUCT:xyz')).toEqual({
      kind: 'PRODUCT',
      entityId: 'xyz',
    });
    expect(parseTaskDeliveryContextValue('WORK_SPACE:ws-1')).toEqual({
      kind: 'WORK_SPACE',
      entityId: 'ws-1',
    });
    expect(parseTaskDeliveryContextValue('DEAL:1')).toBeNull();
  });
});

describe('rankTaskDeliveryContextOptions', () => {
  it('puts the strongest name match first and drops non-matches', () => {
    const ranked = rankTaskDeliveryContextOptions(
      [
        {
          value: 'PROJECT:a',
          kind: 'PROJECT',
          entityId: 'a',
          label: 'mylercrm',
          contextLabel: null,
          nestLevel: 0,
        },
        {
          value: 'PROJECT:b',
          kind: 'PROJECT',
          entityId: 'b',
          label: 'Marco.am Code',
          contextLabel: null,
          nestLevel: 0,
        },
        {
          value: 'WORK_SPACE:m',
          kind: 'WORK_SPACE',
          entityId: 'm',
          label: 'Marketing 1',
          contextLabel: 'Standalone',
          nestLevel: 0,
        },
      ],
      'marketing',
    );

    expect(ranked.map((row) => row.value)).toEqual(['WORK_SPACE:m']);
    expect(scoreTaskDeliveryContextMatch(ranked[0]!, 'marketing')).toBeGreaterThan(50);
  });

  it('prefers prefix match over substring', () => {
    const ranked = rankTaskDeliveryContextOptions(
      [
        {
          value: 'PROJECT:1',
          kind: 'PROJECT',
          entityId: '1',
          label: 'The Marketing Co',
          contextLabel: null,
          nestLevel: 0,
        },
        {
          value: 'WORK_SPACE:2',
          kind: 'WORK_SPACE',
          entityId: '2',
          label: 'Marketing 1',
          contextLabel: 'Standalone',
          nestLevel: 0,
        },
      ],
      'marketing',
    );

    expect(ranked[0]?.value).toBe('WORK_SPACE:2');
    expect(ranked[1]?.value).toBe('PROJECT:1');
  });
});
