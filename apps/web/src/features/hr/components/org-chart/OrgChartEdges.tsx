'use client';

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

type EdgeStroke = { className: string; strokeWidth: number };

function nodeCenterX(node: OrgChartLayoutNode): number {
  return node.x + node.width / 2;
}

function edgeMidY(parent: OrgChartLayoutNode, child: OrgChartLayoutNode): number {
  const y1 = parent.y + parent.height;
  return y1 + (child.y - y1) / 2;
}

function cornerRadius(run: number, drop: number): number {
  return Math.min(EDGE_CORNER_RADIUS_PX, run / 2, drop / 4);
}

/** Shared vertical from parent bottom to the sibling bus. */
export function trunkPath(parent: OrgChartLayoutNode, midY: number): string {
  const x1 = nodeCenterX(parent);
  const y1 = parent.y + parent.height;
  return `M ${x1} ${y1} L ${x1} ${midY}`;
}

/** Bus + drop from the shared trunk point to one child (no parent stem). */
export function branchFromTrunk(x1: number, midY: number, x2: number, y2: number): string {
  if (x1 === x2) return `M ${x1} ${midY} L ${x2} ${y2}`;
  const radius = cornerRadius(Math.abs(x2 - x1), y2 - midY);
  const direction = x2 > x1 ? 1 : -1;
  const xArrive = x2 - direction * radius;
  const yAfter = midY + radius;
  return [
    `M ${x1} ${midY}`,
    `L ${xArrive} ${midY}`,
    `Q ${x2} ${midY} ${x2} ${yAfter}`,
    `L ${x2} ${y2}`,
  ].join(' ');
}

/** Full connector = shared trunk + branch (rounded at the child elbow). */
export function edgePath(parent: OrgChartLayoutNode, child: OrgChartLayoutNode): string {
  const x1 = nodeCenterX(parent);
  const y1 = parent.y + parent.height;
  const x2 = nodeCenterX(child);
  const y2 = child.y;
  const midY = edgeMidY(parent, child);
  if (x1 === x2) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const radius = cornerRadius(Math.abs(x2 - x1), y2 - midY);
  const direction = x2 > x1 ? 1 : -1;
  const xArrive = x2 - direction * radius;
  const yAfter = midY + radius;
  return [
    `M ${x1} ${y1}`,
    `L ${x1} ${midY}`,
    `L ${xArrive} ${midY}`,
    `Q ${x2} ${midY} ${x2} ${yAfter}`,
    `L ${x2} ${y2}`,
  ].join(' ');
}

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
  const segments = buildEdgeSegments(layout, byId, activeChildIds, hasSelection);
  return (
    <svg
      className="pointer-events-none absolute top-0 left-0 overflow-visible"
      width={layout.width}
      height={layout.height}
      aria-hidden
    >
      {segments.map((segment) => (
        <path
          key={segment.key}
          d={segment.d}
          className={segment.className}
          strokeWidth={segment.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

function buildEdgeSegments(
  layout: OrgChartLayout,
  byId: Map<string, OrgChartLayoutNode>,
  activeChildIds: ReadonlySet<string>,
  hasSelection: boolean,
): Array<{ key: string; d: string } & EdgeStroke> {
  const childrenByParent = new Map<string, string[]>();
  for (const edge of layout.edges) {
    const list = childrenByParent.get(edge.fromId) ?? [];
    list.push(edge.toId);
    childrenByParent.set(edge.fromId, list);
  }
  const segments: Array<{ key: string; d: string } & EdgeStroke> = [];
  for (const [parentId, childIds] of childrenByParent) {
    const parent = byId.get(parentId);
    if (!parent) continue;
    const children = childIds
      .map((id) => byId.get(id))
      .filter((node): node is OrgChartLayoutNode => node != null);
    if (children.length === 0) continue;
    pushParentSegments(segments, parent, children, activeChildIds, hasSelection);
  }
  return segments;
}

function pushParentSegments(
  segments: Array<{ key: string; d: string } & EdgeStroke>,
  parent: OrgChartLayoutNode,
  children: OrgChartLayoutNode[],
  activeChildIds: ReadonlySet<string>,
  hasSelection: boolean,
): void {
  const midY = edgeMidY(parent, children[0]!);
  const trunkActive = children.some((child) => activeChildIds.has(child.id));
  segments.push({
    key: `trunk-${parent.id}`,
    d: trunkPath(parent, midY),
    ...strokeFor(trunkActive, hasSelection),
  });
  const idle = children.filter((child) => !activeChildIds.has(child.id));
  const active = children.filter((child) => activeChildIds.has(child.id));
  for (const child of [...idle, ...active]) {
    const x1 = nodeCenterX(parent);
    segments.push({
      key: `branch-${parent.id}-${child.id}`,
      d: branchFromTrunk(x1, midY, nodeCenterX(child), child.y),
      ...strokeFor(activeChildIds.has(child.id), hasSelection),
    });
  }
}

function strokeFor(active: boolean, hasSelection: boolean): EdgeStroke {
  if (active) {
    return { className: EDGE_ACTIVE_STROKE_CLASS, strokeWidth: EDGE_ACTIVE_STROKE_WIDTH };
  }
  return {
    className: hasSelection ? EDGE_IDLE_STROKE_CLASS : EDGE_DEFAULT_STROKE_CLASS,
    strokeWidth: EDGE_DEFAULT_STROKE_WIDTH,
  };
}
