import { api } from '../api';

export interface DocumentSection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
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
  createdById: string | null;
  updatedAt: string;
  section: { id: string; name: string; slug: string; sortOrder: number };
}

export interface DocumentActivityItem {
  id: string;
  action: string;
  actorId: string | null;
  createdAt: string;
  metadata: unknown;
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
  section: { id: string; name: string; slug: string; sortOrder: number };
  tagLinks: Array<{ tag: DocumentTag }>;
  activityEvents: DocumentActivityItem[];
}

export const documentsApi = {
  async listSections(): Promise<DocumentSection[]> {
    const resp = await api.get<DocumentSection[]>('/api/documents/sections');
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
};
