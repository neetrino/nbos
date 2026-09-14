import {
  ORG_CARD_HEIGHT_PX,
  ORG_CARD_WIDTH_PX,
  ORG_COMPANY_CARD_HEIGHT_PX,
  ORG_COMPANY_NODE_ID,
  ORG_LAYOUT_RESOLVE_MAX_PASSES,
  ORG_LEVEL_GAP_PX,
  ORG_SIBLING_GAP_PX,
} from './org-chart-constants';
import type { OrgChartTreeNode } from './org-chart-tree';

export type OrgChartLayoutNode = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OrgChartLayout = {
  nodes: OrgChartLayoutNode[];
  edges: Array<{ fromId: string; toId: string }>;
  width: number;
  height: number;
  originX: number;
};

type OrgLayoutWorkNode = OrgChartLayoutNode & {
  parentId: string | null;
  children: string[];
  depth: number;
};

function nodeHeight(id: string): number {
  return id === ORG_COMPANY_NODE_ID ? ORG_COMPANY_CARD_HEIGHT_PX : ORG_CARD_HEIGHT_PX;
}

function visibleChildren(
  node: OrgChartTreeNode,
  expandedIds: ReadonlySet<string>,
): OrgChartTreeNode[] {
  return expandedIds.has(node.id) ? node.children : [];
}

function siblingGroupWidth(count: number): number {
  if (count <= 0) return 0;
  return count * ORG_CARD_WIDTH_PX + (count - 1) * ORG_SIBLING_GAP_PX;
}

export function layoutOrgChart(
  tree: OrgChartTreeNode,
  expandedIds: ReadonlySet<string>,
): OrgChartLayout {
  const nodes = new Map<string, OrgLayoutWorkNode>();
  const edges: OrgChartLayout['edges'] = [];
  collectWorkNodes(tree, expandedIds, null, 0, nodes, edges);
  placeFromRoot(tree.id, nodes);
  resolveSameLevelOverlaps(nodes);
  return toPublicLayout(nodes, edges);
}

export function findLayoutNode(layout: OrgChartLayout, id: string): OrgChartLayoutNode | undefined {
  return layout.nodes.find((node) => node.id === id);
}

function collectWorkNodes(
  node: OrgChartTreeNode,
  expandedIds: ReadonlySet<string>,
  parentId: string | null,
  depth: number,
  nodes: Map<string, OrgLayoutWorkNode>,
  edges: OrgChartLayout['edges'],
): void {
  const children = visibleChildren(node, expandedIds);
  nodes.set(node.id, {
    id: node.id,
    parentId,
    children: children.map((child) => child.id),
    depth,
    x: 0,
    y: 0,
    width: ORG_CARD_WIDTH_PX,
    height: nodeHeight(node.id),
  });
  for (const child of children) {
    edges.push({ fromId: node.id, toId: child.id });
    collectWorkNodes(child, expandedIds, node.id, depth + 1, nodes, edges);
  }
}

function placeFromRoot(rootId: string, nodes: Map<string, OrgLayoutWorkNode>): void {
  const root = nodes.get(rootId);
  if (!root) return;
  root.x = 0;
  root.y = 0;
  placeChildren(rootId, nodes);
}

function placeChildren(parentId: string, nodes: Map<string, OrgLayoutWorkNode>): void {
  const parent = nodes.get(parentId);
  if (!parent || parent.children.length === 0) return;
  const groupWidth = siblingGroupWidth(parent.children.length);
  let childX = parent.x + parent.width / 2 - groupWidth / 2;
  const childY = parent.y + parent.height + ORG_LEVEL_GAP_PX;
  for (const childId of parent.children) {
    const child = nodes.get(childId);
    if (!child) continue;
    child.x = childX;
    child.y = childY;
    childX += ORG_CARD_WIDTH_PX + ORG_SIBLING_GAP_PX;
    placeChildren(childId, nodes);
  }
}

function resolveSameLevelOverlaps(nodes: Map<string, OrgLayoutWorkNode>): void {
  const maxDepth = Math.max(0, ...[...nodes.values()].map((node) => node.depth));
  for (let pass = 0; pass < ORG_LAYOUT_RESOLVE_MAX_PASSES; pass += 1) {
    if (!shiftOneOverlap(nodes, maxDepth)) return;
  }
}

function shiftOneOverlap(nodes: Map<string, OrgLayoutWorkNode>, maxDepth: number): boolean {
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const row = nodesAtDepth(nodes, depth);
    for (let index = 0; index < row.length - 1; index += 1) {
      const left = row[index];
      const right = row[index + 1];
      if (!left || !right) continue;
      const minRightX = left.x + left.width + ORG_SIBLING_GAP_PX;
      if (right.x >= minRightX) continue;
      shiftSubtree(overlapMoverId(left, right), minRightX - right.x, nodes);
      return true;
    }
  }
  return false;
}

function nodesAtDepth(nodes: Map<string, OrgLayoutWorkNode>, depth: number): OrgLayoutWorkNode[] {
  return [...nodes.values()]
    .filter((node) => node.depth === depth)
    .sort((left, right) => compareRowNodes(left, right, nodes));
}

function compareRowNodes(
  left: OrgLayoutWorkNode,
  right: OrgLayoutWorkNode,
  nodes: Map<string, OrgLayoutWorkNode>,
): number {
  if (left.x !== right.x) return left.x - right.x;
  const leftParentX = left.parentId ? (nodes.get(left.parentId)?.x ?? 0) : Number.NEGATIVE_INFINITY;
  const rightParentX = right.parentId
    ? (nodes.get(right.parentId)?.x ?? 0)
    : Number.NEGATIVE_INFINITY;
  if (leftParentX !== rightParentX) return leftParentX - rightParentX;
  return left.id.localeCompare(right.id);
}

function overlapMoverId(left: OrgLayoutWorkNode, right: OrgLayoutWorkNode): string {
  if (left.parentId === right.parentId) return right.id;
  return right.parentId ?? right.id;
}

function shiftSubtree(id: string, delta: number, nodes: Map<string, OrgLayoutWorkNode>): void {
  const stack = [id];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || seen.has(currentId)) continue;
    seen.add(currentId);
    const current = nodes.get(currentId);
    if (!current) continue;
    current.x += delta;
    stack.push(...current.children);
  }
}

function toPublicLayout(
  nodes: Map<string, OrgLayoutWorkNode>,
  edges: OrgChartLayout['edges'],
): OrgChartLayout {
  const placed = [...nodes.values()];
  const originX = placed.reduce((min, node) => Math.min(min, node.x), Number.POSITIVE_INFINITY);
  const shift = Number.isFinite(originX) ? originX : 0;
  let width = 0;
  let height = 0;
  const publicNodes: OrgChartLayoutNode[] = placed.map((node) => {
    const x = node.x - shift;
    width = Math.max(width, x + node.width);
    height = Math.max(height, node.y + node.height);
    return { id: node.id, x, y: node.y, width: node.width, height: node.height };
  });
  return { nodes: publicNodes, edges, width, height, originX: shift };
}
