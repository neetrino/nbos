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
  personalLinks: DashboardPersonalLinkProjection[];
  notes: DashboardNoteProjection[];
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

export interface DashboardPersonalLinkProjection {
  id: string;
  label: string;
  url: string;
  placement: string[];
  openInNewTab: boolean;
  isExternal: boolean;
}

export interface DashboardNoteProjection {
  id: string;
  content: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
