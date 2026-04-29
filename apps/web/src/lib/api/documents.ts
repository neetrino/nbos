import { api } from '../api';

export interface DocumentSection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export interface DocumentListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  section: { id: string; name: string; slug: string; sortOrder: number };
}

export const documentsApi = {
  async listSections(): Promise<DocumentSection[]> {
    const resp = await api.get<DocumentSection[]>('/api/documents/sections');
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

  async getDocument(id: string): Promise<unknown> {
    const resp = await api.get('/api/documents/' + encodeURIComponent(id));
    return resp.data;
  },

  async createDocument(data: {
    title: string;
    sectionId: string;
    type?: string;
    description?: string;
  }): Promise<unknown> {
    const resp = await api.post('/api/documents', data);
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
    },
  ): Promise<unknown> {
    const resp = await api.patch('/api/documents/' + encodeURIComponent(id), data);
    return resp.data;
  },

  async archiveDocument(id: string): Promise<unknown> {
    const resp = await api.post('/api/documents/' + encodeURIComponent(id) + '/archive', {});
    return resp.data;
  },
};
