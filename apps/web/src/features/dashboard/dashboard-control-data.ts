import { dashboardApi } from '@/lib/api/dashboard';
import type {
  DashboardData,
  DashboardPersonalLink,
  DashboardPreference,
  PriorityCard,
} from './dashboard-control-registry';

export async function loadDashboardControlData(): Promise<{
  metrics: DashboardData;
  priorities: PriorityCard[];
  preference: DashboardPreference;
  personalLinks: DashboardPersonalLink[];
}> {
  const projection = await dashboardApi.getControlCenter();
  return {
    metrics: projection.metrics,
    priorities: projection.priorities,
    preference: projection.preference,
    personalLinks: projection.personalLinks,
  };
}
