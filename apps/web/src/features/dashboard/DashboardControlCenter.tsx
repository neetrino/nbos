'use client';

import {
  DashboardControlCenterView,
  DashboardLoadingSkeleton,
} from './components/DashboardControlCenterView';
import { useDashboardControlCenter } from './use-dashboard-control-center';

export function DashboardControlCenter() {
  const dashboard = useDashboardControlCenter();

  if (dashboard.loading && dashboard.data == null) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <DashboardControlCenterView
      actions={dashboard.actions}
      applyPinnedLayout={dashboard.applyPinnedLayout}
      applyWidgetLayout={dashboard.applyWidgetLayout}
      data={dashboard.data}
      deleteDashboardNote={dashboard.deleteDashboardNote}
      error={dashboard.error}
      hiddenActions={dashboard.hiddenActions}
      hiddenMiniMetrics={dashboard.hiddenMiniMetrics}
      notes={dashboard.notes}
      personalLinks={dashboard.personalLinks}
      priorities={dashboard.priorities}
      savingPreference={dashboard.savingPreference}
      visibleMiniMetrics={dashboard.visibleMiniMetrics}
      createDashboardNote={dashboard.createDashboardNote}
      createPersonalLink={dashboard.createPersonalLink}
      deletePersonalLink={dashboard.deletePersonalLink}
      reorderDashboardNotes={dashboard.reorderDashboardNotes}
      updateDashboardNote={dashboard.updateDashboardNote}
    />
  );
}
