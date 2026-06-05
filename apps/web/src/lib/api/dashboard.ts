import { api } from '../api';

export interface DashboardMetricProjection {
  leads: number;
  dueTodayTasks: number;
  openTasks: number;
  openDeals: number;
  pendingInvoices: number;
  openTickets: number;
  criticalTickets: number;
}

export interface DashboardPriorityProjection {
  title: string;
  context: string;
  href: string;
  severity: 'critical' | 'high' | 'normal';
  source: string;
}

export interface DashboardControlCenterMeta {
  source: 'module-projections';
  generatedAt: string;
}

export interface DashboardMetricsProjection {
  metrics: DashboardMetricProjection;
  priorities: DashboardPriorityProjection[];
  meta: DashboardControlCenterMeta;
}

export interface DashboardControlCenterProjection {
  metrics: DashboardMetricProjection;
  priorities: DashboardPriorityProjection[];
  preference: DashboardPreferenceProjection;
  personalLinks: DashboardPersonalLink[];
  notes: DashboardNote[];
  meta: DashboardControlCenterMeta;
}

export interface DashboardPreferenceProjection {
  pinnedActionOrder: string[];
  hiddenPinnedActions: string[];
  visibleWidgets: string[];
  hiddenWidgets: string[];
  compactWidgets: string[];
  sidebarModuleOrder: string[];
  hiddenSidebarModules: string[];
  defaultDashboardMode: string;
}

export interface DashboardPersonalLink {
  id: string;
  label: string;
  url: string;
  placement: string[];
  openInNewTab: boolean;
  isExternal: boolean;
}

export interface DashboardNote {
  id: string;
  content: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDashboardPreferencePayload {
  pinnedActionOrder?: string[];
  hiddenPinnedActions?: string[];
  visibleWidgets?: string[];
  hiddenWidgets?: string[];
  compactWidgets?: string[];
  sidebarModuleOrder?: string[];
  hiddenSidebarModules?: string[];
}

export interface CreatePersonalLinkPayload {
  label: string;
  url: string;
  placement?: string[];
  openInNewTab?: boolean;
}

export interface CreateDashboardNotePayload {
  content: string;
}

export interface UpdateDashboardNotePayload {
  content: string;
}

export interface ReorderDashboardNotesPayload {
  noteIds: string[];
}

export const dashboardApi = {
  async getControlCenter(): Promise<DashboardControlCenterProjection> {
    const response = await api.get<DashboardControlCenterProjection>(
      '/api/dashboard/control-center',
    );
    return response.data;
  },

  async getControlCenterMetrics(): Promise<DashboardMetricsProjection> {
    const response = await api.get<DashboardMetricsProjection>('/api/dashboard/control-center', {
      params: { scope: 'metrics' },
    });
    return response.data;
  },

  async updatePreference(
    payload: UpdateDashboardPreferencePayload,
  ): Promise<DashboardPreferenceProjection> {
    const response = await api.patch<DashboardPreferenceProjection>(
      '/api/dashboard/preferences',
      payload,
    );
    return response.data;
  },

  async createPersonalLink(payload: CreatePersonalLinkPayload): Promise<DashboardPersonalLink> {
    const response = await api.post<DashboardPersonalLink>(
      '/api/dashboard/personal-links',
      payload,
    );
    return response.data;
  },

  async deletePersonalLink(id: string): Promise<void> {
    await api.delete(`/api/dashboard/personal-links/${id}`);
  },

  async listNotes(): Promise<DashboardNote[]> {
    const response = await api.get<DashboardNote[]>('/api/dashboard/notes');
    return response.data;
  },

  async createNote(payload: CreateDashboardNotePayload): Promise<DashboardNote> {
    const response = await api.post<DashboardNote>('/api/dashboard/notes', payload);
    return response.data;
  },

  async updateNote(id: string, payload: UpdateDashboardNotePayload): Promise<DashboardNote> {
    const response = await api.patch<DashboardNote>(`/api/dashboard/notes/${id}`, payload);
    return response.data;
  },

  async reorderNotes(payload: ReorderDashboardNotesPayload): Promise<DashboardNote[]> {
    const response = await api.patch<DashboardNote[]>('/api/dashboard/notes/order', payload);
    return response.data;
  },

  async deleteNote(id: string): Promise<void> {
    await api.delete(`/api/dashboard/notes/${id}`);
  },
};
