/** Query param: open Drive Library → Projects with this project pre-selected for uploads. */
export const DRIVE_DEEP_LINK_PROJECT_ID_QUERY = 'projectId';

/** Open Drive Library → Products with this product pre-selected. */
export const DRIVE_DEEP_LINK_PRODUCT_ID_QUERY = 'driveProductId';

/** Open Drive Library → Tasks with this task pre-selected. */
export const DRIVE_DEEP_LINK_TASK_ID_QUERY = 'driveTaskId';

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
