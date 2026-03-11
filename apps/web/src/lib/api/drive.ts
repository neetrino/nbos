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

export const driveApi = {
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
