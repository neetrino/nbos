import { describe, expect, it } from 'vitest';
import { MINI_METRICS, type DashboardData } from '../dashboard-control-registry';
import { buildMiniAnalyticsChart } from './mini-analytics-chart-data';

const chartData: DashboardData = {
  leads: 1200,
  dueTodayTasks: 0,
  openTasks: 0,
  openDeals: 0,
  pendingInvoices: 0,
  openTickets: 0,
  criticalTickets: 0,
};

describe('buildMiniAnalyticsChart', () => {
  it('formats the total with the active interface locale', () => {
    const metric = MINI_METRICS[0];
    const data = chartData;
    expect(buildMiniAnalyticsChart([metric], data, 'en-US').totalAmount).toBe(
      (1200).toLocaleString('en-US'),
    );
    expect(buildMiniAnalyticsChart([metric], data, 'ru-RU').totalAmount).toBe(
      (1200).toLocaleString('ru-RU'),
    );
  });
});
