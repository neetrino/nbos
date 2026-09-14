import { describe, expect, it } from 'vitest';
import type { DepartmentItem } from '@/lib/api/employees';
import { ORG_CARD_WIDTH_PX, ORG_COMPANY_NODE_ID } from './org-chart-constants';
import { findLayoutNode, layoutOrgChart } from './org-chart-layout';
import {
  ancestorDepartmentIds,
  buildOrgChartTree,
  childDepartmentCount,
  orgChartDefaultExpandedIds,
  orgChartDepartmentCardTitle,
  orgChartSiblingIndex,
} from './org-chart-tree';
import {
  centerOrgChartNode,
  clampOrgChartScale,
  fitOrgChartInViewport,
  hasOrgChartViewportSize,
  zoomOrgChartAt,
} from './org-chart-viewport';
import {
  departmentMatchesOrgChartQuery,
  mergeDepartmentCardPreview,
  orgChartCardPeople,
  splitOrgChartMembers,
} from './org-chart-members';
import { ORG_ZOOM_MAX, ORG_ZOOM_MIN } from './org-chart-constants';
import type { DepartmentMember } from '@/lib/api/employees';

function dept(id: string, parentId: string | null, sortOrder = 0, name = id): DepartmentItem {
  return {
    id,
    name,
    slug: id,
    description: null,
    parentId,
    sortOrder,
  };
}

function member(
  role: string,
  firstName: string,
  extras: Partial<DepartmentMember> & {
    isPrimary?: boolean;
    employee?: DepartmentMember['employee'];
  } = {},
): DepartmentMember {
  return {
    id: extras.id ?? `${role}-${firstName}`,
    employeeId: extras.employeeId ?? firstName,
    departmentId: extras.departmentId ?? 'sales',
    deptRole: role,
    isPrimary: extras.isPrimary ?? true,
    employee: extras.employee ?? { id: firstName, firstName, lastName: 'Test' },
  };
}

describe('org chart tree', () => {
  it('attaches root departments to the company node and keeps sort order', () => {
    const tree = buildOrgChartTree([dept('b', null, 2, 'B'), dept('a', null, 1, 'A')]);
    expect(tree.id).toBe(ORG_COMPANY_NODE_ID);
    expect(tree.children.map((child) => child.id)).toEqual(['a', 'b']);
  });

  it('walks ancestors through the canonical company department', () => {
    const departments = [dept('sales', null), dept('inside', 'sales')];
    expect(ancestorDepartmentIds(departments, 'inside')).toEqual(['sales']);
    expect(childDepartmentCount(departments, 'sales')).toBe(1);
  });

  it('expands the canonical company department only', () => {
    const departments = [dept('sales', null), dept('inside', 'sales')];
    expect([...orgChartDefaultExpandedIds(departments)]).toEqual(['sales']);
  });

  it('numbers sibling departments like Bitrix titles', () => {
    const departments = [
      dept('exec', null, 1, 'Executive'),
      dept('support', null, 5, 'Support'),
      dept('hr', null, 6, 'HR & Training'),
    ];
    expect(orgChartSiblingIndex(departments, 'exec')).toBe(1);
    expect(orgChartSiblingIndex(departments, 'support')).toBe(2);
    expect(orgChartSiblingIndex(departments, 'hr')).toBe(3);
    expect(orgChartDepartmentCardTitle('HR & Training', 6)).toBe('6. HR & Training');
  });
});

describe('org chart layout', () => {
  it('hides collapsed children and centers the parent over visible siblings', () => {
    const tree = buildOrgChartTree([
      dept('sales', null, 0, 'Sales'),
      dept('academy', 'sales', 0, 'Academy'),
    ]);
    const collapsed = layoutOrgChart(tree, new Set());
    expect(collapsed.nodes.map((node) => node.id)).toEqual(['sales']);
    const expanded = layoutOrgChart(tree, new Set(['sales']));
    expect(expanded.nodes.map((node) => node.id)).toEqual(['sales', 'academy']);
    const sales = expanded.nodes.find((node) => node.id === 'sales');
    const academy = expanded.nodes.find((node) => node.id === 'academy');
    expect(sales?.width).toBe(ORG_CARD_WIDTH_PX);
    expect(academy?.y).toBeGreaterThan(sales?.y ?? 0);
    expect(academy?.x).toBe(sales?.x);
  });

  it('keeps uncle cards still when a sibling subtree fits underneath', () => {
    const tree = buildOrgChartTree([
      dept('sales', null, 0, 'Sales'),
      dept('hr', null, 1, 'HR'),
      dept('academy', 'hr', 0, 'Academy'),
      dept('quality', 'hr', 1, 'Quality'),
    ]);
    const collapsed = layoutOrgChart(tree, new Set([ORG_COMPANY_NODE_ID]));
    const expanded = layoutOrgChart(tree, new Set([ORG_COMPANY_NODE_ID, 'hr']));
    expect(findLayoutNode(collapsed, 'sales')?.x).toBe(findLayoutNode(expanded, 'sales')?.x);
    expect(findLayoutNode(collapsed, 'hr')?.x).toBe(findLayoutNode(expanded, 'hr')?.x);
    expect(findLayoutNode(expanded, 'academy')?.y).toBeGreaterThan(
      findLayoutNode(expanded, 'hr')?.y ?? 0,
    );
  });

  it('shifts parent cards only when cousin groups overlap', () => {
    const tree = buildOrgChartTree([
      dept('sales', null, 0, 'Sales'),
      dept('hr', null, 1, 'HR'),
      dept('s1', 'sales', 0, 'S1'),
      dept('s2', 'sales', 1, 'S2'),
      dept('h1', 'hr', 0, 'H1'),
      dept('h2', 'hr', 1, 'H2'),
    ]);
    const collapsed = layoutOrgChart(tree, new Set([ORG_COMPANY_NODE_ID]));
    const expanded = layoutOrgChart(tree, new Set([ORG_COMPANY_NODE_ID, 'sales', 'hr']));
    const collapsedGap =
      (findLayoutNode(collapsed, 'hr')?.x ?? 0) - (findLayoutNode(collapsed, 'sales')?.x ?? 0);
    const expandedGap =
      (findLayoutNode(expanded, 'hr')?.x ?? 0) - (findLayoutNode(expanded, 'sales')?.x ?? 0);
    expect(expandedGap).toBeGreaterThan(collapsedGap);
    expect(findLayoutNode(expanded, 'sales')?.x ?? 0).toBeLessThan(
      findLayoutNode(expanded, 'hr')?.x ?? 0,
    );
  });
});

