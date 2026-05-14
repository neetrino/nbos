/** Query param: open Drive Library → Projects with this project pre-selected for uploads. */
export const DRIVE_DEEP_LINK_PROJECT_ID_QUERY = 'projectId';

export function buildDriveHrefWithProject(projectId: string): string {
  const p = new URLSearchParams();
  p.set(DRIVE_DEEP_LINK_PROJECT_ID_QUERY, projectId);
  return `/drive?${p.toString()}`;
}
