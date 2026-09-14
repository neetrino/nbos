import type { DepartmentItem, DepartmentMember, Employee } from '@/lib/api/employees';
import { ORG_DEPT_ROLE_DEPUTY, ORG_DEPT_ROLE_HEAD } from './org-chart-constants';

export type OrgChartMemberGroups = {
  heads: DepartmentMember[];
  deputies: DepartmentMember[];
  members: DepartmentMember[];
};

export function splitOrgChartMembers(members: DepartmentMember[]): OrgChartMemberGroups {
  const heads: DepartmentMember[] = [];
  const deputies: DepartmentMember[] = [];
  const rest: DepartmentMember[] = [];
  for (const member of members) {
    if (member.deptRole === ORG_DEPT_ROLE_HEAD) {
      heads.push(member);
      continue;
    }
    if (member.deptRole === ORG_DEPT_ROLE_DEPUTY) {
      deputies.push(member);
      continue;
    }
    rest.push(member);
  }
  return { heads, deputies, members: rest };
}

export function orgChartSubordinateCount(memberCount: number, leadershipCount: number): number {
  return Math.max(0, memberCount - leadershipCount);
}

export function departmentMatchesOrgChartQuery(department: DepartmentItem, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (department.name.toLowerCase().includes(needle)) return true;
  if (department.slug.toLowerCase().includes(needle)) return true;
  const people = department.members ?? [];
  return people.some((member) => {
    const fullName = `${member.employee.firstName} ${member.employee.lastName}`.toLowerCase();
    const position = (member.employee.position ?? '').toLowerCase();
    const roleName = (member.employee.role?.name ?? '').toLowerCase();
    return fullName.includes(needle) || position.includes(needle) || roleName.includes(needle);
  });
}

export function firstMatchingDepartmentId(
  departments: DepartmentItem[],
  query: string,
): string | null {
  const match = departments.find((department) => departmentMatchesOrgChartQuery(department, query));
  return match?.id ?? null;
}

export function toOrgChartCardEmployee(
  employee: DepartmentMember['employee'],
): DepartmentMember['employee'] {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    avatar: employee.avatar ?? null,
    position: employee.position ?? null,
    role: employee.role
      ? {
          id: employee.role.id,
          name: employee.role.name,
          slug: employee.role.slug,
          level: employee.role.level,
        }
      : undefined,
  };
}

export function toOrgChartCardMembers(members: DepartmentMember[]): DepartmentMember[] {
  const cards: DepartmentMember[] = [];
  for (const member of members) {
    if (!member.employee) continue;
    cards.push({ ...member, employee: toOrgChartCardEmployee(member.employee) });
  }
  return cards;
}

export function mergeDepartmentCardPreview(
  department: DepartmentItem,
  detail: Pick<DepartmentItem, 'members' | '_count'> | unknown,
): DepartmentItem {
  const detailMembers = membersFromDepartmentDetail(detail);
  return {
    ...department,
    members: toOrgChartCardMembers(detailMembers),
    _count: department._count ?? countFromDepartmentDetail(detail, detailMembers.length),
  };
}

function membersFromDepartmentDetail(detail: unknown): DepartmentMember[] {
  if (!detail || typeof detail !== 'object') return [];
  const record = detail as { members?: unknown; data?: { members?: unknown } };
  if (Array.isArray(record.members)) return record.members as DepartmentMember[];
  if (Array.isArray(record.data?.members)) return record.data.members as DepartmentMember[];
  return [];
}

function countFromDepartmentDetail(detail: unknown, fallback: number): DepartmentItem['_count'] {
  if (!detail || typeof detail !== 'object') return { members: fallback };
  const record = detail as {
    _count?: { members?: number };
    data?: { _count?: { members?: number } };
  };
  const count = record._count?.members ?? record.data?._count?.members;
  return { members: count ?? fallback };
}

export function attachEmployeesToDepartments(
  departments: DepartmentItem[],
  employees: Employee[],
): DepartmentItem[] {
  const byDepartment = new Map<string, DepartmentMember[]>();
  for (const employee of employees) {
    for (const row of employee.departments ?? []) {
      const members = byDepartment.get(row.departmentId) ?? [];
      members.push({
        id: row.id,
        employeeId: employee.id,
        departmentId: row.departmentId,
        deptRole: row.deptRole,
        isPrimary: row.isPrimary,
        employee: toOrgChartCardEmployee(employee),
      });
      byDepartment.set(row.departmentId, members);
    }
  }
  return departments.map((department) => {
    const members = byDepartment.get(department.id);
    if (!members?.length) return department;
    return { ...department, members };
  });
}

export function departmentsNeedCardHydration(departments: DepartmentItem[]): boolean {
  return departments.some((department) => {
    const preview = department.members?.length ?? 0;
    if (department.parentId === null && preview === 0) return true;
    const count = department._count?.members ?? 0;
    return count > 0 && preview === 0;
  });
}

export type OrgChartCardPeople = {
  cover: DepartmentMember | undefined;
  listed: DepartmentMember[];
  listedKind: 'deputies' | 'members';
};

export function orgChartCardPeople(members: DepartmentMember[]): OrgChartCardPeople {
  const groups = splitOrgChartMembers(members);
  const cover = groups.heads[0];
  const coverId = cover?.id;
  const deputies = groups.deputies.filter((member) => member.id !== coverId);
  if (deputies.length > 0) {
    return { cover, listed: deputies, listedKind: 'deputies' };
  }
  return {
    cover,
    listed: groups.members.filter((member) => member.id !== coverId),
    listedKind: 'members',
  };
}
