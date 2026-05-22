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
  personalLinks: DashboardPersonalLinkProjection[];
  notes: DashboardNoteProjection[];
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

export interface NavigationShellProjection {
  sidebarModuleOrder: string[];
  hiddenSidebarModules: string[];
  personalLinks: DashboardPersonalLinkProjection[];
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
