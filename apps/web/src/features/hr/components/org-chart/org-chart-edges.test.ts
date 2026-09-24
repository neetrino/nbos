import { describe, expect, it } from 'vitest';
import type { DepartmentItem } from '@/lib/api/employees';
import { edgePath, highlightedEdgeChildIds } from './OrgChartEdges';
import type { OrgChartLayoutNode } from './org-chart-layout';

function node(id: string, x: number, y: number): OrgChartLayoutNode {
  return { id, x, y, width: 100, height: 40 };
}

function dept(id: string, parentId: string | null): DepartmentItem {
  return {
    id,
    name: id,
    slug: id,
    description: null,
    parentId,
    sortOrder: 0,
  };
}

describe('edgePath', () => {
  it('rounds both elbows of a sibling connector', () => {
    const path = edgePath(node('parent', 0, 0), node('child', 200, 136));
    expect(path).toContain('Q 50 88 66 88');
    expect(path).toContain('Q 250 88 250 104');
  });

  it('stays a straight drop when the child is centered under the parent', () => {
    expect(edgePath(node('parent', 0, 0), node('child', 0, 136))).toBe('M 50 40 L 50 136');
  });
});

describe('highlightedEdgeChildIds', () => {
  const departments = [dept('root', null), dept('hr', 'root'), dept('academy', 'hr')];

  it('marks the selected department and its ancestors', () => {
    expect([...highlightedEdgeChildIds(departments, 'academy')].sort()).toEqual([
      'academy',
      'hr',
      'root',
    ]);
  });

  it('is empty when nothing is selected', () => {
    expect(highlightedEdgeChildIds(departments, null).size).toBe(0);
  });
});
