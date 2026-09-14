import type { DepartmentItem } from '@/lib/api/employees';
import { ORG_COMPANY_NODE_ID } from './org-chart-constants';

export type OrgChartTreeNode = {
  id: string;
  children: OrgChartTreeNode[];
};

function compareDepartments(left: DepartmentItem, right: DepartmentItem): number {
  if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
  return left.name.localeCompare(right.name);
}

export function groupDepartmentsByParent(
  departments: DepartmentItem[],
): Map<string | null, DepartmentItem[]> {
  const grouped = new Map<string | null, DepartmentItem[]>();
  for (const department of departments) {
    const key = department.parentId;
    const siblings = grouped.get(key) ?? [];
    siblings.push(department);
    grouped.set(key, siblings);
  }
  for (const siblings of grouped.values()) {
    siblings.sort(compareDepartments);
  }
  return grouped;
}

function toTreeNode(
  department: DepartmentItem,
  grouped: Map<string | null, DepartmentItem[]>,
): OrgChartTreeNode {
  const children = grouped.get(department.id) ?? [];
  return { id: department.id, children: children.map((child) => toTreeNode(child, grouped)) };
}

/** Use the canonical single company department as root; virtual root is legacy fallback only. */
export function buildOrgChartTree(departments: DepartmentItem[]): OrgChartTreeNode {
  const grouped = groupDepartmentsByParent(departments);
  const roots = grouped.get(null) ?? [];
  if (roots.length === 1) return toTreeNode(roots[0]!, grouped);
  return { id: ORG_COMPANY_NODE_ID, children: roots.map((root) => toTreeNode(root, grouped)) };
}

export function childDepartmentCount(
  departments: DepartmentItem[],
  parentId: string | null,
): number {
  return departments.filter((department) => department.parentId === parentId).length;
}

/** 1-based index among siblings, Bitrix-style (`6. HR & Training`). */
export function orgChartSiblingIndex(
  departments: readonly DepartmentItem[],
  departmentId: string,
): number {
  const current = departments.find((item) => item.id === departmentId);
  if (!current) return 0;
  const siblings = departments
    .filter((item) => item.parentId === current.parentId)
    .sort(compareDepartments);
  return siblings.findIndex((item) => item.id === departmentId) + 1;
}

export function orgChartDepartmentCardTitle(name: string, siblingIndex: number): string {
  if (siblingIndex < 1) return name;
  return `${siblingIndex}. ${name}`;
}

export function ancestorDepartmentIds(
  departments: DepartmentItem[],
  departmentId: string,
): string[] {
  const byId = new Map(departments.map((department) => [department.id, department]));
  const rootCount = departments.filter((department) => department.parentId === null).length;
  const ancestors: string[] = rootCount === 1 ? [] : [ORG_COMPANY_NODE_ID];
  let current = byId.get(departmentId);
  const guard = new Set<string>();
  while (current?.parentId && !guard.has(current.parentId)) {
    guard.add(current.parentId);
    ancestors.push(current.parentId);
    current = byId.get(current.parentId);
  }
  return ancestors;
}

/** Expand the canonical company root; nested rows stay collapsed like Bitrix. */
export function orgChartDefaultExpandedIds(departments: DepartmentItem[]): Set<string> {
  const roots = departments.filter((department) => department.parentId === null);
  const ids = new Set<string>(roots.length === 1 ? [] : [ORG_COMPANY_NODE_ID]);
  for (const department of roots) ids.add(department.id);
  return ids;
}
