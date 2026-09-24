'use client';

import { PermissionGate } from '@/lib/permissions';
import type { DepartmentItem } from '@/lib/api/employees';
import { ORG_COMPANY_NODE_ID } from './org-chart-constants';
import type { OrgChartLayout } from './org-chart-layout';
import {
  childDepartmentCount,
  orgChartDepartmentCardTitle,
  orgChartSiblingIndex,
} from './org-chart-tree';
import { OrgChartAddChildButton } from './OrgChartAddChildButton';
import { OrgChartEdges } from './OrgChartEdges';
import { OrgCompanyCard } from './OrgCompanyCard';
import { OrgDepartmentCard } from './OrgDepartmentCard';

export function OrgChartNodes({
  departments,
  layout,
  expandedIds,
  selectedId,
  myDepartmentIds,
  onSelect,
  onToggleExpanded,
  onAddChild,
  onOpenEmployee,
}: {
  departments: DepartmentItem[];
  layout: OrgChartLayout;
  expandedIds: ReadonlySet<string>;
  selectedId: string | null;
  myDepartmentIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onOpenEmployee?: (employeeId: string) => void;
}) {
  const byId = new Map(departments.map((department) => [department.id, department]));
  return (
    <>
      <OrgChartEdges layout={layout} departments={departments} selectedId={selectedId} />
      {layout.nodes.map((node) => (
        <OrgChartNodeCard
          key={node.id}
          node={node}
          department={byId.get(node.id)}
          departments={departments}
          expandedIds={expandedIds}
          selectedId={selectedId}
          myDepartmentIds={myDepartmentIds}
          onSelect={onSelect}
          onToggleExpanded={onToggleExpanded}
          onOpenEmployee={onOpenEmployee}
        />
      ))}
      {layout.nodes
        .filter((node) => node.id === ORG_COMPANY_NODE_ID || node.id === selectedId)
        .map((node) => (
          <PermissionGate key={`add-${node.id}`} module="COMPANY" action="ADD">
            <OrgChartAddChildButton
              node={node}
              onAdd={() => onAddChild(node.id === ORG_COMPANY_NODE_ID ? null : node.id)}
            />
          </PermissionGate>
        ))}
    </>
  );
}

function OrgChartNodeCard({
  node,
  department,
  departments,
  expandedIds,
  selectedId,
  myDepartmentIds,
  onSelect,
  onToggleExpanded,
  onOpenEmployee,
}: {
  node: OrgChartLayout['nodes'][number];
  department: DepartmentItem | undefined;
  departments: DepartmentItem[];
  expandedIds: ReadonlySet<string>;
  selectedId: string | null;
  myDepartmentIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onOpenEmployee?: (employeeId: string) => void;
}) {
  if (node.id === ORG_COMPANY_NODE_ID) {
    return (
      <OrgCompanyCard
        node={node}
        selected={selectedId === node.id}
        childCount={childDepartmentCount(departments, null)}
        expanded={expandedIds.has(node.id)}
        onSelect={() => onSelect(node.id)}
        onToggleChildren={() => onToggleExpanded(node.id)}
      />
    );
  }
  if (!department) return null;
  return (
    <OrgDepartmentCard
      department={department}
      node={node}
      heading={orgChartDepartmentCardTitle(
        department.name,
        orgChartSiblingIndex(departments, department.id),
      )}
      selected={selectedId === node.id}
      childCount={childDepartmentCount(departments, department.id)}
      expanded={expandedIds.has(node.id)}
      isMine={myDepartmentIds.has(department.id)}
      onSelect={() => onSelect(node.id)}
      onToggleChildren={() => onToggleExpanded(node.id)}
      onOpenEmployee={onOpenEmployee}
    />
  );
}
