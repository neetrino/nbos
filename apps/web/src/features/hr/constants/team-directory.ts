export const TEAM_PAGE_SIZE = 50;

export const TEAM_DEPT_ROLE_OPTIONS = [
  { value: 'HEAD', label: 'Head' },
  { value: 'DEPUTY', label: 'Deputy' },
  { value: 'MEMBER', label: 'Member' },
] as const;

export function getDeptRoleLabel(role: string): string {
  return TEAM_DEPT_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}
