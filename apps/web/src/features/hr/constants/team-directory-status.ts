export const TEAM_DIRECTORY_STATUS_EVERYONE = 'EVERYONE';
export const EMPLOYEE_STATUS_TERMINATED = 'TERMINATED';

export interface TeamDirectoryStatusQuery {
  status?: string;
  excludeStatus?: typeof EMPLOYEE_STATUS_TERMINATED;
}

/** Default directory scope is every status except terminated. */
export function resolveTeamDirectoryStatusQuery(input: {
  quickStatus: string | null;
  filterStatus?: string;
  showTerminated: boolean;
}): TeamDirectoryStatusQuery {
  if (input.quickStatus) return { status: input.quickStatus };
  if (input.filterStatus === TEAM_DIRECTORY_STATUS_EVERYONE) return {};
  if (input.filterStatus && input.filterStatus !== 'all') {
    return { status: input.filterStatus };
  }
  if (input.showTerminated) return { status: EMPLOYEE_STATUS_TERMINATED };
  return { excludeStatus: EMPLOYEE_STATUS_TERMINATED };
}

export function isDefaultTeamDirectoryScope(input: {
  quickStatus: string | null;
  filterStatus?: string;
  showTerminated: boolean;
}): boolean {
  return (
    !input.quickStatus &&
    !input.showTerminated &&
    (!input.filterStatus || input.filterStatus === 'all')
  );
}
