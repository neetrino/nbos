import { api } from '../api';

export interface DriveFileEntry {
  key: string;
  name: string;
  size: number;
  lastModified: string | undefined;
  isFolder: boolean;
}

export interface DriveFolderNode {
  name: string;
  path: string;
  children: DriveFolderNode[];
  files: DriveFileEntry[];
}

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

export const driveApi = {
  async listFileAssets(params?: {
    entityType?: string;
    entityId?: string;
    purpose?: string;
    status?: string;
    sourceModule?: string;
    search?: string;
  }): Promise<FileAsset[]> {
    const resp = await api.get<FileAsset[]>('/api/drive/files', { params });
    return resp.data;
  },

  async getFileAsset(id: string): Promise<FileAsset> {
    const resp = await api.get<FileAsset>('/api/drive/files/' + encodeURIComponent(id));
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

  async listFiles(projectId: string, prefix?: string): Promise<DriveFileEntry[]> {
    const resp = await api.get<DriveFileEntry[]>('/api/drive/' + encodeURIComponent(projectId), {
      params: prefix ? { prefix } : undefined,
    });
    return resp.data;
  },

  async getStructure(projectId: string): Promise<DriveFolderNode> {
    const resp = await api.get<DriveFolderNode>(
      '/api/drive/' + encodeURIComponent(projectId) + '/structure',
    );
    return resp.data;
  },

  async getUploadUrl(
    projectId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const resp = await api.post<{ uploadUrl: string; key: string; publicUrl: string }>(
      '/api/drive/' + encodeURIComponent(projectId) + '/upload-url',
      { fileName, contentType },
    );
    return resp.data;
  },

  async getDownloadUrl(projectId: string, filePath: string): Promise<{ downloadUrl: string }> {
    const resp = await api.get<{ downloadUrl: string }>(
      '/api/drive/' + encodeURIComponent(projectId) + '/download-url',
      { params: { path: filePath } },
    );
    return resp.data;
  },

  async deleteFile(projectId: string, filePath: string): Promise<void> {
    await api.delete('/api/drive/' + encodeURIComponent(projectId), {
      params: { path: filePath },
    });
  },
};
