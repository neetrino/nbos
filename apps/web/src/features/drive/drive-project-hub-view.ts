export type DriveProjectHubSection = 'folders' | 'deals' | 'products' | 'tasks' | 'finance';

export type DriveProjectHubView = {
  section: DriveProjectHubSection;
  /** Selected row within deals / products / tasks / finance. */
  focusEntityId?: string;
};

export const DRIVE_PROJECT_HUB_DEFAULT_VIEW: DriveProjectHubView = {
  section: 'folders',
};

export type ProjectDriveHubSummary = {
  projectId: string;
  projectCode: string;
  projectName: string;
  deals: ProjectHubEntityRow[];
  products: ProjectHubEntityRow[];
  tasks: ProjectHubEntityRow[];
  invoices: ProjectHubEntityRow[];
};

export type ProjectHubEntityRow = {
  id: string;
  label: string;
  fileCount: number;
};

export function isProjectHubFileBrowse(view: DriveProjectHubView): boolean {
  return view.section !== 'folders';
}

export function resolveProjectHubFileListParams(
  projectId: string,
  view: DriveProjectHubView,
  base: {
    status?: string;
    purpose?: string;
    search?: string;
    sharedWithMe?: boolean;
  },
): {
  entityType?: string;
  entityId?: string;
  status?: string;
  purpose?: string;
  search?: string;
  sharedWithMe?: boolean;
} {
  if (view.section === 'deals' && view.focusEntityId) {
    return { ...base, entityType: 'DEAL', entityId: view.focusEntityId };
  }
  if (view.section === 'products' && view.focusEntityId) {
    return { ...base, entityType: 'PRODUCT', entityId: view.focusEntityId };
  }
  if (view.section === 'tasks' && view.focusEntityId) {
    return { ...base, entityType: 'TASK', entityId: view.focusEntityId };
  }
  if (view.section === 'finance' && view.focusEntityId) {
    return { ...base, entityType: 'INVOICE', entityId: view.focusEntityId };
  }
  return base;
}

export function projectHubSectionNeedsFocus(section: DriveProjectHubSection): boolean {
  return (
    section === 'deals' || section === 'products' || section === 'tasks' || section === 'finance'
  );
}

/** Label for the focused row in deals / products / tasks / finance. */
export function resolveProjectHubFocusLabel(
  summary: ProjectDriveHubSummary,
  view: DriveProjectHubView,
): string | null {
  if (!view.focusEntityId) return null;
  const rows =
    view.section === 'deals'
      ? summary.deals
      : view.section === 'products'
        ? summary.products
        : view.section === 'tasks'
          ? summary.tasks
          : view.section === 'finance'
            ? summary.invoices
            : [];
  return rows.find((row) => row.id === view.focusEntityId)?.label ?? null;
}