describe('org chart viewport', () => {
  it('clamps scale and keeps the cursor world point stable while zooming', () => {
    expect(clampOrgChartScale(0.01)).toBe(ORG_ZOOM_MIN);
    expect(clampOrgChartScale(9)).toBe(ORG_ZOOM_MAX);
    const zoomed = zoomOrgChartAt({ scale: 1, tx: 0, ty: 0 }, 2, 100, 50);
    expect(zoomed.scale).toBe(ORG_ZOOM_MAX);
    expect(zoomed.tx).toBeCloseTo(100 - (100 / 1) * ORG_ZOOM_MAX);
  });

  it('fits content horizontally and centers a node in the viewport', () => {
    expect(hasOrgChartViewportSize({ width: 800, height: 0 })).toBe(false);
    expect(
      fitOrgChartInViewport({
        contentWidth: 2000,
        contentHeight: 400,
        viewportWidth: 800,
        viewportHeight: 0,
      }),
    ).toEqual({ scale: 1, tx: 0, ty: 0 });
    const fitted = fitOrgChartInViewport({
      contentWidth: 2000,
      contentHeight: 400,
      viewportWidth: 800,
      viewportHeight: 600,
    });
    expect(fitted.scale).toBeLessThan(1);
    const centered = centerOrgChartNode({
      node: { id: 'sales', x: 100, y: 80, width: 200, height: 100 },
      scale: 1,
      viewportWidth: 800,
      viewportHeight: 600,
    });
    expect(centered.tx).toBe(800 / 2 - 200);
    expect(centered.ty).toBe(600 / 2 - 130);
  });
});

describe('org chart members', () => {
  it('splits leadership and matches search against people on the card', () => {
    const groups = splitOrgChartMembers([
      member('MEMBER', 'Alen'),
      member('HEAD', 'Jasmine'),
      member('DEPUTY', 'Edgar'),
    ]);
    expect(groups.heads[0]?.employee.firstName).toBe('Jasmine');
    expect(groups.deputies).toHaveLength(1);
    expect(groups.members).toHaveLength(1);
    expect(
      departmentMatchesOrgChartQuery(
        { ...dept('sales', null, 0, 'Sales'), members: [member('DEPUTY', 'Edgar')] },
        'edg',
      ),
    ).toBe(true);
  });

  it('does not infer a department head from title, role level, or primary membership', () => {
    const preview = mergeDepartmentCardPreview(
      { ...dept('hr', null, 0, 'HR'), _count: { members: 3 } },
      {
        members: [
          member('MEMBER', 'Jasmine', {
            isPrimary: false,
            employee: {
              id: 'Jasmine',
              firstName: 'Jasmine',
              lastName: 'Ghazarian',
              avatar: '/jasmine.png',
              position: 'Co-Founders & CEO',
              role: { id: 'ceo', name: 'CEO', slug: 'ceo', level: 2 },
            },
          }),
          member('MEMBER', 'Edgar', {
            isPrimary: true,
            employee: {
              id: 'Edgar',
              firstName: 'Edgar',
              lastName: 'Khachatryan',
              position: 'Head of Marketing',
              role: { id: 'mkt', name: 'Head of Marketing', slug: 'head-marketing', level: 3 },
            },
          }),
          member('MEMBER', 'Alen', { isPrimary: false }),
        ],
      },
    );
    const people = orgChartCardPeople(preview.members ?? []);
    expect(people.cover).toBeUndefined();
    expect(people.listedKind).toBe('members');
    expect(people.listed.map((item) => item.employee.firstName)).toEqual([
      'Jasmine',
      'Edgar',
      'Alen',
    ]);
    expect(preview._count?.members).toBe(3);
  });

  it('leaves the head slot empty when several primary peers share a department', () => {
    const people = orgChartCardPeople([
      member('MEMBER', 'Alen', { isPrimary: true }),
      member('MEMBER', 'Marianna', { isPrimary: true }),
    ]);
    expect(people.cover).toBeUndefined();
    expect(people.listed.map((item) => item.employee.firstName)).toEqual(['Alen', 'Marianna']);
  });
});
