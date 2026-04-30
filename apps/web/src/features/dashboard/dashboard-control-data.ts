import { dashboardApi } from '@/lib/api/dashboard';
import type { DashboardData, PriorityCard } from './dashboard-control-registry';

export async function loadDashboardControlData(): Promise<{
  metrics: DashboardData;
  priorities: PriorityCard[];
}> {
  const projection = await dashboardApi.getControlCenter();
  return { metrics: projection.metrics, priorities: projection.priorities };
}
