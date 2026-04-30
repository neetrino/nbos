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
  meta: {
    source: 'module-projections';
    generatedAt: string;
  };
}

export const dashboardApi = {
  async getControlCenter(): Promise<DashboardControlCenterProjection> {
    const response = await api.get<DashboardControlCenterProjection>(
      '/api/dashboard/control-center',
    );
    return response.data;
  },
};
