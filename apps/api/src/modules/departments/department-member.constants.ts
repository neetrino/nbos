export const DEPARTMENT_ROLE_HEAD = 'HEAD';
export const DEPARTMENT_ROLE_DEPUTY = 'DEPUTY';
export const DEPARTMENT_ROLE_MEMBER = 'MEMBER';

export const DEPARTMENT_LEADERSHIP_ROLES = [DEPARTMENT_ROLE_HEAD, DEPARTMENT_ROLE_DEPUTY] as const;

export const DEPARTMENT_MEMBER_EMPLOYEE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  position: true,
  role: { select: { id: true, name: true, slug: true, level: true } },
} as const;

export function departmentLeadershipRank(deptRole: string): number {
  if (deptRole === DEPARTMENT_ROLE_HEAD) return 0;
  if (deptRole === DEPARTMENT_ROLE_DEPUTY) return 1;
  return 2;
}

export function sortDepartmentLeadership<T extends { deptRole: string }>(members: T[]): T[] {
  return [...members].sort(
    (left, right) =>
      departmentLeadershipRank(left.deptRole) - departmentLeadershipRank(right.deptRole),
  );
}
