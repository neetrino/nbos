import { api } from '../api';

export interface DashboardMetricProjection {
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

export interface DashboardControlCenterProjection {
  metrics: DashboardMetricProjection;
  priorities: DashboardPriorityProjection[];
  preference: DashboardPreferenceProjection;
  personalLinks: DashboardPersonalLink[];
  meta: {
    source: 'module-projections';
    generatedAt: string;
  };
}

export interface DashboardPreferenceProjection {
  pinnedActionOrder: string[];
  hiddenPinnedActions: string[];
  visibleWidgets: string[];
  hiddenWidgets: string[];
  compactWidgets: string[];
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

export interface UpdateDashboardPreferencePayload {
  pinnedActionOrder?: string[];
  hiddenPinnedActions?: string[];
  visibleWidgets?: string[];
  hiddenWidgets?: string[];
  compactWidgets?: string[];
}

export interface CreatePersonalLinkPayload {
  label: string;
  url: string;
  placement?: string[];
  openInNewTab?: boolean;
}

export const dashboardApi = {
  async getControlCenter(): Promise<DashboardControlCenterProjection> {
    const response = await api.get<DashboardControlCenterProjection>(
      '/api/dashboard/control-center',
    );
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
};
