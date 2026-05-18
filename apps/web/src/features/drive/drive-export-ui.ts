import type { DriveProjectHubView, ProjectDriveHubSummary } from './drive-project-hub-view';

export type DriveZipExportKind =
  | 'drive.selection_zip'
  | 'drive.project_zip'
  | 'drive.product_zip'
  | 'drive.client_zip'
  | 'drive.finance_zip'
  | 'drive.task_attachments_zip'
  | 'drive.offer_zip'
  | 'drive.meeting_zip'
  | 'drive.call_zip'
  | 'drive.partner_zip'
  | 'drive.full_backup_zip';

export type DriveTypedExportAction = {
  id: string;
  label: string;
  exportKind: DriveZipExportKind;
  exportParams: Record<string, string>;
};

const EXPORT_KIND_LABELS: Record<DriveZipExportKind, string> = {
  'drive.selection_zip': 'Selection',
  'drive.project_zip': 'Project',
  'drive.product_zip': 'Product',
  'drive.client_zip': 'Client',
  'drive.finance_zip': 'Finance',
  'drive.task_attachments_zip': 'Task attachments',
  'drive.offer_zip': 'Offers',
  'drive.meeting_zip': 'Meetings',
  'drive.call_zip': 'Calls',
  'drive.partner_zip': 'Partner',
  'drive.full_backup_zip': 'Full backup',
};

export function labelDriveZipExportKind(kind: string | undefined): string {
  if (!kind) return 'Export';
  return EXPORT_KIND_LABELS[kind as DriveZipExportKind] ?? kind.replace('drive.', '');
}

export function buildDriveTypedExportActions(ctx: {
  projectHubSummary: ProjectDriveHubSummary | null;
  projectHubView: DriveProjectHubView;
  libraryEntityScope: { scopeEntityType: string; scopeEntityId: string } | null;
}): DriveTypedExportAction[] {
  const actions: DriveTypedExportAction[] = [];
  const projectId =
    ctx.projectHubSummary?.projectId ??
    (ctx.libraryEntityScope?.scopeEntityType === 'PROJECT'
      ? ctx.libraryEntityScope.scopeEntityId
      : undefined);

  if (projectId) {
    actions.push(
      {
        id: 'project',
        label: 'Export project library',
        exportKind: 'drive.project_zip',
        exportParams: { projectId },
      },
      {
        id: 'finance',
        label: 'Export finance files',
        exportKind: 'drive.finance_zip',
        exportParams: { projectId },
      },
      {
        id: 'project-tasks',
        label: 'Export all task attachments',
        exportKind: 'drive.task_attachments_zip',
        exportParams: { projectId },
      },
      {
        id: 'offers',
        label: 'Export offers & contracts',
        exportKind: 'drive.offer_zip',
        exportParams: { projectId },
      },
      {
        id: 'meetings',
        label: 'Export meeting recordings',
        exportKind: 'drive.meeting_zip',
        exportParams: { projectId },
      },
      {
        id: 'calls',
        label: 'Export call recordings',
        exportKind: 'drive.call_zip',
        exportParams: { projectId },
      },
      {
        id: 'full-backup',
        label: 'Full project backup',
        exportKind: 'drive.full_backup_zip',
        exportParams: { projectId },
      },
    );
  }

  if (ctx.projectHubView.section === 'products' && ctx.projectHubView.focusEntityId) {
    actions.push({
      id: 'product-focus',
      label: 'Export focused product',
      exportKind: 'drive.product_zip',
      exportParams: { productId: ctx.projectHubView.focusEntityId },
    });
  }

  if (
    ctx.projectHubView.section === 'client' &&
    ctx.projectHubView.focusEntityId &&
    ctx.projectHubSummary
  ) {
    const row = ctx.projectHubSummary.client.find((c) => c.id === ctx.projectHubView.focusEntityId);
    if (row?.entityType === 'COMPANY') {
      actions.push({
        id: 'client-company',
        label: 'Export company files',
        exportKind: 'drive.client_zip',
        exportParams: { companyId: row.id },
      });
    }
    if (row?.entityType === 'CONTACT') {
      actions.push(
        {
          id: 'client-contact',
          label: 'Export contact files',
          exportKind: 'drive.client_zip',
          exportParams: { contactId: row.id },
        },
        {
          id: 'contact-calls',
          label: 'Export contact calls',
          exportKind: 'drive.call_zip',
          exportParams: { contactId: row.id },
        },
      );
    }
  }

  if (ctx.libraryEntityScope?.scopeEntityType === 'TASK') {
    actions.push({
      id: 'task-scope',
      label: 'Export task attachments',
      exportKind: 'drive.task_attachments_zip',
      exportParams: { taskId: ctx.libraryEntityScope.scopeEntityId },
    });
  }

  if (ctx.libraryEntityScope?.scopeEntityType === 'PRODUCT') {
    actions.push({
      id: 'product-scope',
      label: 'Export product library',
      exportKind: 'drive.product_zip',
      exportParams: { productId: ctx.libraryEntityScope.scopeEntityId },
    });
  }

  if (ctx.libraryEntityScope?.scopeEntityType === 'PARTNER') {
    actions.push({
      id: 'partner-scope',
      label: 'Export partner documents',
      exportKind: 'drive.partner_zip',
      exportParams: { partnerId: ctx.libraryEntityScope.scopeEntityId },
    });
  }

  if (ctx.libraryEntityScope?.scopeEntityType === 'DEAL') {
    actions.push({
      id: 'deal-offers',
      label: 'Export deal offers',
      exportKind: 'drive.offer_zip',
      exportParams: { dealId: ctx.libraryEntityScope.scopeEntityId },
    });
  }

  return [...new Map(actions.map((action) => [action.id, action])).values()];
}
