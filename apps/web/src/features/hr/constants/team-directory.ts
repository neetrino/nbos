export const TEAM_PAGE_SIZE = 50;

export const TEAM_DEPT_ROLE_OPTIONS = [
  { value: 'HEAD', label: 'Head' },
  { value: 'DEPUTY', label: 'Deputy' },
  { value: 'MEMBER', label: 'Member' },
] as const;

/** Team grid — denser columns; scales up on wider viewports. */
const TEAM_DIRECTORY_CARD_GRID_BASE_CLASS =
  'grid w-full min-w-0 gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

/**
 * 5 cards per row when sidebar is open; 6 when collapsed.
 * Extra columns on `2xl` screens.
 */
export function teamDirectoryCardGridClass(sidebarCollapsed: boolean): string {
  return [
    TEAM_DIRECTORY_CARD_GRID_BASE_CLASS,
    sidebarCollapsed ? 'xl:grid-cols-6 2xl:grid-cols-7' : 'xl:grid-cols-5 2xl:grid-cols-6',
  ].join(' ');
}

export function getDeptRoleLabel(role: string): string {
  return TEAM_DEPT_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}
