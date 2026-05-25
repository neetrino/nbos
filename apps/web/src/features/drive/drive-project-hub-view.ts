export type DriveProjectHubSection =
  | 'folders'
  | 'deals'
  | 'products'
  | 'client'
  | 'tasks'
  | 'finance';

export type DriveProjectHubView = {
  section: DriveProjectHubSection;
  /** Selected row within deals / products / client / tasks / finance. */
  focusEntityId?: string;
  /** When set in products section, lists files for this extension instead of the product. */
  focusExtensionId?: string;
};

export const DRIVE_PROJECT_HUB_DEFAULT_VIEW: DriveProjectHubView = {
  section: 'folders',
};

export type ProjectHubEntityRow = {
  id: string;
  label: string;
  fileCount: number;
};

export type ProjectHubClientRow = ProjectHubEntityRow & {
  entityType: 'COMPANY' | 'CONTACT';
};

export type ProjectHubProductRow = ProjectHubEntityRow & {
  extensions: ProjectHubEntityRow[];
};

export type ProjectDriveHubSummary = {
  projectId: string;
  projectCode: string;
  projectName: string;
  deals: ProjectHubEntityRow[];
  products: ProjectHubProductRow[];
  client: ProjectHubClientRow[];
  tasks: ProjectHubEntityRow[];
  invoices: ProjectHubEntityRow[];
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
  summary?: ProjectDriveHubSummary | null,
): {
  entityType?: string;
  entityId?: string;
  status?: string;
  purpose?: string;
  search?: string;
  sharedWithMe?: boolean;
} {
  void projectId;
  if (view.section === 'deals' && view.focusEntityId) {
    return { ...base, entityType: 'DEAL', entityId: view.focusEntityId };
  }
  if (view.section === 'products' && view.focusExtensionId) {
    return { ...base, entityType: 'EXTENSION', entityId: view.focusExtensionId };
  }
  if (view.section === 'products' && view.focusEntityId) {
    return { ...base, entityType: 'PRODUCT', entityId: view.focusEntityId };
  }
  if (view.section === 'client' && view.focusEntityId && summary) {
    const row = summary.client.find((c) => c.id === view.focusEntityId);
    if (row) return { ...base, entityType: row.entityType, entityId: row.id };
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
    section === 'deals' ||
    section === 'products' ||
    section === 'client' ||
    section === 'tasks' ||
    section === 'finance'
  );
}

export function resolveProjectHubFocusLabel(
  summary: ProjectDriveHubSummary,
  view: DriveProjectHubView,
): string | null {
  if (view.section === 'products' && view.focusExtensionId && view.focusEntityId) {
    const product = summary.products.find((p) => p.id === view.focusEntityId);
    const extension = product?.extensions.find((e) => e.id === view.focusExtensionId);
    if (extension) {
      const productLabel = product?.label ?? 'Product';
      return `${productLabel} · ${extension.label}`;
    }
  }
  if (!view.focusEntityId) return null;
  const rows = hubFocusRows(summary, view.section);
  return rows.find((row) => row.id === view.focusEntityId)?.label ?? null;
}

function hubFocusRows(
  summary: ProjectDriveHubSummary,
  section: DriveProjectHubSection,
): ProjectHubEntityRow[] {
  if (section === 'deals') return summary.deals;
  if (section === 'products') return summary.products;
  if (section === 'client') return summary.client;
  if (section === 'tasks') return summary.tasks;
  if (section === 'finance') return summary.invoices;
  return [];
}

export function productHubExtensions(
  summary: ProjectDriveHubSummary,
  productId: string | undefined,
): ProjectHubEntityRow[] {
  if (!productId) return [];
  return summary.products.find((p) => p.id === productId)?.extensions ?? [];
}
