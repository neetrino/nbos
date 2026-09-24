'use client';

import type { OrgChartLayout, OrgChartLayoutNode } from './org-chart-layout';

const EDGE_STROKE_CLASS = 'stroke-sky-400 fill-none';
const EDGE_STROKE_WIDTH = 2;
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

export function OrgChartEdges({ layout }: { layout: OrgChartLayout }) {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
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
        return (
          <path
            key={`${edge.fromId}-${edge.toId}`}
            d={edgePath(parent, child)}
            className={EDGE_STROKE_CLASS}
            strokeWidth={EDGE_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
