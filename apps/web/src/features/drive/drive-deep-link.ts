/**
 * Open Drive → Shared with me and focus this file (matches notification links from the API).
 * Keep in sync with `DRIVE_OPEN_FILE_QUERY` in `apps/api/src/modules/drive/drive-grant-notify.ops.ts`.
 */
export const DRIVE_DEEP_LINK_OPEN_FILE_ID_QUERY = 'driveOpenFileId';

/** Query param: open Drive Library → Projects with this project pre-selected for uploads. */
export const DRIVE_DEEP_LINK_PROJECT_ID_QUERY = 'projectId';

/** Open Drive Library → Products with this product pre-selected. */
export const DRIVE_DEEP_LINK_PRODUCT_ID_QUERY = 'driveProductId';

/** Open Drive Library → Tasks with this task pre-selected. */
export const DRIVE_DEEP_LINK_TASK_ID_QUERY = 'driveTaskId';

/** Open Drive Library → Tasks & Work Spaces with this work space pre-selected. */
export const DRIVE_DEEP_LINK_WORKSPACE_ID_QUERY = 'driveWorkSpaceId';

/** Open Drive Library → Finance scoped to this project (project-linked finance files). */
export const DRIVE_DEEP_LINK_FINANCE_PROJECT_ID_QUERY = 'driveFinanceProjectId';

export function buildDriveHrefOpenSharedFile(fileAssetId: string): string {
  const p = new URLSearchParams();
  p.set(DRIVE_DEEP_LINK_OPEN_FILE_ID_QUERY, fileAssetId);
  return `/drive?${p.toString()}`;
}

export function buildDriveHrefWithProject(projectId: string): string {
  const p = new URLSearchParams();
  p.set(DRIVE_DEEP_LINK_PROJECT_ID_QUERY, projectId);
  return `/drive?${p.toString()}`;
}

export function buildDriveHrefWithProduct(productId: string): string {
  const p = new URLSearchParams();
  p.set(DRIVE_DEEP_LINK_PRODUCT_ID_QUERY, productId);
  return `/drive?${p.toString()}`;
}

export function buildDriveHrefWithTask(taskId: string): string {
  const p = new URLSearchParams();
  p.set(DRIVE_DEEP_LINK_TASK_ID_QUERY, taskId);
  return `/drive?${p.toString()}`;
}

export function buildDriveHrefWithWorkSpace(workSpaceId: string): string {
  const p = new URLSearchParams();
  p.set(DRIVE_DEEP_LINK_WORKSPACE_ID_QUERY, workSpaceId);
  return `/drive?${p.toString()}`;
}

export function buildDriveHrefWithFinanceProject(projectId: string): string {
  const p = new URLSearchParams();
  p.set(DRIVE_DEEP_LINK_FINANCE_PROJECT_ID_QUERY, projectId);
  return `/drive?${p.toString()}`;
}
