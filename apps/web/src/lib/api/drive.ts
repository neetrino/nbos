import { api } from '../api';

export interface FileAsset {
  id: string;
  displayName: string;
  originalName: string | null;
  fileType: string;
  purpose: string | null;
  sourceModule: string | null;
  status: string;
  visibility: string;
  confidentiality: string;
  storageProvider: string;
  storageKey: string | null;
  externalUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | string | null;
  checksum: string | null;
  createdAt: string;
  updatedAt: string;
  versions: FileVersion[];
  links: FileLink[];
  auditEvents?: FileAuditEvent[];
}

export interface FileVersion {
  id: string;
  fileAssetId: string;
  versionNumber: number;
  storageKey: string | null;
  uploadedById: string | null;
  uploadedAt: string;
  changeNote: string | null;
  sizeBytes: number | string | null;
  checksum: string | null;
  isCurrent: boolean;
}

export interface FileLink {
  id: string;
  fileAssetId: string;
  entityType: string;
  entityId: string;
  linkType: string;
  purposeOverride: string | null;
  isPrimary: boolean;
  linkedById: string | null;
  linkedAt: string;
  unlinkedAt: string | null;
}

export interface FileAuditEvent {
  id: string;
  fileAssetId: string;
  actorId: string | null;
  action: string;
  metadata: unknown;
  createdAt: string;
}

