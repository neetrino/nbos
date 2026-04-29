import { describe, expect, it } from 'vitest';
import { buildFinanceDashboardCsvContent } from './export-finance-dashboard-csv';
import type { FinanceDashboardData } from '@/features/finance/components/dashboard/finance-dashboard-data';

function minimalDashboard(): FinanceDashboardData {
  return {
    totalRevenue: 100,
    outstandingAmount: 20,
    overdueAmount: 5,
    monthlyRecurringRevenue: 30,
    reconciliation: {
      orderCount: 2,
      orderAmount: 200,
      invoicedAmount: 150,
      paidAmount: 80,
      uninvoicedAmount: 50,
      outstandingAmount: 70,
      fullyInvoicedCount: 1,
      fullyPaidCount: 0,
      warnings: [{ code: 'UNINVOICED_ORDERS', message: 'One uninvoiced', count: 1 }],
    },
    invoiceStatusItems: [{ label: 'Paid', count: 1, amount: 100, color: 'x', pct: 50 }],
    recentPayments: [
      {
        id: 'pay-1',
        client: 'Acme',
        invoice: 'INV-1',
        amount: 10,
        dateLabel: '1d ago',
      },
    ],
    upcomingInvoices: [
      {
        id: 'inv-1',
        invoice: 'INV-2',
        client: 'Beta',
        amount: 25,
        dueDateLabel: 'May 1',
        daysLeft: 3,
      },
    ],
    payrollRuns: {
      runCount: 1,
      totalPayable: 100,
      totalPaid: 60,
      totalRemaining: 40,
    },
  };
}

describe('buildFinanceDashboardCsvContent', () => {
  it('includes meta, kpis, and snapshot sections', () => {
    const csv = buildFinanceDashboardCsvContent(minimalDashboard(), { period: 'month' });
    expect(csv).toContain('section,col1');
    expect(csv).toContain('meta,period,month');
    expect(csv).toContain('kpi,totalRevenue,100.00');
    expect(csv).toContain('invoice_status,Paid,1,100.00,50');
    expect(csv).toContain('reconciliation,orderCount,2');
    expect(csv).toContain('reconciliation_warning,UNINVOICED_ORDERS');
    expect(csv).toContain('recent_payment,pay-1');
    expect(csv).toContain('upcoming_invoice,inv-1');
    expect(csv).toContain('May 1 (3d)');
  });
});
