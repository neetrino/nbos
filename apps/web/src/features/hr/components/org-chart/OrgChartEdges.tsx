'use client';

import { cn } from '@/lib/utils';
import type { DepartmentItem } from '@/lib/api/employees';
import { ORG_COMPANY_NODE_ID } from './org-chart-constants';
import type { OrgChartLayout, OrgChartLayoutNode } from './org-chart-layout';
import { ancestorDepartmentIds } from './org-chart-tree';

const EDGE_DEFAULT_STROKE_CLASS = 'stroke-sky-400 fill-none';
const EDGE_IDLE_STROKE_CLASS = 'stroke-sky-200 dark:stroke-sky-800 fill-none';
const EDGE_ACTIVE_STROKE_CLASS = 'stroke-sky-500 dark:stroke-sky-300 fill-none';
const EDGE_DEFAULT_STROKE_WIDTH = 2;
const EDGE_ACTIVE_STROKE_WIDTH = 3;
const EDGE_CORNER_RADIUS_PX = 16;

function nodeCenterX(node: OrgChartLayoutNode): number {
  return node.x + node.width / 2;
}

export function edgePath(parent: OrgChartLayoutNode, child: OrgChartLayoutNode): string {
  const x1 = nodeCenterX(parent);
  const y1 = parent.y + parent.height;
  const x2 = nodeCenterX(child);
  const y2 = child.y;
  const midY = y1 + (y2 - y1) / 2;
  const run = Math.abs(x2 - x1);
  if (run === 0) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const radius = Math.min(EDGE_CORNER_RADIUS_PX, run / 2, (y2 - y1) / 4);
  const direction = x2 > x1 ? 1 : -1;
  const yBefore = midY - radius;
  const yAfter = midY + radius;
  const xLeave = x1 + direction * radius;
  const xArrive = x2 - direction * radius;
  return [
    `M ${x1} ${y1}`,
    `L ${x1} ${yBefore}`,
    `Q ${x1} ${midY} ${xLeave} ${midY}`,
    `L ${xArrive} ${midY}`,
    `Q ${x2} ${midY} ${x2} ${yAfter}`,
    `L ${x2} ${y2}`,
  ].join(' ');
}

/** Child endpoints of edges on the path from company root to the selected department. */
export function highlightedEdgeChildIds(
  departments: DepartmentItem[],
  selectedId: string | null,
): Set<string> {
  if (!selectedId || selectedId === ORG_COMPANY_NODE_ID) return new Set();
  return new Set([selectedId, ...ancestorDepartmentIds(departments, selectedId)]);
}

export function OrgChartEdges({
  layout,
  departments,
  selectedId,
}: {
  layout: OrgChartLayout;
  departments: DepartmentItem[];
  selectedId: string | null;
}) {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const activeChildIds = highlightedEdgeChildIds(departments, selectedId);
  const hasSelection = activeChildIds.size > 0;
  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
      width={layout.width}
      height={layout.height}
      aria-hidden
    >
      {layout.edges.map((edge) => {
        const parent = byId.get(edge.fromId);
        const child = byId.get(edge.toId);
        if (!parent || !child) return null;
        const active = activeChildIds.has(edge.toId);
        return (
          <path
            key={`${edge.fromId}-${edge.toId}`}
            d={edgePath(parent, child)}
            className={cn(
              active
                ? EDGE_ACTIVE_STROKE_CLASS
                : hasSelection
                  ? EDGE_IDLE_STROKE_CLASS
                  : EDGE_DEFAULT_STROKE_CLASS,
            )}
            strokeWidth={active ? EDGE_ACTIVE_STROKE_WIDTH : EDGE_DEFAULT_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