export interface FileAssetGrantRow {
  id: string;
  fileAssetId: string;
  granteeEmployeeId: string;
  granteeLabel?: string;
  grantedById: string | null;
  permission: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export type DriveZipExportJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type DriveZipExportKind =
  | 'drive.selection_zip'
  | 'drive.project_zip'
  | 'drive.product_zip'
  | 'drive.client_zip'
  | 'drive.finance_zip'
  | 'drive.task_attachments_zip';

export interface CreateDriveZipExportInput {
  fileIds?: string[];
  exportKind?: DriveZipExportKind;
  exportParams?: Record<string, string>;
}

export interface DriveZipExportJobSummary {
  id: string;
  status: DriveZipExportJobStatus;
  requestedById?: string;
  fileIds: unknown;
  accessSnapshot?: { exportKind?: string; exportParams?: Record<string, string> };
  errorMessage: string | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  fileAsset: { id: string; displayName: string; mimeType: string | null } | null;
}

export interface DriveCleanupCandidateItem {
  id: string;
  kind: string;
  label: string;
  detail?: string;
  sizeBytes?: string | null;
  createdAt?: string;
}

export interface DriveCleanupCandidateCategory {
  kind: string;
  label: string;
  count: number;
  preview: DriveCleanupCandidateItem[];
}

export interface DriveFolder {
  id: string;
  name: string;
  space: 'COMPANY' | 'PERSONAL';
  ownerId: string | null;
  createdById: string | null;
  parentId: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DriveFolderListParams = {
  space?: 'COMPANY' | 'PERSONAL';
  parentId?: string | null;
  scopeEntityType?: string;
  scopeEntityId?: string;
};

export interface DriveFolderListing {
  space: 'COMPANY' | 'PERSONAL';
  parentId: string | null;
  scopeEntityType?: string | null;
  scopeEntityId?: string | null;
  folders: DriveFolder[];
  files: FileAsset[];
  /** Internal bucket for files shown at drive root (parentId null in UI). */
  rootStorageFolderId?: string;
}

export interface DriveFolderTreeResponse {
  space: 'COMPANY' | 'PERSONAL';
  scopeEntityType?: string | null;
  scopeEntityId?: string | null;
  folders: DriveFolder[];
}

export const driveApi = {
  async getProjectDriveHubSummary(projectId: string): Promise<{
    projectId: string;
    projectCode: string;
    projectName: string;
    deals: { id: string; label: string; fileCount: number }[];
    products: {
      id: string;
      label: string;
      fileCount: number;
      extensions: { id: string; label: string; fileCount: number }[];
    }[];
    client: { id: string; label: string; fileCount: number; entityType: 'COMPANY' | 'CONTACT' }[];
    tasks: { id: string; label: string; fileCount: number }[];
    invoices: { id: string; label: string; fileCount: number }[];
  }> {
    const resp = await api.get(`/api/drive/project-hub/${encodeURIComponent(projectId)}`);
    return resp.data;
  },

  async listFileAssets(params?: {
    entityType?: string;
    entityId?: string;
    purpose?: string;
    status?: string;
    sourceModule?: string;
    search?: string;
    sharedWithMe?: boolean;
    projectHubProjectFiles?: boolean;
    projectId?: string;
    trash?: boolean;
  }): Promise<FileAsset[]> {
    if (params?.trash === true) {
      const resp = await api.get<FileAsset[]>('/api/drive/files', {
        params: {
          search: params.search,
          purpose: params.purpose,
          trash: 'true',
        },
      });
      return resp.data;
    }
    const resp = await api.get<FileAsset[]>('/api/drive/files', { params });
    return resp.data;
  },

  async getLibraryContextSummary(params: {
    entityType: string;
    entityId: string;
  }): Promise<{ purpose: string; count: number }[]> {
    const resp = await api.get<{ purpose: string; count: number }[]>(
      '/api/drive/files/context-summary',
      { params },
    );
    return resp.data;
  },

  async getDriveCleanupSummary(): Promise<{
    failedUploadSessions: number;
    expiredPendingUploadSessions: number;
  }> {
    const resp = await api.get<{
      failedUploadSessions: number;
      expiredPendingUploadSessions: number;
    }>('/api/drive/cleanup-summary');
    return resp.data;
  },

  async createFileAssetGrant(
    fileId: string,
    body: { granteeEmployeeId: string; permission?: string },
  ): Promise<FileAssetGrantRow> {
    const resp = await api.post<FileAssetGrantRow>(
      '/api/drive/files/' + encodeURIComponent(fileId) + '/grants',
      body,
    );
    return resp.data;
  },

  async listFileAssetGrants(fileId: string): Promise<FileAssetGrantRow[]> {
    const resp = await api.get<FileAssetGrantRow[]>(
      '/api/drive/files/' + encodeURIComponent(fileId) + '/grants',
    );
    return resp.data;
  },

  async revokeFileAssetGrant(fileId: string, grantId: string): Promise<FileAssetGrantRow> {
    const resp = await api.delete<FileAssetGrantRow>(
      '/api/drive/files/' + encodeURIComponent(fileId) + '/grants/' + encodeURIComponent(grantId),
    );
    return resp.data;
  },

  async listDriveLibrary(contextType: string, contextId: string): Promise<FileAsset[]> {
    const resp = await api.get<FileAsset[]>('/api/drive/library', {
      params: { contextType, contextId },
    });
    return resp.data;
  },

  async listFolder(params: DriveFolderListParams): Promise<DriveFolderListing> {
    const resp = await api.get<DriveFolderListing>('/api/drive/folders', {
      params: {
        space: params.space,
        parentId: params.parentId ?? 'root',
        scopeEntityType: params.scopeEntityType,
        scopeEntityId: params.scopeEntityId,
      },
    });
    return resp.data;
  },

  async listFolderTree(params: DriveFolderListParams): Promise<DriveFolderTreeResponse> {
    const resp = await api.get<DriveFolderTreeResponse>('/api/drive/folders/tree', {
      params: {
        space: params.space,
        scopeEntityType: params.scopeEntityType,
        scopeEntityId: params.scopeEntityId,
      },
    });
    return resp.data;
  },

  async createFolder(data: {
    name: string;
    space?: 'COMPANY' | 'PERSONAL';
    parentId?: string | null;
    scopeEntityType?: string;
    scopeEntityId?: string;
  }): Promise<DriveFolder> {
    const resp = await api.post<DriveFolder>('/api/drive/folders', data);
    return resp.data;
  },

  async renameFolder(folderId: string, data: { name: string }): Promise<DriveFolder> {
    const resp = await api.patch<DriveFolder>(
      '/api/drive/folders/' + encodeURIComponent(folderId),
      data,
    );
    return resp.data;
  },

  async deleteFolder(folderId: string): Promise<void> {
    await api.delete('/api/drive/folders/' + encodeURIComponent(folderId));
  },

  async moveFolderFile(data: {
    sourceFolderId: string;
    targetFolderId: string;
    fileId: string;
  }): Promise<FileAsset> {
    const resp = await api.post<FileAsset>(
      '/api/drive/folders/' +
        encodeURIComponent(data.sourceFolderId) +
        '/files/' +
        encodeURIComponent(data.fileId) +
        '/move',
      { sourceFolderId: data.sourceFolderId, targetFolderId: data.targetFolderId },
    );
    return resp.data;
  },

  async copyFolderFile(data: { targetFolderId: string; fileId: string }): Promise<FileAsset> {
    const resp = await api.post<FileAsset>(
      '/api/drive/folders/' +
        encodeURIComponent(data.targetFolderId) +
        '/files/' +
        encodeURIComponent(data.fileId) +
        '/copy',
      { targetFolderId: data.targetFolderId },
    );
    return resp.data;
  },

  async removeFolderFile(folderId: string, fileId: string): Promise<void> {
    await api.delete(
      '/api/drive/folders/' + encodeURIComponent(folderId) + '/files/' + encodeURIComponent(fileId),
    );
  },

  async createUploadSession(data: {
    fileName: string;
    contentType: string;
    entityType?: string;
    entityId?: string;
    folderId?: string;
    displayName?: string;
    purpose?: string;
    sourceModule?: string;
    visibility?: string;
    confidentiality?: string;
    linkType?: string;
  }): Promise<{
    sessionId: string;
    uploadUrl: string;
    storageKey: string;
    expiresAt: string;
    publicUrl: string;
  }> {
    const resp = await api.post('/api/drive/upload-sessions', data);
    return resp.data;
  },

  async completeUploadSession(
    sessionId: string,
    data?: { sizeBytes?: number; checksum?: string },
  ): Promise<FileAsset> {
    const resp = await api.post<FileAsset>(
      '/api/drive/upload-sessions/' + encodeURIComponent(sessionId) + '/complete',
      data ?? {},
    );
    return resp.data;
  },

  async failUploadSession(sessionId: string, reason?: string): Promise<void> {
    await api.post('/api/drive/upload-sessions/' + encodeURIComponent(sessionId) + '/fail', {
      reason,
    });
  },

  async getFileAsset(id: string): Promise<FileAsset> {
    const resp = await api.get<FileAsset>('/api/drive/files/' + encodeURIComponent(id));
    return resp.data;
  },

  async getFileAssetPreviewUrl(
    id: string,
    params?: { forDocumentId?: string },
  ): Promise<{ url: string; mimeType: string | null }> {
    const resp = await api.get<{ url: string; mimeType: string | null }>(
      '/api/drive/files/' + encodeURIComponent(id) + '/preview-url',
      {
        params:
          params?.forDocumentId !== undefined && params.forDocumentId !== ''
            ? { forDocumentId: params.forDocumentId }
            : undefined,
      },
    );
    return resp.data;
  },

  async createVersionUploadUrl(
    id: string,
    data: { fileName: string; contentType: string },
  ): Promise<{ uploadUrl: string; storageKey: string; expiresInSeconds: number }> {
    const resp = await api.post<{
      uploadUrl: string;
      storageKey: string;
      expiresInSeconds: number;
    }>('/api/drive/files/' + encodeURIComponent(id) + '/version-upload-url', data);
    return resp.data;
  },

  async completeFileVersion(
    id: string,
    data: { storageKey: string; sizeBytes?: number; checksum?: string; changeNote?: string },
  ): Promise<FileAsset> {
    const resp = await api.post<FileAsset>(
      '/api/drive/files/' + encodeURIComponent(id) + '/versions',
      data,
    );
    return resp.data;
  },

  async createFileAsset(data: {
    displayName: string;
    originalName?: string;
    fileType?: string;
    purpose?: string;
    sourceModule?: string;
    ownerId?: string;
    createdById?: string;
    visibility?: string;
    confidentiality?: string;
    storageKey?: string;
    externalUrl?: string;
    mimeType?: string;
    sizeBytes?: number;
    checksum?: string;
    link?: {
      entityType: string;
      entityId: string;
      linkType?: string;
      purposeOverride?: string;
      isPrimary?: boolean;
      linkedById?: string;
    };
  }): Promise<FileAsset> {
    const resp = await api.post<FileAsset>('/api/drive/files', data);
    return resp.data;
  },

  async linkFileAsset(
    id: string,
    data: {
      entityType: string;
      entityId: string;
      linkType?: string;
      purposeOverride?: string;
      isPrimary?: boolean;
      linkedById?: string;
    },
  ): Promise<FileLink> {
    const resp = await api.post<FileLink>(
      '/api/drive/files/' + encodeURIComponent(id) + '/links',
      data,
    );
    return resp.data;
  },

  async unlinkFileAsset(id: string, linkId: string): Promise<void> {
    await api.delete(
      '/api/drive/files/' + encodeURIComponent(id) + '/links/' + encodeURIComponent(linkId),
    );
  },

  async archiveFileAsset(id: string, actorId?: string): Promise<FileAsset> {
    const resp = await api.post<FileAsset>(
      '/api/drive/files/' + encodeURIComponent(id) + '/archive',
      { actorId },
    );
    return resp.data;
  },

  async restoreFileAsset(id: string, actorId?: string): Promise<FileAsset> {
    const resp = await api.post<FileAsset>(
      '/api/drive/files/' + encodeURIComponent(id) + '/restore',
      { actorId },
    );
    return resp.data;
  },

  async archiveFileAssets(ids: string[], actorId?: string): Promise<{ updated: FileAsset[] }> {
    const resp = await api.post<{ updated: FileAsset[] }>('/api/drive/files/archive-batch', {
      ids,
      actorId,
    });
    return resp.data;
  },

  async restoreFileAssets(ids: string[], actorId?: string): Promise<{ updated: FileAsset[] }> {
    const resp = await api.post<{ updated: FileAsset[] }>('/api/drive/files/restore-batch', {
      ids,
      actorId,
    });
    return resp.data;
  },

  async addFileToFolder(folderId: string, fileAssetId: string): Promise<unknown> {
    const resp = await api.post('/api/drive/folders/' + encodeURIComponent(folderId) + '/files', {
      fileAssetId,
    });
    return resp.data;
  },

  async getLibraryLinkAggregates(params: {
    entityType: string;
    entityId: string;
  }): Promise<{ entityType: string; entityId: string; count: number }[]> {
    const resp = await api.get('/api/drive/files/library-link-aggregates', { params });
    return resp.data;
  },

  async purgeDriveCleanup(
    kind: 'expired-pending' | 'failed',
  ): Promise<{ deleted: number; kind: string }> {
    const resp = await api.post('/api/drive/cleanup/purge/' + encodeURIComponent(kind));
    return resp.data;
  },

  async createDriveZipExport(
    input: CreateDriveZipExportInput | string[],
  ): Promise<DriveZipExportJobSummary> {
    const body = Array.isArray(input) ? { fileIds: input } : input;
    const resp = await api.post<DriveZipExportJobSummary>('/api/drive/zip-exports', body);
    return resp.data;
  },

  async cancelDriveZipExport(jobId: string): Promise<DriveZipExportJobSummary> {
    const resp = await api.post<DriveZipExportJobSummary>(
      '/api/drive/zip-exports/' + encodeURIComponent(jobId) + '/cancel',
      {},
    );
    return resp.data;
  },

  async listDriveCleanupCandidates(): Promise<{ categories: DriveCleanupCandidateCategory[] }> {
    const resp = await api.get<{ categories: DriveCleanupCandidateCategory[] }>(
      '/api/drive/cleanup/candidates',
    );
    return resp.data;
  },

  async applyDriveCleanup(input: {
    kind: string;
    ids?: string[];
    applyAll?: boolean;
  }): Promise<{ kind: string; applied: number; skipped: number; ids: string[] }> {
    const resp = await api.post<{
      kind: string;
      applied: number;
      skipped: number;
      ids: string[];
    }>('/api/drive/cleanup/apply', input);
    return resp.data;
  },

  async listDriveZipExportJobs(): Promise<DriveZipExportJobSummary[]> {
    const resp = await api.get<DriveZipExportJobSummary[]>('/api/drive/zip-exports');
    return resp.data;
  },

  async getDriveZipExportJob(id: string): Promise<DriveZipExportJobSummary> {
    const resp = await api.get<DriveZipExportJobSummary>(
      '/api/drive/zip-exports/' + encodeURIComponent(id),
    );
    return resp.data;
  },

  async permanentlyDeleteFileAsset(id: string): Promise<FileAsset> {
    const resp = await api.post<FileAsset>(
      '/api/drive/files/' + encodeURIComponent(id) + '/permanent-delete',
    );
    return resp.data;
  },

  async getDriveLifecycleCounts(): Promise<{ archived: number; trash: number }> {
    const resp = await api.get<{ archived: number; trash: number }>('/api/drive/lifecycle-counts');
    return resp.data;
  },

  async restoreTrashFileAsset(id: string): Promise<FileAsset> {
    const resp = await api.post<FileAsset>(
      '/api/drive/files/' + encodeURIComponent(id) + '/restore-from-trash',
      {},
    );
    return resp.data;
  },

  async restoreTrashFileAssets(ids: string[]): Promise<{ updated: FileAsset[] }> {
    const resp = await api.post<{ updated: FileAsset[] }>('/api/drive/files/restore-trash-batch', {
      ids,
    });
    return resp.data;
  },

  async moveFileAssetsToTrash(ids: string[]): Promise<{ updated: FileAsset[] }> {
    const resp = await api.post<{ updated: FileAsset[] }>('/api/drive/files/move-to-trash-batch', {
      ids,
    });
    return resp.data;
  },
};
