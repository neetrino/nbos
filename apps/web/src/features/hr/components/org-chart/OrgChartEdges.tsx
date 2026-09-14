'use client';

import type { OrgChartLayout, OrgChartLayoutNode } from './org-chart-layout';

const EDGE_STROKE_CLASS = 'stroke-sky-400 fill-none';
const EDGE_STROKE_WIDTH = 2;

function nodeCenterX(node: OrgChartLayoutNode): number {
  return node.x + node.width / 2;
}

function edgePath(parent: OrgChartLayoutNode, child: OrgChartLayoutNode): string {
  const x1 = nodeCenterX(parent);
  const y1 = parent.y + parent.height;
  const x2 = nodeCenterX(child);
  const y2 = child.y;
  const midY = y1 + (y2 - y1) / 2;
  return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
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
