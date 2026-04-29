import { api } from '../api';

export interface DocumentSection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  /** Who can see documents in this section by default (RBAC VIEW still applies). */
  defaultListScope?: string;
}

export interface DocumentTag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface DocumentListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  description?: string | null;
  plainText?: string | null;
  createdById: string | null;
  ownerId?: string | null;
  updatedById?: string | null;
  updatedAt: string;
  section: { id: string; name: string; slug: string; sortOrder: number };
  tagLinks?: Array<{ tag: { id: string; name: string; slug: string } }>;
  /** Present when list was requested with `search` (server-computed excerpt). */
  searchSnippet?: string | null;
}

export interface DocumentActivityItem {
  id: string;
  action: string;
  actorId: string | null;
  createdAt: string;
  metadata: unknown;
}

export interface DocumentAttachmentItem {
  id: string;
  purpose: string;
  sortOrder: number;
  fileAsset: {
    id: string;
    displayName: string;
    originalName: string | null;
    mimeType: string | null;
    fileType: string;
    sizeBytes: string | number | null;
  };
}

export interface DocumentDetail {
  id: string;
  title: string;
  slug: string;
  status: string;
  description: string | null;
  type: string;
  contentJson: unknown;
  contentHtml: string | null;
  plainText: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  createdById: string | null;
  ownerId?: string | null;
  updatedById?: string | null;
  section: { id: string; name: string; slug: string; sortOrder: number };
  tagLinks: Array<{ tag: DocumentTag }>;
  attachments: DocumentAttachmentItem[];
  activityEvents: DocumentActivityItem[];
  /** False when RBAC hides the activity feed (`DOCUMENTS_VIEW_ACTIVITY` NONE with no VIEW fallback). */
  activityRevealed?: boolean;
}

export const documentsApi = {
  async listSections(): Promise<DocumentSection[]> {
    const resp = await api.get<DocumentSection[]>('/api/documents/sections');
    return resp.data;
  },

  async updateDocumentSection(
    sectionId: string,
    data: { defaultListScope: string },
  ): Promise<DocumentSection> {
    const resp = await api.patch<DocumentSection>(
      '/api/documents/sections/' + encodeURIComponent(sectionId),
      data,
    );
    return resp.data;
  },

  async listTags(): Promise<DocumentTag[]> {
    const resp = await api.get<DocumentTag[]>('/api/documents/tags');
    return resp.data;
  },

  async listDocuments(params?: {
    sectionId?: string;
    status?: string;
    search?: string;
    includeArchived?: boolean;
  }): Promise<DocumentListItem[]> {
    const resp = await api.get<DocumentListItem[]>('/api/documents', { params });
    return resp.data;
  },

  async getDocument(id: string): Promise<DocumentDetail> {
    const resp = await api.get<DocumentDetail>('/api/documents/' + encodeURIComponent(id));
    return resp.data;
  },

  async createDocument(data: {
    title: string;
    sectionId: string;
    type?: string;
    description?: string;
  }): Promise<DocumentDetail> {
    const resp = await api.post<DocumentDetail>('/api/documents', data);
    return resp.data;
  },

  async updateDocument(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      sectionId?: string;
      listScopeOverride?: string | null;
      contentJson?: unknown;
      contentHtml?: string | null;
      plainText?: string | null;
      status?: string;
      recordActivity?: boolean;
    },
  ): Promise<DocumentDetail> {
    const resp = await api.patch<DocumentDetail>('/api/documents/' + encodeURIComponent(id), data);
    return resp.data;
  },

  async archiveDocument(id: string): Promise<DocumentDetail> {
    const resp = await api.post<DocumentDetail>(
      '/api/documents/' + encodeURIComponent(id) + '/archive',
      {},
    );
    return resp.data;
  },

  async addDocumentAttachment(
    documentId: string,
    data: { fileAssetId: string; purpose?: string; sortOrder?: number },
  ): Promise<DocumentDetail> {
    const resp = await api.post<DocumentDetail>(
      '/api/documents/' + encodeURIComponent(documentId) + '/attachments',
      data,
    );
    return resp.data;
  },

  async removeDocumentAttachment(documentId: string, attachmentId: string): Promise<void> {
    await api.delete(
      '/api/documents/' +
        encodeURIComponent(documentId) +
        '/attachments/' +
        encodeURIComponent(attachmentId),
    );
  },
};
