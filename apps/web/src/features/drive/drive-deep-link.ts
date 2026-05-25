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

/** Open Drive Library → Clients with this company pre-selected. */
export const DRIVE_DEEP_LINK_COMPANY_ID_QUERY = 'driveCompanyId';

/** Open Drive Library → Clients with this contact pre-selected. */
export const DRIVE_DEEP_LINK_CONTACT_ID_QUERY = 'driveContactId';

/** Open Drive Library → Deals with this deal pre-selected. */
export const DRIVE_DEEP_LINK_DEAL_ID_QUERY = 'driveDealId';

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

export function buildDriveHrefWithCompany(companyId: string): string {
  const p = new URLSearchParams();
  p.set(DRIVE_DEEP_LINK_COMPANY_ID_QUERY, companyId);
  return `/drive?${p.toString()}`;
}

export function buildDriveHrefWithContact(contactId: string): string {
  const p = new URLSearchParams();
  p.set(DRIVE_DEEP_LINK_CONTACT_ID_QUERY, contactId);
  return `/drive?${p.toString()}`;
}

export function buildDriveHrefWithDeal(dealId: string): string {
  const p = new URLSearchParams();
  p.set(DRIVE_DEEP_LINK_DEAL_ID_QUERY, dealId);
  return `/drive?${p.toString()}`;
}
