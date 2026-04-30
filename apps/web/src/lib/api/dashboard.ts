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

export interface UpdateDashboardPreferencePayload {
  pinnedActionOrder?: string[];
  hiddenPinnedActions?: string[];
  visibleWidgets?: string[];
  hiddenWidgets?: string[];
  compactWidgets?: string[];
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
};
