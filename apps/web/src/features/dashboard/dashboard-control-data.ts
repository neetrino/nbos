import { dashboardApi } from '@/lib/api/dashboard';
import type {
  DashboardData,
  DashboardNote,
  DashboardPersonalLink,
  DashboardPreference,
  PriorityCard,
} from './dashboard-control-registry';

export type DashboardControlProjection = {
  metrics: DashboardData;
  priorities: PriorityCard[];
  preference: DashboardPreference;
  personalLinks: DashboardPersonalLink[];
  notes: DashboardNote[];
};

export async function loadDashboardControlData(): Promise<DashboardControlProjection> {
  const projection = await dashboardApi.getControlCenter();
  return toDashboardControlProjection(projection);
}

export async function loadDashboardControlMetrics(): Promise<
  Pick<DashboardControlProjection, 'metrics' | 'priorities'>
> {
  const projection = await dashboardApi.getControlCenterMetrics();
  return {
    metrics: projection.metrics,
    priorities: projection.priorities,
  };
}

function toDashboardControlProjection(
  projection: Awaited<ReturnType<typeof dashboardApi.getControlCenter>>,
): DashboardControlProjection {
  return {
    metrics: projection.metrics,
    priorities: projection.priorities,
    preference: projection.preference,
    personalLinks: projection.personalLinks,
    notes: projection.notes ?? [],
  };
}
