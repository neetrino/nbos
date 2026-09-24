import { describe, expect, it } from 'vitest';
import { edgePath } from './OrgChartEdges';
import type { OrgChartLayoutNode } from './org-chart-layout';

function node(id: string, x: number, y: number): OrgChartLayoutNode {
  return { id, x, y, width: 100, height: 40 };
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
